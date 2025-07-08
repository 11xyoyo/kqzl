<template>
    <view class="wrap">
        <!-- 页面顶部状态栏 -->
        <view class="status-bar">
            <view class="refresh-info">
                <text>最后更新: {{lastUpdateTime || '未更新'}}</text>
                <view class="refresh-button" @click="getShadow">
                    <text class="refresh-icon" :class="{refreshing: refreshing}">↻</text>
                </view>
            </view>
        </view>
        
        <!-- AQI空气质量指数显示区域 -->
        <view class="aqi-container">
            <view class="aqi-title">空气质量指数 (AQI)</view>
            <view class="aqi-content">
                <view class="aqi-value" :class="getAQILevel(aqi).class">{{aqi || '--'}}</view>
                <view class="aqi-level">{{getAQILevel(aqi).text}}</view>
                <view class="aqi-description">{{getAQILevel(aqi).description}}</view>
            </view>
        </view>
        
        <!-- UVI紫外线指数显示区域 -->
        <view class="uvi-container">
            <view class="uvi-title">紫外线指数 (UVI)</view>
            <view class="uvi-content">
                <view class="uvi-value" :class="getUVILevel(uvi).class">{{uvi || '--'}}</view>
                <view class="uvi-level">{{getUVILevel(uvi).text}}</view>
                <view class="uvi-description">{{getUVILevel(uvi).description}}</view>
            </view>
        </view>
        
        <!-- 地图显示区域 -->
        <view class="map-container">
            <view class="map-title">设备位置监控</view>
            <map 
                id="deviceMap"
                class="device-map"
                :longitude="currentLocation.longitude"
                :latitude="currentLocation.latitude"
                :scale="15"
                :markers="mapMarkers"
                :show-location="true"
                @markertap="onMarkerTap"
            >
            </map>
            <view class="map-legend">
                <view class="legend-item">
                    <view class="legend-dot current"></view>
                    <text class="legend-text">当前位置</text>
                </view>
                <view class="legend-item">
                    <view class="legend-dot history"></view>
                    <text class="legend-text">历史位置</text>
                </view>
            </view>
            <view class="location-info">
                <view class="location-item">
                    <view class="location-label">当前经度</view>
                    <view class="location-value">{{lon}}°</view>
                </view>
                <view class="location-item">
                    <view class="location-label">当前纬度</view>
                    <view class="location-value">{{lat}}°</view>
                </view>
            </view>
            <view class="location-update-time">更新于: {{lastUpdateTime || '未更新'}}</view>
        </view>
        
        <!-- 设备区域容器，包含所有设备卡片 -->        
        <view class="dev-area">
            <!-- 温度设备卡片，点击时跳转到折线图页面 -->
            <view class="dev-cart" @click="goLineChartTemp">
                <view class="">
                    <!-- 设备名称 -->
                    <view class="dev-name">温度</view>
                    <!-- 设备图标 -->
                    <image class="dev-logo" src="../../static/temp.png" mode=""></image>
                </view>
                <!-- 显示温度数据 -->
                <view class="dev-data">{{temp}} ℃</view>
            </view>

            <!-- 湿度设备卡片，点击时跳转到折线图页面 -->
            <view class="dev-cart" @click="goLineChartHumi">
                <view class="">
                    <!-- 设备名称 -->
                    <view class="dev-name">湿度</view>
                    <!-- 设备图标 -->
                    <image class="dev-logo" src="../../static/humi.png" mode=""></image>
                </view>
                <!-- 显示湿度数据 -->
                <view class="dev-data">{{humi}} %</view>
            </view>

            <!-- 台灯设备卡片已隐藏 -->
            <!-- <view class="dev-cart">
                <view class="">
                    <view class="dev-name">台灯</view>
                    <image class="dev-logo" src="../../static/lamp.png" mode=""></image>
                </view>
                <switch :checked="led" @change="onLedSwitch" color="#2b9939"/>
            </view> -->
			
			<!-- PM2.5设备卡片 -->
            <view class="dev-cart" @click="goLineChartPM">
                <view class="">
                    <!-- 设备名称 -->
                    <view class="dev-name">PM2.5</view>
                    <!-- 设备图标 -->
                    <image class="dev-logo" src="../../static/pm2.5.png" mode=""></image>
                </view>
                <!-- 显示PM2.5数据 -->
                <view class="dev-data">{{PM}} μg/m³</view>
            </view>

            <!-- 甲醛设备卡片 -->
            <view class="dev-cart" @click="goLineChartForm">
                <view class="">
                    <!-- 设备名称 -->
                    <view class="dev-name">甲醛</view>
                    <!-- 设备图标 -->
                    <image class="dev-logo" src="../../static/formaldehyde.png" mode=""></image>
                </view>
                <!-- 显示甲醛数据 -->
                <view class="dev-data">{{form}} mg/m³</view>
            </view>

            <!-- VOC设备卡片 -->
            <view class="dev-cart" @click="goLineChartVOC">
                <view class="">
                    <!-- 设备名称 -->
                    <view class="dev-name">VOC</view>
                    <!-- 设备图标 -->
                    <image class="dev-logo" src="../../static/voc.png" mode=""></image>
                </view>
                <!-- 显示VOC数据 -->
                <view class="dev-data">{{voc}} ppb</view>
            </view>

            <!-- 紫外线设备卡片 -->
            <view class="dev-cart" @click="goLineChartUV">
                <view class="">
                    <!-- 设备名称 -->
                    <view class="dev-name">紫外线</view>
                    <!-- 设备图标 -->
                    <image class="dev-logo" src="../../static/uv.png" mode=""></image>
                </view>
                <!-- 显示紫外线数据 -->
                <view class="dev-data">{{uv}} UV</view>
            </view>

            <!-- 噪声设备卡片 -->
            <view class="dev-cart" @click="goLineChartNoise">
                <view class="">
                    <!-- 设备名称 -->
                    <view class="dev-name">噪声</view>
                    <!-- 设备图标 -->
                    <image class="dev-logo" src="../../static/noise.png" mode=""></image>
                </view>
                <!-- 显示噪声数据 -->
                <view class="dev-data">{{noise}} dB</view>
            </view>


			
        </view>
    </view>
</template>


<script>
    export default {
        data() {
            return {
                // 温度数据
                temp: '',
                // 湿度数据
                humi: '',
                // 台灯状态
                led: true,
                // PM2.5浓度
                PM: '',
                // 甲醛浓度
                form: '',
                // VOC浓度
                voc: '',
                // 紫外线
                uv: '',
                // 噪声
                noise: '',
                // AQI空气质量指数
                aqi: '',
                // UVI紫外线指数
                uvi: '',
                // 经度
                lon: '',
                // 纬度
                lat: '',
                // 认证令牌
                token: '',
                // 刷新相关状态
                refreshing: false,
                gettingToken: false,
                lastUpdateTime: '',
                refreshTimer: null,
                
                // 地图相关数据
                currentLocation: {
                    longitude: 116.397428, // 默认北京坐标
                    latitude: 39.90923
                },
                mapMarkers: [], // 地图标记点
                historyLocations: [], // 历史位置数据
            }
        },
        onLoad() {
            // 页面加载时获取token
            this.getToken();
        },
        onShow() {
            // 页面显示时，首次获取设备数据
            this.getShadow();
            // 启动3秒自动刷新定时器
            this.startAutoRefresh();
        },
        onHide() {
            // 页面隐藏时清除定时器
            this.stopAutoRefresh();
        },
        onUnload() {
            // 页面卸载时清除定时器
            this.stopAutoRefresh();
        },
        methods: {
            // 获取token的方法（使用云函数）
            async getToken() {
                console.log("开始获取Token...");
                try {
                    const result = await uniCloud.callFunction({
                        name: 'getToken'
                    });
                    
                    console.log('云函数返回结果:', result);
                    
                    if (result.result.code === 0) {
                        const token = result.result.data.token;
                        console.log("获取token成功:", token);
                        
                        // 保存token到本地缓存
                        uni.setStorageSync('token', token);
                        this.token = token;
                        
                        // 获取token后立即获取设备影子数据
                        this.getShadow();
                    } else {
                        console.log("获取token失败:", result.result.message);
                        uni.showToast({
                            title: 'Token获取失败',
                            icon: 'none',
                            duration: 2000
                        });
                    }
                } catch (error) {
                    console.error('调用getToken云函数失败:', error);
                    uni.showToast({
                        title: 'Token获取失败',
                        icon: 'none',
                        duration: 2000
                    });
                }
            },
            // 获取设备影子数据的方法（使用云函数）
            async getShadow() {
                console.log("开始获取设备影子数据...");
                this.refreshing = true; // 设置刷新状态
                
                try {
                    const token = uni.getStorageSync('token');
                    
                    if (!token) {
                        console.log('没有token，先获取token');
                        await this.getToken();
                        return;
                    }
                    
                    const result = await uniCloud.callFunction({
                        name: 'getDeviceData',
                        data: {
                            token: token
                        }
                    });
                    
                    console.log('获取设备数据云函数返回结果:', result);
                    
                    if (result.result.code === 0) {
                        const deviceData = result.result.data;
                        console.log('设备数据获取成功:', deviceData);
                        
                        // 更新组件的数据
                        this.temp = deviceData.temperature.toString();
                        this.humi = deviceData.humidity.toString();
                        this.PM = deviceData.PM.toString();
                        this.form = deviceData.form.toString();
                        this.voc = deviceData.voc.toString();
                        this.uv = deviceData.uv.toString();
                        this.noise = deviceData.noise .toString();
                        this.lon = deviceData.lon.toString();
                        this.lat = deviceData.lat.toString();
                        this.led = deviceData.led;
                        
                        // 更新地图位置和标记点
                        this.updateMapLocation(deviceData.lon, deviceData.lat);
                        
                        // 计算并更新AQI值
                        this.calculateAQI();
                        
                        // 计算并更新UVI值
                        this.calculateUVI();
                        
                        // 更新最后刷新时间
                        this.updateLastRefreshTime();
                        
                        console.log('设备数据更新完成');
                        
                    } else if (result.result.code === 401) {
                        console.log('Token已过期，重新获取token');
                        await this.getToken();
                    } else {
                        console.log('获取设备数据失败:', result.result.message);
                        uni.showToast({
                            title: '获取数据失败',
                            icon: 'none',
                            duration: 2000
                        });
                    }
                    
                } catch (error) {
                    console.error('调用getDeviceData云函数失败:', error);
                    
                    // 检查是否是网络连接问题
                    if (error.message && error.message.includes('网络连接失败')) {
                        uni.showToast({
                            title: '网络连接失败',
                            icon: 'none',
                            duration: 2000
                        });
                    } else {
                        uni.showToast({
                            title: '获取数据失败',
                            icon: 'none',
                            duration: 2000
                        });
                    }
                } finally {
                    this.refreshing = false;
                }
            },
            // 台灯状态改变时的处理方法
            onLedSwitch(event) {
                console.log(event.detail.value);
                let value = event.detail.value;
                const token = uni.getStorageSync('token');
                
                if (!token) {
                    uni.showToast({
                        title: '请先获取Token',
                        icon: 'none',
                        duration: 2000
                    });
                    return;
                }
                
                // 使用华为云IoT平台的命令下发接口
                const commandData = {
                    service_id: "BasicData",
                    command_name: "led",
                    paras: {
                        led: value
                    }
                };
                
                uni.request({ 
                    url: 'https://c5291326ae.iotda-app.cn-south-4.myhuaweicloud.com/v5/iot/9a8b9ae393844bce8de80dbc4ed08df2/devices/central_wx_app/commands', 
                    data: commandData, 
                    method: 'POST',
                    header: {'content-type': 'application/json','X-Auth-Token': token },
                    success: function(res) {
                        console.log("下发命令成功");
                        console.log(res);
                        console.log('LED ' + (value ? 'ON' : 'OFF') + ' !');
                    }, 
                    fail: function() { 
                        console.log("命令下发失败");
                        console.log("请先获取token");
                    }, 
                    complete: function() { 
                        console.log("命令下发完成");
                    }  
                }); 
            },
            // 启动自动刷新定时器
            startAutoRefresh() {
                this.stopAutoRefresh(); // 先清除之前的定时器
                this.refreshTimer = setInterval(() => {
                    this.getShadow();
                }, 3000); // 每3秒刷新一次数据
            },
            // 停止自动刷新定时器
            stopAutoRefresh() {
                if (this.refreshTimer) {
                    clearInterval(this.refreshTimer);
                    this.refreshTimer = null;
                }
            },
            // 更新最后刷新时间
            updateLastRefreshTime() {
                const now = new Date();
                this.lastUpdateTime = now.toLocaleTimeString();
            },
            // 跳转到环境监测图表页面的统一方法
            goToCharts() {
                // 将认证令牌存储在本地，供其他页面使用
                uni.setStorageSync('token', this.token);
                // 使用switchTab跳转到tabBar页面
                uni.switchTab({
                    url: '/pages/Charts/Charts'
                });
            },
            // 为了兼容性，保留原有方法名但都指向统一的图表页面
            goLineChartTemp() {
                this.goToCharts();
            },
            goLineChartHumi() {
                this.goToCharts();
            },
            goLineChartPM() {
                this.goToCharts();
            },
            goLineChartForm() {
                this.goToCharts();
            },
            goLineChartVOC() {
                this.goToCharts();
            },
            goLineChartUV() {
                this.goToCharts();
            },
            goLineChartNoise() {
                this.goToCharts();
            },
            
            // 根据AQI值获取等级信息
            getAQILevel(aqiValue) {
                const aqi = parseInt(aqiValue) || 0;
                
                if (aqi <= 50) {
                    return {
                        class: 'aqi-excellent',
                        text: '优',
                        description: '空气质量令人满意，基本无空气污染'
                    };
                } else if (aqi <= 100) {
                    return {
                        class: 'aqi-good',
                        text: '良',
                        description: '空气质量可接受，但某些污染物可能对极少数异常敏感人群健康有较弱影响'
                    };
                } else if (aqi <= 150) {
                    return {
                        class: 'aqi-light',
                        text: '轻度污染',
                        description: '易感人群症状有轻度加剧，健康人群出现刺激症状'
                    };
                } else if (aqi <= 200) {
                    return {
                        class: 'aqi-moderate',
                        text: '中度污染',
                        description: '进一步加剧易感人群症状，可能对健康人群心脏、呼吸系统有影响'
                    };
                } else if (aqi <= 300) {
                    return {
                        class: 'aqi-heavy',
                        text: '重度污染',
                        description: '心脏病和肺病患者症状显著加剧，运动耐受力降低，健康人群普遍出现症状'
                    };
                } else {
                    return {
                        class: 'aqi-severe',
                        text: '严重污染',
                        description: '健康人群运动耐受力降低，有明显强烈症状，提前出现某些疾病'
                    };
                }
            },
            
            // 计算AQI值（基于PM2.5、甲醛、VOC等数据）
            calculateAQI() {
                // 简化的AQI计算，主要基于PM2.5
                const pm25 = parseFloat(this.PM) || 0;
                const formaldehyde = parseFloat(this.form) || 0;
                const vocValue = parseFloat(this.voc) || 0;
                
                // PM2.5的AQI计算（简化版）
                let pm25AQI = 0;
                if (pm25 <= 35) {
                    pm25AQI = pm25 * 50 / 35;
                } else if (pm25 <= 75) {
                    pm25AQI = 50 + (pm25 - 35) * 50 / 40;
                } else if (pm25 <= 115) {
                    pm25AQI = 100 + (pm25 - 75) * 50 / 40;
                } else if (pm25 <= 150) {
                    pm25AQI = 150 + (pm25 - 115) * 50 / 35;
                } else if (pm25 <= 250) {
                    pm25AQI = 200 + (pm25 - 150) * 100 / 100;
                } else {
                    pm25AQI = 300 + (pm25 - 250) * 200 / 250;
                }
                
                // 综合考虑其他污染物（简化处理）
                let adjustedAQI = pm25AQI;
                
                // 甲醛影响（mg/m³转换为AQI影响）
                if (formaldehyde > 0.1) {
                    adjustedAQI += (formaldehyde - 0.1) * 100;
                }
                
                // VOC影响（ppb转换为AQI影响）
                if (vocValue > 300) {
                    adjustedAQI += (vocValue - 300) * 0.1;
                }
                
                // 确保AQI值在合理范围内
                this.aqi = Math.min(Math.max(Math.round(adjustedAQI), 0), 500);
            },
            
            // 根据UVI值获取等级信息
            getUVILevel(uviValue) {
                const uvi = parseFloat(uviValue) || 0;
                
                if (uvi <= 2) {
                    return {
                        class: 'uvi-low',
                        text: '低',
                        description: '紫外线强度较低，可以安全地在户外活动'
                    };
                } else if (uvi <= 5) {
                    return {
                        class: 'uvi-moderate',
                        text: '中等',
                        description: '紫外线强度中等，建议在阳光强烈时采取防护措施'
                    };
                } else if (uvi <= 7) {
                    return {
                        class: 'uvi-high',
                        text: '高',
                        description: '紫外线强度较高，需要采取防护措施，避免长时间暴露'
                    };
                } else if (uvi <= 10) {
                    return {
                        class: 'uvi-very-high',
                        text: '很高',
                        description: '紫外线强度很高，必须采取防护措施，减少户外活动'
                    };
                } else {
                    return {
                        class: 'uvi-extreme',
                        text: '极高',
                        description: '紫外线强度极高，避免户外活动，必须采取全面防护'
                    };
                }
            },
            
            // 计算UVI值（基于紫外线传感器数据）
            calculateUVI() {
                const uvValue = parseFloat(this.uv) || 0;
                
                // 将传感器UV值转换为标准UVI指数
                // 这里使用简化的转换公式，实际应用中可能需要根据具体传感器进行校准
                let calculatedUVI = 0;
                
                if (uvValue <= 50) {
                    calculatedUVI = uvValue * 0.04; // 0-2 (低)
                } else if (uvValue <= 150) {
                    calculatedUVI = 2 + (uvValue - 50) * 0.03; // 2-5 (中等)
                } else if (uvValue <= 250) {
                    calculatedUVI = 5 + (uvValue - 150) * 0.02; // 5-7 (高)
                } else if (uvValue <= 350) {
                    calculatedUVI = 7 + (uvValue - 250) * 0.03; // 7-10 (很高)
                } else {
                    calculatedUVI = 10 + (uvValue - 350) * 0.01; // >10 (极高)
                }
                
                // 确保UVI值在合理范围内
                this.uvi = Math.min(Math.max(calculatedUVI.toFixed(1), 0), 15);
            },
            
            // 更新地图位置和标记点
            updateMapLocation(longitude, latitude) {
                const newLon = parseFloat(longitude);
                const newLat = parseFloat(latitude);
                
                // 检查坐标是否有效
                if (isNaN(newLon) || isNaN(newLat)) {
                    console.log('无效的坐标数据');
                    return;
                }
                
                // 保存当前位置到历史位置（如果位置发生变化）
                if (this.currentLocation.longitude !== newLon || this.currentLocation.latitude !== newLat) {
                    // 将当前位置添加到历史位置
                    if (this.currentLocation.longitude && this.currentLocation.latitude) {
                        this.historyLocations.push({
                            longitude: this.currentLocation.longitude,
                            latitude: this.currentLocation.latitude,
                            timestamp: Date.now()
                        });
                        
                        // 限制历史位置数量，只保留最近10个
                        if (this.historyLocations.length > 10) {
                            this.historyLocations.shift();
                        }
                    }
                }
                
                // 更新当前位置
                this.currentLocation = {
                    longitude: newLon,
                    latitude: newLat
                };
                
                // 更新地图标记点
                this.updateMapMarkers();
            },
            
            // 更新地图标记点
            updateMapMarkers() {
                const markers = [];
                
                // 添加当前位置标记（蓝色）
                if (this.currentLocation.longitude && this.currentLocation.latitude) {
                    markers.push({
                        id: 'current',
                        longitude: this.currentLocation.longitude,
                        latitude: this.currentLocation.latitude,
                        iconPath: '/static/current-location.png',
                        width: 30,
                        height: 30,
                        title: '当前位置',
                        callout: {
                            content: '设备当前位置',
                            color: '#ffffff',
                            fontSize: 12,
                            borderRadius: 5,
                            bgColor: '#1890FF',
                            padding: 5,
                            display: 'ALWAYS'
                        }
                    });
                }
                
                // 添加历史位置标记（绿色）
                this.historyLocations.forEach((location, index) => {
                    markers.push({
                        id: `history_${index}`,
                        longitude: location.longitude,
                        latitude: location.latitude,
                        iconPath: '/static/history-location.png',
                        width: 25,
                        height: 25,
                        title: `历史位置 ${index + 1}`,
                        callout: {
                            content: `历史位置 ${new Date(location.timestamp).toLocaleString()}`,
                            color: '#ffffff',
                            fontSize: 10,
                            borderRadius: 5,
                            bgColor: '#52c41a',
                            padding: 3
                        }
                    });
                });
                
                this.mapMarkers = markers;
            },
            
            // 地图标记点点击事件
            onMarkerTap(e) {
                const markerId = e.detail.markerId;
                console.log('点击了标记点:', markerId);
                
                if (markerId === 'current') {
                    uni.showToast({
                        title: '当前设备位置',
                        icon: 'none',
                        duration: 2000
                    });
                } else if (markerId.startsWith('history_')) {
                    const index = parseInt(markerId.split('_')[1]);
                    const location = this.historyLocations[index];
                    if (location) {
                        uni.showToast({
                            title: `历史位置: ${new Date(location.timestamp).toLocaleString()}`,
                            icon: 'none',
                            duration: 3000
                        });
                    }
                }
            },
        }
    }
</script>


<style>
    .wrap {
        padding: 30rpx;
    }
    
    /* 状态栏样式 */
    .status-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20rpx;
        padding: 10rpx;
        border-radius: 10rpx;
        background-color: #f8f8f8;
    }
    
    .refresh-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        font-size: 24rpx;
        color: #666;
    }
    
    .refresh-button {
        padding: 10rpx;
        border-radius: 50%;
        background-color: #eee;
        width: 40rpx;
        height: 40rpx;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    
    .refresh-icon {
        font-size: 28rpx;
        font-weight: bold;
    }
    
    /* 刷新动画 */
    @keyframes rotating {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }
    
    .refreshing {
        animation: rotating 1s linear infinite;
        color: #2b9939;
    }

    .dev-area {
        display: flex;
        justify-content: space-between;
        flex-wrap: wrap;
    }

    .dev-cart {
        height: 150rpx;
        width: 320rpx;
        border-radius: 30rpx;
        margin-top: 30rpx;
        display: flex;
        justify-content: space-around;
        align-items: center;
        box-shadow: 0 0 15rpx #ccc;
    }

    .dev-name, .dev-data {
        font-size: 20rpx;
        text-align: center;
        color: #6d6d6d;
    }

    .dev-logo {
        width: 70rpx;
        height: 70rpx;
        margin-top: 10rpx;
    }

    .dev-data {
        font-size: 50rpx;
    }

    /* AQI空气质量指数样式 */
    .aqi-container {
        width: 100%;
        margin-top: 20rpx;
        border-radius: 20rpx;
        box-shadow: 0 0 15rpx #ccc;
        overflow: hidden;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #fff;
    }
    
    .aqi-title {
        font-size: 28rpx;
        font-weight: bold;
        text-align: center;
        padding: 20rpx;
        background-color: rgba(255, 255, 255, 0.1);
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .aqi-content {
        padding: 30rpx;
        text-align: center;
    }
    
    .aqi-value {
        font-size: 80rpx;
        font-weight: bold;
        margin-bottom: 10rpx;
        text-shadow: 2rpx 2rpx 4rpx rgba(0, 0, 0, 0.3);
    }
    
    .aqi-level {
        font-size: 32rpx;
        font-weight: bold;
        margin-bottom: 15rpx;
    }
    
    .aqi-description {
        font-size: 22rpx;
        line-height: 1.4;
        opacity: 0.9;
    }
    
    /* AQI等级颜色 */
    .aqi-excellent {
        color: #00e400 !important;
    }
    
    .aqi-good {
        color: #ffff00 !important;
    }
    
    .aqi-light {
        color: #ff7e00 !important;
    }
    
    .aqi-moderate {
        color: #ff0000 !important;
    }
    
    .aqi-heavy {
        color: #8f3f97 !important;
    }
    
    .aqi-severe {
        color: #7e0023 !important;
    }

    /* UVI紫外线指数样式 */
    .uvi-container {
        width: 100%;
        margin-top: 20rpx;
        border-radius: 20rpx;
        box-shadow: 0 0 15rpx #ccc;
        overflow: hidden;
        background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%);
        color: #2d3436;
    }
    
    .uvi-title {
        font-size: 28rpx;
        font-weight: bold;
        text-align: center;
        padding: 20rpx;
        background-color: rgba(255, 255, 255, 0.3);
        border-bottom: 1px solid rgba(255, 255, 255, 0.4);
    }
    
    .uvi-content {
        padding: 30rpx;
        text-align: center;
    }
    
    .uvi-value {
        font-size: 80rpx;
        font-weight: bold;
        margin-bottom: 10rpx;
        text-shadow: 2rpx 2rpx 4rpx rgba(0, 0, 0, 0.2);
    }
    
    .uvi-level {
        font-size: 32rpx;
        font-weight: bold;
        margin-bottom: 15rpx;
    }
    
    .uvi-description {
        font-size: 22rpx;
        line-height: 1.4;
        opacity: 0.8;
    }
    
    /* UVI等级颜色 */
    .uvi-low {
        color: #00b894 !important;
    }
    
    .uvi-moderate {
        color: #fdcb6e !important;
    }
    
    .uvi-high {
        color: #e17055 !important;
    }
    
    .uvi-very-high {
        color: #d63031 !important;
    }
    
    .uvi-extreme {
        color: #74b9ff !important;
    }

    /* 地图容器样式 */
    .map-container {
        width: 100%;
        margin-top: 30rpx;
        border-radius: 20rpx;
        box-shadow: 0 0 15rpx #ccc;
        overflow: hidden;
        background-color: #fff;
    }
    
    .map-title {
        font-size: 28rpx;
        color: #333;
        font-weight: bold;
        text-align: center;
        padding: 20rpx;
        background-color: #f8f9fa;
        border-bottom: 1px solid #e9ecef;
    }
    
    .device-map {
        width: 100%;
        height: 400rpx;
    }
    
    .map-legend {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 15rpx;
        background-color: #f8f9fa;
        border-top: 1px solid #e9ecef;
        gap: 30rpx;
    }
    
    .legend-item {
        display: flex;
        align-items: center;
        gap: 8rpx;
    }
    
    .legend-dot {
        width: 16rpx;
        height: 16rpx;
        border-radius: 50%;
    }
    
    .legend-dot.current {
        background-color: #1890FF;
    }
    
    .legend-dot.history {
        background-color: #52c41a;
    }
    
    .legend-text {
        font-size: 22rpx;
        color: #666;
    }

    .location-info {
        display: flex;
        justify-content: space-around;
        width: 100%;
        padding: 15rpx;
        background-color: #fff;
    }

    .location-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex: 1;
    }

    .location-label {
        font-size: 20rpx;
        color: #6d6d6d;
        margin-bottom: 10rpx;
    }

    .location-value {
        font-size: 30rpx;
        color: #333;
        font-weight: bold;
    }
    
    .location-update-time {
        font-size: 18rpx;
        color: #999;
        text-align: center;
        padding: 10rpx;
        background-color: #f8f9fa;
    }
</style>
