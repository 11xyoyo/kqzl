/**
 * 获取指定时间段的历史数据云函数
 * @param {Object} event 客户端上传的参数
 * @param {Object} context 包含了调用信息和运行状态等信息的对象
 */
exports.main = async (event, context) => {
    console.log('开始获取历史数据...');
    
    try {
        const { startTime, endTime, dataType } = event;
        
        // 参数验证
        if (!startTime || !endTime) {
            return {
                code: -1,
                message: '缺少必要的时间参数',
                data: null
            };
        }
        
        // 转换时间戳为Date对象
        const startDate = new Date(startTime);
        const endDate = new Date(endTime);
        
        console.log('查询时间范围:', {
            startTime: startDate.toISOString(),
            endTime: endDate.toISOString(),
            dataType: dataType || 'all'
        });
        
        // 连接云数据库
        const db = uniCloud.database();
        const collection = db.collection('data');
        
        // 构建查询条件 - 使用时间戳范围查询
        let query = collection.where({
            timestamp: db.command.gte(startTime).and(db.command.lte(endTime))
        });
        
        // 按时间排序
        query = query.orderBy('timestamp', 'asc');
        
        // 限制返回数量，避免数据过多
        query = query.limit(1000);
        
        // 执行查询
        const result = await query.get();
        
        console.log('查询到的数据条数:', result.data.length);
        
        if (result.data.length === 0) {
            return {
                code: 0,
                message: '指定时间段内没有数据',
                data: []
            };
        }
        
        // 处理数据格式，适配图表需求
        const chartData = result.data.map(item => {
            const timestamp = item.timestamp;
            const timeStr = new Date(timestamp).toLocaleString('zh-CN', {
                timeZone: 'Asia/Shanghai',
                hour12: false
            });
            
            return {
                timestamp: timestamp,
                time: timeStr,
                temperature: parseFloat(item.temperature || 0),
                humidity: parseFloat(item.humidity || 0),
                PM: parseFloat(item.PM || 0),
                form: parseFloat(item.form || 0),
                voc: parseFloat(item.voc || 0),
                uv: parseFloat(item.uv || 0),
                noise: parseFloat(item.noise || 0),
                lon: parseFloat(item.lon || 0),
                lat: parseFloat(item.lat || 0)
            };
        });
        
        // 根据数据类型过滤和格式化数据
        let filteredData = [];
        
        if (dataType === 'temperature') {
            filteredData = chartData.map(record => ({
                time: record.time,
                value: record.temperature || 0
            }));
        } else if (dataType === 'humidity') {
            filteredData = chartData.map(record => ({
                time: record.time,
                value: record.humidity || 0
            }));
        } else if (dataType === 'pm25') {
            filteredData = chartData.map(record => ({
                time: record.time,
                value: record.PM || 0
            }));
        } else if (dataType === 'formaldehyde') {
            filteredData = chartData.map(record => ({
                time: record.time,
                value: record.form || 0
            }));
        } else if (dataType === 'voc') {
            filteredData = chartData.map(record => ({
                time: record.time,
                value: record.voc || 0
            }));
        } else if (dataType === 'uv') {
            filteredData = chartData.map(record => ({
                time: record.time,
                value: record.uv || 0
            }));
        } else if (dataType === 'noise') {
            filteredData = chartData.map(record => ({
                time: record.time,
                value: record.noise || 0
            }));
        } else if (dataType === 'all') {
            // 返回所有类型的数据，按类型分组
            filteredData = {
                temperature: chartData.map(record => ({
                    time: record.time,
                    value: record.temperature || 0
                })),
                humidity: chartData.map(record => ({
                    time: record.time,
                    value: record.humidity || 0
                })),
                formaldehyde: chartData.map(record => ({
                    time: record.time,
                    value: record.form || 0
                })),
                voc: chartData.map(record => ({
                    time: record.time,
                    value: record.voc || 0
                })),
                uv: chartData.map(record => ({
                    time: record.time,
                    value: record.uv || 0
                })),
                noise: chartData.map(record => ({
                    time: record.time,
                    value: record.noise || 0
                }))
            };
        } else {
            filteredData = chartData;
        }
        
        // 根据数据类型处理日志和返回结果
        if (dataType === 'all') {
            console.log('处理后的数据样本:', {
                temperature: filteredData.temperature.slice(0, 2),
                humidity: filteredData.humidity.slice(0, 2)
            });
            
            return {
                code: 0,
                message: '历史数据获取成功',
                data: {
                    total: chartData.length,
                    list: filteredData,
                    timeRange: {
                        start: startDate.toISOString(),
                        end: endDate.toISOString()
                    }
                }
            };
        } else {
            console.log('处理后的数据样本:', filteredData.slice(0, 3));
            
            return {
                code: 0,
                message: '历史数据获取成功',
                data: {
                    total: filteredData.length,
                    list: filteredData,
                    timeRange: {
                        start: startDate.toISOString(),
                        end: endDate.toISOString()
                    }
                }
            };
        }
        
    } catch (error) {
        console.error('获取历史数据时发生错误:', error);
        
        return {
            code: -1,
            message: '获取历史数据时发生错误: ' + error.message,
            data: null
        };
    }
};