'use strict';

/**
 * 获取华为云IoT设备影子数据的云函数
 * @param {Object} event 客户端上传的参数
 * @param {Object} context 包含了调用信息和运行状态等信息的对象
 */
exports.main = async (event, context) => {
    console.log('开始获取设备影子数据...');
    
    try {
        const { token } = event;
        
        if (!token) {
            return {
                code: -1,
                message: '缺少必要的token参数',
                data: null
            };
        }
        
        // 设备影子数据请求URL
        const shadowUrl = 'https://c5291326ae.iotda-app.cn-south-4.myhuaweicloud.com/v5/iot/9a8b9ae393844bce8de80dbc4ed08df2/devices/detection_my_air/shadow';
        
        // 发起HTTP请求获取设备影子数据
        const response = await uniCloud.httpclient.request(shadowUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-Token': token
            },
            timeout: 10000
        });
        
        console.log('设备影子数据请求响应状态:', response.status);
        console.log('完整响应数据:', response.data);
        
        if (response.status === 200) {
            const responseData = response.data;
            
            // 处理Buffer格式的响应数据
            let parsedData;
            if (Buffer.isBuffer(responseData)) {
                // 如果是Buffer对象，直接转换为字符串然后解析为JSON
                const bufferString = responseData.toString('utf8');
                console.log('Buffer转换后的字符串:', bufferString);
                try {
                    parsedData = JSON.parse(bufferString);
                    console.log('解析后的JSON数据:', parsedData);
                } catch (parseError) {
                    console.log('JSON解析错误:', parseError);
                    return {
                        code: -1,
                        message: 'JSON数据解析失败',
                        data: null
                    };
                }
            } else if (responseData && responseData.type === 'Buffer' && responseData.data) {
                // 如果是包含Buffer数据的对象，从data数组创建Buffer
                const bufferString = Buffer.from(responseData.data).toString('utf8');
                console.log('Buffer转换后的字符串:', bufferString);
                try {
                    parsedData = JSON.parse(bufferString);
                    console.log('解析后的JSON数据:', parsedData);
                } catch (parseError) {
                    console.log('JSON解析错误:', parseError);
                    return {
                        code: -1,
                        message: 'JSON数据解析失败',
                        data: null
                    };
                }
            } else {
                parsedData = responseData;
            }
            
            // 检查数据结构
            if (!parsedData || !parsedData.shadow || !Array.isArray(parsedData.shadow) || parsedData.shadow.length === 0) {
                console.log('设备影子数据格式错误或为空:', parsedData);
                return {
                    code: -1,
                    message: '设备影子数据格式错误或为空',
                    data: null
                };
            }
            
            // 检查shadow[0]是否存在reported属性
            if (!parsedData.shadow[0].reported || !parsedData.shadow[0].reported.properties) {
                console.log('设备影子数据中缺少reported.properties:', parsedData.shadow[0]);
                return {
                    code: -1,
                    message: '设备影子数据中缺少reported.properties',
                    data: null
                };
            }
            
            const properties = parsedData.shadow[0].reported.properties;
            console.log('设备影子数据:', JSON.stringify(properties));
            
            // 解析设备属性数据
            const deviceData = {
                temperature: parseFloat(properties.tem || 0),
                humidity: parseFloat(properties.hum || 0),
/*                led: properties.led === true || properties.led === "true" || properties.led === 1 || properties.led === "1",
                fan: properties.fan === true || properties.fan === "true" || properties.fan === 1 || properties.fan === "1",
                water: properties.water === true || properties.water === "true" || properties.water === 1 || properties.water === "1",
                stat: properties.stat === true || properties.stat === "true" || properties.stat === 1 || properties.stat === "1", */
                PM: parseFloat(properties.PM || 0),//pm2.5浓度
                form: parseFloat(properties.form || 0),//甲醛浓度
                voc: parseFloat(properties.voc || 0),//voc浓度
                uv: parseFloat(properties.uv || 0),//紫外线
                noise: parseFloat(properties.noise || 0),//
                lon: parseFloat(properties.lon || 0),//经度
                lat: parseFloat(properties.lat || 0),//纬度
                timestamp: Date.now()
            };
            
            console.log('解析后的设备数据:', deviceData);
            
            // 将数据保存到云数据库
            try {
                console.log('开始保存数据到云数据库...');
                const db = uniCloud.database();
                const collection = db.collection('data');
                
                const dataToSave = {
                    ...deviceData,
                    create_time: new Date()
                };
                
                console.log('准备保存的数据:', JSON.stringify(dataToSave));
                
                const result = await collection.add(dataToSave);
                
                console.log('设备数据已成功保存到云数据库, 记录ID:', result.id);
            } catch (dbError) {
                console.error('保存数据到云数据库失败 - 错误类型:', dbError.name);
                console.error('保存数据到云数据库失败 - 错误信息:', dbError.message);
                console.error('保存数据到云数据库失败 - 完整错误:', JSON.stringify(dbError));
                // 即使保存失败，也返回设备数据
            }
            
            return {
                code: 0,
                message: '设备数据获取成功',
                data: deviceData
            };
            
        } else if (response.status === 401) {
            console.log('Token已过期或无效');
            return {
                code: 401,
                message: 'Token已过期或无效，需要重新获取',
                data: null
            };
        } else {
            console.error('获取设备数据失败，状态码:', response.status);
            return {
                code: -1,
                message: `获取设备数据失败，状态码: ${response.status}`,
                data: null
            };
        }
        
    } catch (error) {
        console.error('获取设备数据时发生错误:', error);
        
        // 检查是否是网络连接问题
        if (error.message && error.message.includes('ECONNREFUSED')) {
            return {
                code: -1,
                message: '网络连接失败，请检查网络设置',
                data: null
            };
        }
        
        return {
            code: -1,
            message: '获取设备数据时发生错误: ' + error.message,
            data: null
        };
    }
};