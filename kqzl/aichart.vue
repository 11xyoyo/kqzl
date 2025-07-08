<template>
	<view class="container">
		<view class="chat-container">
			<!-- 聊天消息列表 -->
			<scroll-view class="chat-list" scroll-y="true" :scroll-top="scrollTop">
				<view v-for="(item, index) in chatList" :key="index" class="chat-item">
					<!-- 用户消息 -->
					<view v-if="item.role === 'user'" class="user-chat">
						<view class="user-message">
							<text class="message-text">{{ item.content }}</text>
						</view>
						<view class="user-avatar">
							<text class="avatar-text">👤</text>
						</view>
					</view>
					<!-- AI消息 -->
					<view v-else class="assistant-chat">
						<view class="assistant-avatar">
							<text class="avatar-text">🤖</text>
						</view>
						<view class="assistant-message">
							<!-- 显示纯文本内容 -->
							<text class="message-text">{{ item.content }}</text>
						</view>
					</view>
				</view>
				<!-- 加载状态 -->
				<view v-if="isLoading" class="loading-container">
					<view class="assistant-chat">
						<!-- <view class="assistant-avatar">
							<text class="avatar-text">🤖</text>
						</view> -->
						<view class="loading-message">
							<text class="loading-text">DeepSeek正在思考中</text>
							<view class="typing-indicator">
								<view class="dot"></view>
								<view class="dot"></view>
								<view class="dot"></view>
							</view>
						</view>
					</view>
				</view>
			</scroll-view>
			
			<!-- 快捷操作区域 -->
			<view class="quick-actions">
				<button 
					class="action-button data-analysis-btn" 
					:disabled="isLoading"
					@click="analyzeDataAndGetAdvice"
				>
					<text class="btn-icon">📊</text>
					<text class="btn-text">获取最新数据分析</text>
				</button>
			</view>
			
			<!-- 输入区域 -->
			<view class="input-container">
				<textarea 
					v-model="message" 
					class="input-textarea" 
					placeholder="请输入您的植物养护问题..."
					:disabled="isLoading"
					@confirm="sendMessage"
				></textarea>
				<button 
					class="send-button" 
					:disabled="!message.trim() || isLoading"
					@click="sendMessage"
				>
					{{ isLoading ? '发送中...' : '发送' }}
				</button>
				<button 
					v-if="isLoading" 
					class="stop-button" 
					@click="stopStream"
				>
					停止
				</button>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			message: '',
			chatList: [
				{
					role: 'assistant',
					content: `🌱 **温室植物养护专家** 为您服务！\n\n我是您的专业温室植物养护顾问，具备丰富的植物生理学和环境控制经验。\n\n**我可以为您提供：**\n- 🌡️ 温湿度环境分析\n- 💡 光照需求评估\n- 💧 灌溉策略建议\n- 🌿 植物健康诊断\n- ⚡ 设备控制建议\n\n**使用方法：**\n1. 点击下方"获取最新数据"按钮\n2. 我将分析最近几小时的环境数据\n3. 为您提供专业的养护建议\n\n请随时向我咨询任何植物养护问题！`
				}
			],
			isLoading: false,
			scrollTop: 0,
			stopStreamFunction: null,
			latestData: null
		}
	},
	methods: {
			// 获取最新传感器数据
			async getLatestSensorData() {
				try {
					const res = await uniCloud.callFunction({
						name: 'getLatestData'
					});
					
					// 云函数返回格式：{code: 0, message: "获取最新数据成功", data: Object}
				if (res.result.code === 0 && res.result.data) {
					this.latestData = res.result.data;
					return res.result.data;
				} else {
					uni.showToast({
						title: res.result.message || '获取数据失败',
						icon: 'error'
					});
					return null;
				}
				} catch (error) {
					console.error('获取传感器数据失败:', error);
					uni.showToast({
						title: '网络错误',
						icon: 'error'
					});
					return null;
				}
			},
			
			// 获取历史数据（最近几小时）
			async getRecentHistoryData() {
				try {
					const endTime = new Date();
					const startTime = new Date(endTime.getTime() - 6 * 60 * 60 * 1000); // 最近6小时
					
					const res = await uniCloud.callFunction({
						name: 'getHistoryData',
						data: {
							startTime: startTime.toISOString(),
							endTime: endTime.toISOString()
						}
					});
					
					// 适配云函数返回格式
				if (res.result.code === 0 && res.result.data) {
					return res.result.data;
				} else {
					console.warn('获取历史数据失败:', res.result.message);
					return [];
				}
				} catch (error) {
					console.error('获取历史数据失败:', error);
				return [];
			}
		},
		
		// 分析数据并生成专业建议
			async analyzeDataAndGetAdvice() {
				uni.showLoading({
					title: '获取数据中...'
				});
				
				try {
					// 获取最新数据和历史数据
					const [latestData, historyData] = await Promise.all([
						this.getLatestSensorData(),
						this.getRecentHistoryData()
					]);
					
					uni.hideLoading();
					
					// 严格验证数据完整性
					if (!latestData) {
						uni.showModal({
							title: '数据获取失败',
							content: '无法获取传感器数据，请检查设备连接状态后重试。',
							showCancel: false
						});
						return;
					}
					
					// 验证关键数据字段
					const requiredFields = ['temperature', 'humidity', 'light', 'soil_humidity', 'pH', 'uv_index'];
					const missingFields = requiredFields.filter(field => 
						latestData[field] === undefined || latestData[field] === null
					);
					
					if (missingFields.length > 0) {
						uni.showModal({
							title: '数据不完整',
							content: `传感器数据不完整，缺少: ${missingFields.join(', ')}。建议检查传感器连接后重新获取数据。`,
							confirmText: '继续分析',
							cancelText: '取消',
							success: (res) => {
								if (res.confirm) {
									this.proceedWithAnalysis(latestData, historyData);
								}
							}
						});
						return;
					}
					
					// 显示数据确认对话框
					const dataTime = new Date().toLocaleString('zh-CN');
					const confirmContent = `已获取到完整的传感器数据 (${dataTime}):\n\n` +
						`🌡️ 温度: ${latestData.temperature}°C\n` +
						`💧 湿度: ${latestData.humidity}%\n` +
						`☀️ 光照: ${latestData.light} lux\n` +
						`🌱 土壤湿度: ${latestData.soil_humidity}%\n` +
						`🧪 CO2值: ${latestData.pH}\n` +
						`🌡️ 紫外线: ${latestData.uv_index}\n\n` +
						`是否基于此数据进行AI分析？`;
					
					uni.showModal({
						title: '确认数据分析',
						content: confirmContent,
						confirmText: '开始分析',
						cancelText: '取消',
						success: (res) => {
							if (res.confirm) {
								this.proceedWithAnalysis(latestData, historyData);
							}
						}
					});
					
				} catch (error) {
					uni.hideLoading();
					console.error('数据分析失败:', error);
					uni.showModal({
						title: '分析失败',
						content: '数据获取过程中发生错误，请检查网络连接后重试。',
						showCancel: false
					});
				}
			},
			
			// 执行数据分析
			proceedWithAnalysis(latestData, historyData) {
				try {
					// 构建专业的数据分析提示词
					const dataAnalysisPrompt = this.buildDataAnalysisPrompt(latestData, historyData);
					
					// 发送给AI分析
					this.sendDataAnalysisMessage(dataAnalysisPrompt);
					
				} catch (error) {
					console.error('分析处理失败:', error);
					uni.showToast({
						title: '分析失败',
						icon: 'error'
					});
				}
			},
			
			// 构建数据分析提示词
			buildDataAnalysisPrompt(latestData, historyData) {
				const currentTime = new Date().toLocaleString('zh-CN');
				
				let prompt = `请作为专业的温室植物养护专家，基于以下传感器数据进行分析并提供建议：\n\n`;
				
				// 当前数据
				prompt += `**当前环境数据** (${currentTime}):\n`;
				prompt += `- 🌡️ 温度: ${latestData.temperature}°C\n`;
				prompt += `- 💧 湿度: ${latestData.humidity}%\n`;
				prompt += `- ☀️ 光照强度: ${latestData.light} lux\n`;
				prompt += `- 🌱 土壤湿度: ${latestData.soil_humidity}%\n`;
				prompt += `- 🧪 co2值: ${latestData.pH}\n`;
				prompt += `- 🌧️ 雨水检测: ${latestData.rain_sensor ? '有雨' : '无雨'}\n`;
				prompt += `- 🌡️ 紫外线指数: ${latestData.uv_index}\n\n`;
				
				// 设备状态
				prompt += `**当前设备状态:**\n`;
				prompt += `- 💡 LED灯: ${latestData.led_status ? '开启' : '关闭'}\n`;
				prompt += `- 🌀 风扇: ${latestData.fan_status ? '开启' : '关闭'}\n`;
				prompt += `- 💦 水泵: ${latestData.water_pump_status ? '开启' : '关闭'}\n\n`;
				
				// 历史趋势（如果有数据）
				if (historyData && historyData.length > 0) {
					prompt += `**最近6小时趋势分析:**\n`;
					const avgTemp = (historyData.reduce((sum, item) => sum + item.temperature, 0) / historyData.length).toFixed(1);
					const avgHumidity = (historyData.reduce((sum, item) => sum + item.humidity, 0) / historyData.length).toFixed(1);
					const avgLight = (historyData.reduce((sum, item) => sum + item.light, 0) / historyData.length).toFixed(0);
					const avgSoilHumidity = (historyData.reduce((sum, item) => sum + item.soil_humidity, 0) / historyData.length).toFixed(1);
					
					prompt += `- 平均温度: ${avgTemp}°C\n`;
					prompt += `- 平均湿度: ${avgHumidity}%\n`;
					prompt += `- 平均光照: ${avgLight} lux\n`;
					prompt += `- 平均土壤湿度: ${avgSoilHumidity}%\n\n`;
				}
				
				prompt += `**请提供专业建议:**\n`;
				prompt += `1. 🌡️ **温湿度管理**: 分析当前温湿度是否适宜，是否需要调节风扇\n`;
				prompt += `2. 💡 **光照管理**: 评估光照强度，建议是否需要开启/关闭LED补光灯\n`;
				prompt += `3. 💧 **灌溉管理**: 根据土壤湿度和环境湿度，建议是否需要浇水\n`;
				prompt += `4. 🌿 **植物健康**: 基于co2值和整体环境，评估植物生长状况\n`;
				prompt += `5. ⚡ **设备控制**: 具体的设备操作建议（开灯/关灯、浇水/停水、风扇调节等）\n`;
				prompt += `6. 🔮 **预防措施**: 基于趋势数据，提供预防性建议\n\n`;
				prompt += `请用专业但易懂的语言，提供具体可操作的建议。`;
				
				return prompt;
			},
			
			// 发送数据分析消息
			sendDataAnalysisMessage(prompt) {
				// 添加用户消息到聊天列表
				const userMessage = {
					role: 'user',
					content: '请分析最新的传感器数据并提供专业建议'
				};
				this.chatList.push(userMessage);
				
				// 准备发送的消息列表（包含系统提示词）
				const systemPrompt = {
					role: 'system',
					content: '你是一位专业的温室植物养护专家，具有丰富的植物生理学、环境控制和农业技术经验。请基于提供的传感器数据，从专业角度分析环境状况，并提供具体、可操作的养护建议。回答要专业但易懂，包含具体的数值建议和操作指导。'
				};
				
				const messages = [
					systemPrompt,
					{
						role: 'user',
						content: prompt
					}
				];
				
				this.isLoading = true;
				
				// 添加AI消息占位符
				const aiMessageIndex = this.chatList.length;
				this.chatList.push({
					role: 'assistant',
					content: ''
				});
				
				// 滚动到底部
				this.scrollToBottom();
				
				// 调用流式请求
				this.stopStreamFunction = this.fetchDeepSeekStream(
					messages,
					// onProgress
					(content) => {
						this.chatList[aiMessageIndex].content = content;
						this.scrollToBottom();
					},
					// onComplete
					(content) => {
						this.chatList[aiMessageIndex].content = content;
						this.isLoading = false;
						this.stopStreamFunction = null;
						this.scrollToBottom();
					},
					// onError
					(error) => {
						console.error('请求失败:', error);
						this.chatList[aiMessageIndex].content = '抱歉，数据分析失败，请稍后重试。';
						this.isLoading = false;
						this.stopStreamFunction = null;
						uni.showToast({
							title: '分析失败',
							icon: 'error'
						});
					},
					// onAbort
					() => {
						this.chatList[aiMessageIndex].content += '\n[分析已中断]';
						this.isLoading = false;
						this.stopStreamFunction = null;
					}
				);
			},
			
			// DeepSeek流式请求函数
		fetchDeepSeekStream(messages, onProgress, onComplete, onError, onAbort) {
			const API_URL = 'https://api.deepseek.com/v1/chat/completions';
			const API_KEY = 'sk-22cd898c795f4534bdd29408419c5390'; // 你的 API Key
			
			let isStopped = false;
			let typedResult = '';
			
			const requestData = {
				model: "deepseek-reasoner",
				messages: messages.slice(-10), // 只保留最近10条
				stream: true,
			};
			
			// #ifdef H5
			const controller = new AbortController(); //AbortController 接口表示一个控制器对象，允许你根据需要中止一个或多个 Web 请求。
			
			// 设置30秒超时
			const timeoutId = setTimeout(() => {
				controller.abort();
				onError && onError(new Error('请求超时，请检查网络连接'));
			}, 300000); // 5分钟超时
			
			// fetch文档 https://developer.mozilla.org/zh-CN/docs/Web/API/Window/fetch
			fetch(API_URL, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${API_KEY}`
				},
				body: JSON.stringify(requestData),
				signal: controller.signal
			}).then(async response => {
				clearTimeout(timeoutId); // 清除超时定时器
				
				if (!response.ok) {
					throw new Error(`HTTP ${response.status}: ${response.statusText}`);
				}
				const reader = response.body.getReader();
				const decoder = new TextDecoder("utf-8");
				let partialData = "";
				
				async function readStream() {
					try {
						const { done, value } = await reader.read();
						if (done || isStopped) {
							onComplete && onComplete(typedResult);
							return;
						}
						
						const text = decoder.decode(value, { stream: true });
						partialData += text;
						
						const lines = partialData.split("\n");
						partialData = lines.pop(); // 可能存在未完整的 JSON 片段
						
						for (const line of lines) {
							// 数据格式 data: {"id":"6b164fc4-5111-4267-a094-3d36edf3200d","object":"chat.completion.chunk","created":1741932057,"model":"deepseek-chat","system_fingerprint":"fp_3a5770e1b4_prod0225","choices":[{"index":0,"delta":{"content":"你在"},"logprobs":null,"finish_reason":null}]}
							if (line.trim().startsWith("data: ")) {
								const jsonStr = line.replace("data: ", "").trim(); // 去掉 "data: "
								if (jsonStr === "[DONE]") {
									onComplete && onComplete(typedResult);
									return;
								}
								
								try {
									const jsonData = JSON.parse(jsonStr);
									const content = jsonData.choices?.[0]?.delta?.content || ""; // DeepSeek SSE 增量更新
									for (let i = 0; i < content.length; i++) {
										if (isStopped) return;
										typedResult += content[i];
										await new Promise((res) => setTimeout(res, 30));
										onProgress && onProgress(typedResult);
									}
								} catch (e) {
									console.error("JSON 解析失败", e);
								}
							}
						}
						readStream();
					} catch (error) {
						console.error("读取流数据失败", error);
						onError && onError(error);
					}
				}
				
				readStream();
			}).catch(error => {
				clearTimeout(timeoutId); // 清除超时定时器
				console.error("请求失败", error);
				
				// 处理不同类型的错误
				if (error.name === 'AbortError') {
					onError && onError(new Error('请求已取消'));
				} else if (error.message.includes('Failed to fetch')) {
					onError && onError(new Error('网络连接失败，请检查网络设置'));
				} else {
					onError && onError(error);
				}
			});
			// #endif
			
			// #ifdef APP-PLUS
			// 设置30秒超时
			let isTimeout = false;
			let requestTask; // 声明 requestTask 变量
			const timeoutId = setTimeout(() => {
				isTimeout = true;
				onError && onError(new Error('请求超时，请检查网络连接'));
			}, 300000); // 5分钟超时
			
			// APP平台使用uni.request，支持onChunkReceived
			requestTask = uni.request({
				url: API_URL,
				method: "POST",
				header: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${API_KEY}`
				},
				data: requestData,
				timeout: 300000, // 5分钟超时
				success: (res) => {
					clearTimeout(timeoutId);
					console.log("APP请求完成", res);
				},
				fail: (err) => {
					clearTimeout(timeoutId);
					if (!isTimeout) {
						console.error('APP请求失败:', err);
						onError && onError(new Error('网络请求失败，请检查网络连接'));
					}
				}
			});
			
			let accumulatedText = ""; // 存储未处理的流数据
			let fullMessage = ""; // 存储最终拼接的消息
			
			// APP平台使用非流式请求，然后模拟打字机效果
			console.log('APP平台使用非流式请求模式');
			
			// 修改请求数据，关闭流式
			const appRequestData = {
				...requestData,
				stream: false // 关闭流式
			};
			
			// 重新发起请求
			requestTask = uni.request({
				url: API_URL,
				method: "POST",
				header: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${API_KEY}`
				},
				data: appRequestData,
				timeout: 300000, // 5分钟超时
				success: (res) => {
					clearTimeout(timeoutId);
					console.log("APP非流式请求成功", res);
					
					if (res.statusCode === 200 && res.data) {
						try {
							const responseData = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
							const content = responseData.choices?.[0]?.message?.content || '';
							
							if (content) {
								// 模拟打字机效果
								let currentIndex = 0;
								const typewriterInterval = setInterval(() => {
									if (isStopped || isTimeout) {
										clearInterval(typewriterInterval);
										return;
									}
									
									if (currentIndex < content.length) {
										currentIndex++;
										const partialContent = content.substring(0, currentIndex);
										onProgress && onProgress(partialContent);
									} else {
										clearInterval(typewriterInterval);
										onComplete && onComplete(content);
									}
								}, 30); // 30ms间隔，模拟打字效果
								
								// 保存定时器引用，用于停止
								requestTask.typewriterInterval = typewriterInterval;
							} else {
								onError && onError(new Error('API返回内容为空'));
							}
						} catch (parseError) {
							console.error('解析响应数据失败:', parseError);
							onError && onError(new Error('解析响应数据失败'));
						}
					} else {
						onError && onError(new Error(`请求失败，状态码: ${res.statusCode}`));
					}
				},
				fail: (err) => {
					clearTimeout(timeoutId);
					if (!isTimeout) {
						console.error('APP请求失败:', err);
						onError && onError(new Error('网络请求失败，请检查网络连接'));
					}
				}
			});
			

			// #endif
			
			// #ifdef MP-WEIXIN
			// 设置30秒超时
			let isTimeout = false;
			let requestTask; // 声明 requestTask 变量
			const timeoutId = setTimeout(() => {
				isTimeout = true;
				onError && onError(new Error('请求超时，请检查网络连接'));
			}, 300000); // 5分钟超时
			
			// 文档 https://uniapp.dcloud.net.cn/api/request/request.html
			requestTask = uni.request({
				url: API_URL,
				enableChunked: true, //开启 transfer-encoding chunked
				responseType: 'arraybuffer', //设置响应的数据类型。合法值：text、arraybuffer
				method: "POST",
				header: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${API_KEY}`
				},
				data: requestData,
				success: (res) => {
					clearTimeout(timeoutId);
					console.log("请求完成", res);
				},
				fail: (err) => {
					clearTimeout(timeoutId);
					if (!isTimeout) {
						onError && onError(new Error('网络请求失败，请检查网络连接'));
					}
				}
			});
			
			let accumulatedText = ""; // 存储未处理的流数据
			let fullMessage = ""; // 存储最终拼接的消息
			
			requestTask.onChunkReceived(async (res) => {
				if (isTimeout) return; // 如果已超时，直接返回
				
				const uint8Array = new Uint8Array(res.data);
				// 兼容 TextDecoder 的 UTF-8 解码 微信小程序不支持 const decoder = new TextDecoder("utf-8");
				function decodeUTF8(arr) {
					return decodeURIComponent(arr.map(byte => `%${byte.toString(16).padStart(2, "0")}`).join(""));
				}
				// 进行解码
				const chunkText = decodeUTF8([...uint8Array]);
				
				// 累积数据
				accumulatedText += chunkText;
				
				// 处理多行 JSON 片段
				const lines = accumulatedText.split("\n");
				accumulatedText = ""; // **暂时清空，后续可能补回**
				
				for (let line of lines) {
					if (line === "data: [DONE]") {
						onComplete && onComplete(fullMessage); // **这里 fullMessage 是完整的内容**
						return; // **提前结束，不再解析后续数据**
					}
					
					// 去掉 `data: ` 前缀
					if (line.startsWith("data: ")) {
						line = line.replace("data: ", "");
					}
					
					try {
						const parsedData = JSON.parse(line);
						const content = parsedData.choices?.[0]?.delta?.content || "";
						fullMessage += content; // 累积返回的文本
						
						// 确保每次解析到新内容时，都执行 onProgress
						onProgress && onProgress(fullMessage);
					} catch (error) {
						// JSON 解析失败，可能是数据未完全接收，等待下一个 chunk
						accumulatedText += line + "\n"; // **补回未解析的部分**
					}
				}
			});
			
			// #endif
			
			// 返回 `stop` 方法，外部可以调用 `stopStream()` 终止请求
			return () => {
				console.log('中断请求...');
				isStopped = true;
				
				// #ifdef H5
				clearTimeout(timeoutId); // 清除超时定时器
				controller.abort();
				// #endif
				
				// #ifdef APP-PLUS
				clearTimeout(timeoutId); // 清除超时定时器
				isTimeout = true; // 标记为已停止
				if (requestTask) {
					// 停止打字机效果
					if (requestTask.typewriterInterval) {
						clearInterval(requestTask.typewriterInterval);
					}
					// 中断请求
					if (typeof requestTask.abort === 'function') {
						requestTask.abort();
					}
				}
				// #endif
				
				// #ifdef MP-WEIXIN
				clearTimeout(timeoutId); // 清除超时定时器
				isTimeout = true; // 标记为已停止
				requestTask.abort();
				// #endif
				
				onAbort && onAbort();
			};
		},
		
		// 发送消息
		sendMessage() {
			if (!this.message.trim() || this.isLoading) return;
			
			// 添加用户消息到聊天列表
			const userMessage = {
				role: 'user',
				content: this.message.trim()
			};
			this.chatList.push(userMessage);
			
			// 准备发送的消息列表
			const messages = this.chatList.map(item => ({
				role: item.role,
				content: item.content
			}));
			
			// 清空输入框
			this.message = '';
			this.isLoading = true;
			
			// 添加AI消息占位符
			const aiMessageIndex = this.chatList.length;
			this.chatList.push({
				role: 'assistant',
				content: ''
			});
			
			// 滚动到底部
			this.scrollToBottom();
			
			// 调用流式请求
			this.stopStreamFunction = this.fetchDeepSeekStream(
				messages,
				// onProgress
				(content) => {
					this.chatList[aiMessageIndex].content = content;
					this.scrollToBottom();
				},
				// onComplete
				(content) => {
					this.chatList[aiMessageIndex].content = content;
					this.isLoading = false;
					this.stopStreamFunction = null;
					this.scrollToBottom();
				},
				// onError
				(error) => {
					console.error('请求失败:', error);
					this.chatList[aiMessageIndex].content = '抱歉，请求失败，请稍后重试。';
					this.isLoading = false;
					this.stopStreamFunction = null;
					uni.showToast({
						title: '请求失败',
						icon: 'error'
					});
				},
				// onAbort
				() => {
					this.chatList[aiMessageIndex].content += '\n[请求已中断]';
					this.isLoading = false;
					this.stopStreamFunction = null;
				}
			);
		},
		
		// 停止流式请求
		stopStream() {
			if (this.stopStreamFunction) {
				this.stopStreamFunction();
			}
		},
		
		// 滚动到底部
		scrollToBottom() {
			this.$nextTick(() => {
				this.scrollTop = 999999;
			});
		}
	}
}
</script>

<style scoped>
.container {
	width: 100%;
	height: 100vh;
	display: flex;
	flex-direction: column;
	background-color: #f5f5f5;
}

.chat-container {
	flex: 1;
	display: flex;
	flex-direction: column;
	height: 100%;
}

.chat-list {
	flex: 1;
	padding: 20rpx;
	overflow-y: auto;
}

.chat-item {
	margin-bottom: 30rpx;
	display: flex;
	flex-direction: column;
}

/* 用户消息样式 */
.user-chat {
	display: flex;
	flex-direction: row;
	justify-content: flex-end;
	align-items: flex-start;
	gap: 12rpx;
}

.user-message {
	max-width: 70%;
	padding: 20rpx;
	border-radius: 20rpx 4rpx 20rpx 20rpx;
	word-wrap: break-word;
	background-color: #007AFF;
	color: white;
	box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.1);
}

.user-avatar {
	width: 80rpx;
	height: 80rpx;
	border-radius: 50%;
	background-color: #e0e0e0;
	display: flex;
	justify-content: center;
	align-items: center;
	background-color: #007AFF;
	color: white;
	font-size: 40rpx;
	box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.1);
}

/* AI消息样式 */
.assistant-chat {
	display: flex;
	flex-direction: row;
	justify-content: flex-start;
	align-items: flex-start;
	gap: 12rpx;
}

.assistant-message {
	max-width: 70%;
	padding: 20rpx;
	border-radius: 4rpx 20rpx 20rpx 20rpx;
	word-wrap: break-word;
	background-color: white;
	color: #333;
	border: 1px solid #e0e0e0;
	box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.05);
}

.assistant-avatar {
	width: 80rpx;
	height: 80rpx;
	border-radius: 50%;
	background-color: #0078d4;
	display: flex;
	justify-content: center;
	align-items: center;
	color: white;
	font-size: 40rpx;
	box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.1);
}

.avatar-text {
	font-size: 40rpx;
}

.message-text {
	line-height: 1.5;
	white-space: pre-wrap;
}

/* 加载状态样式 */
.loading-container {
	padding: 10rpx 20rpx;
}

.loading-message {
	max-width: 70%;
	padding: 20rpx;
	border-radius: 4rpx 20rpx 20rpx 20rpx;
	background-color: white;
	color: #666;
	border: 1px solid #e0e0e0;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.05);
}

.loading-text {
	color: #666;
	font-size: 28rpx;
	margin-bottom: 10rpx;
}

/* 打字指示器动画 */
.typing-indicator {
	display: flex;
	flex-direction: row;
	gap: 5rpx;
}

.dot {
	width: 10rpx;
	height: 10rpx;
	border-radius: 50%;
	background-color: #999;
	opacity: 0.6;
	animation: pulse 1.5s infinite ease-in-out;
}

.dot:nth-child(1) {
	animation-delay: 0s;
}

.dot:nth-child(2) {
	animation-delay: 0.3s;
}

.dot:nth-child(3) {
	animation-delay: 0.6s;
}

@keyframes pulse {
	0%, 100% {
		opacity: 0.4;
		transform: scale(1);
	}
	50% {
		opacity: 1;
		transform: scale(1.2);
	}
}

/* 快捷操作区域样式 */
.quick-actions {
	padding: 20rpx;
	background-color: #f8f9fa;
	border-top: 1px solid #e0e0e0;
	display: flex;
	justify-content: center;
}

.action-button {
	display: flex;
	align-items: center;
	gap: 8rpx;
	padding: 16rpx 24rpx;
	background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
	color: white;
	border: none;
	border-radius: 12rpx;
	font-size: 24rpx;
	font-weight: 600;
	box-shadow: 0 4rpx 12rpx rgba(34, 197, 94, 0.3);
	transition: all 0.3s ease;
}

.action-button:disabled {
	background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
	box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.1);
	opacity: 0.6;
}

.action-button:active:not(:disabled) {
	transform: translateY(2rpx);
	box-shadow: 0 2rpx 8rpx rgba(34, 197, 94, 0.4);
}

.btn-icon {
	font-size: 24rpx;
}

.btn-text {
	font-size: 24rpx;
	font-weight: 600;
}

/* 输入区域样式 */
.input-container {
	padding: 20rpx;
	background-color: white;
	border-top: 1px solid #e0e0e0;
	display: flex;
	align-items: flex-end;
	gap: 20rpx;
}

.input-textarea {
	flex: 1;
	min-height: 60rpx;
	max-height: 160rpx;
	padding: 16rpx;
	border: 1px solid #e0e0e0;
	border-radius: 8rpx;
	background-color: #f9f9f9;
	font-size: 28rpx;
	line-height: 1.4;
}

.send-button {
	padding: 16rpx 24rpx;
	background-color: #007AFF;
	color: white;
	border: none;
	border-radius: 8rpx;
	font-size: 24rpx;
	min-width: 100rpx;
}

.send-button:disabled {
	background-color: #ccc;
	color: #999;
}

.stop-button {
	padding: 16rpx 24rpx;
	background-color: #ff3b30;
	color: white;
	border: none;
	border-radius: 8rpx;
	font-size: 24rpx;
	min-width: 100rpx;
}
</style>