'use strict';

/**
 * 获取华为云IoT平台认证Token的云函数
 * @param {Object} event 客户端上传的参数
 * @param {Object} context 包含了调用信息和运行状态等信息的对象
 */
exports.main = async (event, context) => {
    console.log('开始获取Token...');
    
    try {
        // 华为云认证配置
        const authConfig = {
            auth: {
                identity: {
                    methods: ["password"],
                    password: {
                        user: {
                            name: "jun",
                            password: "junjjxiaoxiaode6cm!",
                            domain: {
                                name: "hid_5qb4jhtria1zq1j"
                            }
                        }
                    }
                },
                scope: {
                    project: {
                        name: "cn-south-4"
                    }
                }
            }
        };
        
        // 发起HTTP请求获取Token
        const response = await uniCloud.httpclient.request('https://iam.cn-south-4.myhuaweicloud.com/v3/auth/tokens', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            data: authConfig,
            timeout: 10000
        });
        
        console.log('Token请求响应状态:', response.status);
        
        if (response.status === 201) {
            // 从响应头中提取Token
            const token = response.headers['x-subject-token'];
            
            if (token) {
                console.log('Token获取成功');
                return {
                    code: 0,
                    message: 'Token获取成功',
                    data: {
                        token: token,
                        timestamp: Date.now()
                    }
                };
            } else {
                console.error('响应头中未找到Token');
                return {
                    code: -1,
                    message: '响应头中未找到Token',
                    data: null
                };
            }
        } else {
            console.error('Token获取失败，状态码:', response.status);
            return {
                code: -1,
                message: `Token获取失败，状态码: ${response.status}`,
                data: null
            };
        }
        
    } catch (error) {
        console.error('获取Token时发生错误:', error);
        return {
            code: -1,
            message: '获取Token时发生错误: ' + error.message,
            data: null
        };
    }
};