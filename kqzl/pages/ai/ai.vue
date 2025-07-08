<template>
	<view class="setting">
		<!-- 时间选择器区域 -->
		<view class="time-selector-section">
			<view class="time-picker-row">
				<text class="time-label">开始时间:</text>
				<view class="time-picker" @click="openStartTimePicker">
					<view class="picker-text">{{ formatDateTime(startTime) }}</view>
					<text class="picker-icon">📅</text>
				</view>
			</view>
			<view class="time-picker-row">
				<text class="time-label">结束时间:</text>
				<view class="time-picker" @click="openEndTimePicker">
					<view class="picker-text">{{ formatDateTime(endTime) }}</view>
					<text class="picker-icon">📅</text>
				</view>
			</view>
			<button @click="analyzeEnvironmentData" class="analyze-btn" :loading="analyzing">{{ analyzing ? 'AI分析中...' : '获取环境数据并分析' }}</button>
		</view>
		
		<!-- 滚轮式时间选择弹窗 -->
		<view class="popup-overlay" v-if="showTimePicker" @click="closeTimePicker">
			<view class="popup-content" @click.stop>
				<view class="popup-header">
					<text class="popup-title">{{ currentPickerType === 'start' ? '选择开始时间' : '选择结束时间' }}</text>
					<text class="popup-close" @click="closeTimePicker">✕</text>
				</view>
				<view class="popup-body">
					<view class="picker-view-container">
						<picker-view :value="pickerValue" @change="onPickerViewChange" class="time-picker-view">
							<!-- 年份列 -->
							<picker-view-column>
								<view class="picker-item" v-for="(year, index) in years" :key="index">
									{{ year }}年
								</view>
							</picker-view-column>
							<!-- 月份列 -->
							<picker-view-column>
								<view class="picker-item" v-for="(month, index) in months" :key="index">
									{{ month }}月
								</view>
							</picker-view-column>
							<!-- 日期列 -->
							<picker-view-column>
								<view class="picker-item" v-for="(day, index) in days" :key="index">
									{{ day }}日
								</view>
							</picker-view-column>
							<!-- 小时列 -->
							<picker-view-column>
								<view class="picker-item" v-for="(hour, index) in hours" :key="index">
									{{ hour }}时
								</view>
							</picker-view-column>
							<!-- 分钟列 -->
							<picker-view-column>
								<view class="picker-item" v-for="(minute, index) in minutes" :key="index">
									{{ minute }}分
								</view>
							</picker-view-column>
							<!-- 秒钟列 -->
							<picker-view-column>
								<view class="picker-item" v-for="(second, index) in seconds" :key="index">
									{{ second }}秒
								</view>
							</picker-view-column>
						</picker-view>
					</view>
				</view>
				<view class="popup-footer">
					<button class="popup-btn cancel-btn" @click="closeTimePicker">取消</button>
					<button class="popup-btn confirm-btn" @click="confirmTimeSelection">确定</button>
				</view>
			</view>
		</view>
		
		<view class="kefu-box">
	  <!-- 聊天内容 -->
			<scroll-view :scroll-y="true" id="scroll-view-content" class="scroll-h"
				:style="{height: scrollStyle.contentViewHeight + 'px'}"
			    :show-scrollbar="true"
				:scroll-with-animation="true" 
				:scroll-anchoring="true" 
				refresher-background="#f5f5f5" 
				:refresher-triggered="refreshTriggered"  
				:scroll-into-view="'chat-item-'+scrollMsgIdx"
				:scroll-top="scrollTop"
			>
					<view v-for="(item, index) in chatList" :key="index" class="content"
						:style="{ flexDirection: item.role == 'user' ? 'row-reverse' : '' }" :id="'chat-item-'+index">
						<!-- 头像 -->
						<image  v-if="item.role == 'assistant'" src='/static/wxservice.png' mode="aspectFill" class="avatar-image"></image>
						<image  v-if="item.role == 'user'" src='/static/wxme.png' mode="aspectFill" class="avatar-image"></image>
	        <!-- 用户名称、消息时间 -->
						<view class="user-chat-info">
							<view class="user-info" :class="item.role == 'user' ? 'order-2' : ''" :style="{ flexDirection: item.role == 'user' ? 'row-reverse' : '' }">
								<view class="user-chat-name" v-if="item.role == 'user'">
									用户
								</view>
								<view class="user-chat-name" v-if="item.role == 'assistant'">
									ai助手
								</view>
							</view>
	          <!-- 聊天消息 -->
							<view class="content-text" :style="{ textAlign: item.role == 'user' ? 'right' : 'left' }">
								<view class="text-span" v-if="item.role == 'user'">
							<rich-text :nodes="item.content"></rich-text>
						</view>
								<view class="role-span" v-if="item.role == 'assistant'">
							<rich-text :nodes="item.content"></rich-text>
						</view>
							</view>
							<view v-if="item.role == 'assistant' && item.ds_loading" class="loading-container">
						<text class="loading-text">思考中......</text>
					</view>
						</view>
					</view>
			</scroll-view>
		</view>
		<!-- 底部发送信息 -->
		<view class="footerCon" :style="'transform: translate3d(0,' + percent + '%,0);'" ref="footerCon">
			<view class="footer row-bottom" ref="footer">
				<textarea style="width:80%;" placeholder="请输入内容" class="input" ref="input" @focus="focus" cursor-spacing="20" v-model="message" confirm-type="send" @confirm="sendTest('')" auto-height></textarea>
				<view class="send" @click="sendTest('')">
					发送
				</view>
			</view>
		</view>
	</view>
	
</template>

<script>
import {StreamRequest,decodeUTF8} from '../../common.js'

export default {
	data() {
		return {
			message: '', //输入信息
			userInfo: '',  //用户信息
			chatList: [{ role: "assistant", content: "您好,我是ai助手.您有什么问题可以问我,我会尽力解答(*^_^*)"}],  //信息列表
			knowledgeInfo: '', //知识库
			agentUser: '', //缓存信息
			constData: this.$constData,
			page: 1,
			pageSize: 10,
			totalPage: -1,//总聊天记录页数
			freshing: false,
			// 超出限制数组
			model: 'product',
			pid: 1,
			percent: 0,
			refreshTriggered: true,
			isSocketOpen: false,//webscoket是否已经打开
			scrollMsgIdx: 0, // 滚动条定位为到哪条消息
			isMorePage: false,//是否多屏数据
			re_message:'',
			scrollTop:0,
			scrollStyle:{
				pageHeight: 0,
				contentViewHeight: 0,
			    footViewHeight: 90,
				mitemHeight: 0
			},  //滚动插件style
			// 时间选择器相关
			startTime: new Date(Date.now() - 10 * 60 * 1000), // 默认10分钟前
			endTime: new Date(), // 默认当前时间
			showTimePicker: false,
			currentPickerType: 'start', // 'start' 或 'end'
			pickerValue: [0, 0, 0, 0, 0, 0],
			years: [],
			months: [],
			days: [],
			hours: [],
			minutes: [],
			seconds: [],
			analyzing: false
		};
	},
	created () {
	　　let res = uni.getSystemInfoSync();   //获取手机可使用窗口高度     api为获取系统信息同步接口
	　　this.scrollStyle.pageHeight = res.windowHeight;
	　　this.scrollStyle.contentViewHeight = res.windowHeight - uni.getSystemInfoSync().screenWidth / 750 * (100) - 70; //像素   因为给出的是像素高度 然后我们用的是upx  所以换算一下 
	　　//this.scrollToBottom();   //创建后调用回到底部方法
		this.chatList = [{ role: "assistant", content: "您好,我是ai助手您有什么问题可以问我,我会尽力解答(*^_^*)"}]  //信息列表
	},
	
	mounted() {
		this.getChatHeight();
		this.initTimePickerData();
	},
	
	watch: {
		chatList(newVal, oldVal) {
			this.chatList = newVal;
		}
	},

	methods: {
		// 时间格式化
		formatDateTime(date) {
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');
			const hour = String(date.getHours()).padStart(2, '0');
			const minute = String(date.getMinutes()).padStart(2, '0');
			const second = String(date.getSeconds()).padStart(2, '0');
			return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
		},
		
		// 初始化时间选择器数据
		initTimePickerData() {
			const currentYear = new Date().getFullYear();
			this.years = [];
			for (let i = currentYear - 5; i <= currentYear; i++) {
				this.years.push(i);
			}
			
			this.months = [];
			for (let i = 1; i <= 12; i++) {
				this.months.push(i);
			}
			
			this.updateDays();
			
			this.hours = [];
			for (let i = 0; i <= 23; i++) {
				this.hours.push(i);
			}
			
			this.minutes = [];
			for (let i = 0; i <= 59; i++) {
				this.minutes.push(i);
			}
			
			this.seconds = [];
			for (let i = 0; i <= 59; i++) {
				this.seconds.push(i);
			}
		},
		
		// 更新天数
		updateDays() {
			const year = this.years[this.pickerValue[0]];
			const month = this.months[this.pickerValue[1]];
			const daysInMonth = new Date(year, month, 0).getDate();
			
			this.days = [];
			for (let i = 1; i <= daysInMonth; i++) {
				this.days.push(i);
			}
		},
		
		// 打开开始时间选择器
		openStartTimePicker() {
			this.currentPickerType = 'start';
			this.setPickerValueFromDate(this.startTime);
			this.showTimePicker = true;
		},
		
		// 打开结束时间选择器
		openEndTimePicker() {
			this.currentPickerType = 'end';
			this.setPickerValueFromDate(this.endTime);
			this.showTimePicker = true;
		},
		
		// 关闭时间选择器
		closeTimePicker() {
			this.showTimePicker = false;
		},
		
		// 从日期设置picker值
		setPickerValueFromDate(date) {
			const year = date.getFullYear();
			const month = date.getMonth() + 1;
			const day = date.getDate();
			const hour = date.getHours();
			const minute = date.getMinutes();
			const second = date.getSeconds();
			
			this.pickerValue = [
				this.years.indexOf(year),
				this.months.indexOf(month),
				this.days.indexOf(day),
				this.hours.indexOf(hour),
				this.minutes.indexOf(minute),
				this.seconds.indexOf(second)
			];
		},
		
		// picker值变化
		onPickerViewChange(e) {
			this.pickerValue = e.detail.value;
			this.updateDays();
		},
		
		// 确认时间选择
		confirmTimeSelection() {
			const year = this.years[this.pickerValue[0]];
			const month = this.months[this.pickerValue[1]];
			const day = this.days[this.pickerValue[2]];
			const hour = this.hours[this.pickerValue[3]];
			const minute = this.minutes[this.pickerValue[4]];
			const second = this.seconds[this.pickerValue[5]];
			
			const selectedDate = new Date(year, month - 1, day, hour, minute, second);
			
			if (this.currentPickerType === 'start') {
				this.startTime = selectedDate;
			} else {
				this.endTime = selectedDate;
			}
			
			this.closeTimePicker();
		},
		
		// 获取环境数据并分析
		async analyzeEnvironmentData() {
			if (this.analyzing) return;
			
			if (this.startTime >= this.endTime) {
				uni.showToast({
					title: '开始时间不能大于等于结束时间',
					icon: 'none'
				});
				return;
			}
			
			this.analyzing = true;
			
			try {
				// 先获取历史数据
				console.log('开始获取历史环境数据...');
				const historyData = await this.fetchEnvironmentHistoryData();
				
				if (!historyData || historyData.length === 0) {
					uni.showToast({
						title: '指定时间段内无环境数据',
						icon: 'none'
					});
					this.analyzing = false;
					return;
				}
				
				// 构建包含实际数据的分析提示
				const dataAnalysis = this.formatHistoryDataForAI(historyData);
				const analysisPrompt = `请分析${this.formatDateTime(this.startTime)}到${this.formatDateTime(this.endTime)}时间段的环境数据。\n\n实际环境数据：\n${dataAnalysis}\n\n请基于以上真实数据提供：\n1. 环境质量综合评估\n2. 各项指标分析（温度、湿度、PM2.5、甲醛、VOC、紫外线、噪音等）\n3. 数据趋势分析\n4. 改善建议\n5. 注意事项`;
				
				// 添加用户消息到聊天列表
				this.chatList.push({ role: "user", content: `分析${this.formatDateTime(this.startTime)}到${this.formatDateTime(this.endTime)}时间段的环境数据` });
				this.chatList.push({ role: "assistant", content: "正在分析环境数据...", ds_loading: true });
				
				// 调用AI分析
				await this.sendAIAnalysis(analysisPrompt);
				
			} catch (error) {
				console.error('环境数据分析失败:', error);
				uni.showToast({
					title: '分析失败，请重试',
					icon: 'none'
				});
			} finally {
				this.analyzing = false;
			}
		},
		
		// 获取环境历史数据
		async fetchEnvironmentHistoryData() {
			try {
				console.log('调用getHistoryData云函数获取环境数据...');
				
				// 将Date对象转换为时间戳
				const startTimestamp = this.startTime.getTime();
				const endTimestamp = this.endTime.getTime();
				
				console.log('时间参数:', {
					startTime: this.startTime.toISOString(),
					endTime: this.endTime.toISOString(),
					startTimestamp,
					endTimestamp
				});
				
				const result = await uniCloud.callFunction({
					name: 'getHistoryData',
					data: {
						startTime: startTimestamp,
						endTime: endTimestamp,
						dataType: 'all' // 获取所有类型的环境数据
					}
				});
				
				console.log('环境历史数据获取结果:', result);
				
				if (result.result.code === 0) {
					return result.result.data.list;
				} else {
					console.error('获取环境历史数据失败:', result.result.message);
					return [];
				}
			} catch (error) {
				console.error('调用getHistoryData云函数失败:', error);
				return [];
			}
		},
		
		// 格式化历史数据供AI分析
		formatHistoryDataForAI(historyData) {
			if (!historyData) {
				return '无数据';
			}
			
			// 处理dataType为'all'时返回的对象结构
			let processedData = [];
			if (historyData.temperature && Array.isArray(historyData.temperature)) {
				// 当historyData是对象时，需要重新组织数据
				const dataLength = historyData.temperature.length;
				
				// 确保所有数据类型数组都存在
				const dataTypes = ['temperature', 'humidity', 'formaldehyde', 'voc', 'uv', 'noise'];
				const validData = dataTypes.every(type => 
					historyData[type] && Array.isArray(historyData[type]) && historyData[type].length === dataLength
				);
				
				if (!validData) {
					console.error('数据结构不完整或长度不一致:', historyData);
					return '数据结构不完整';
				}
				
				for (let i = 0; i < dataLength; i++) {
					processedData.push({
						time: historyData.temperature[i]?.time || '',
						temperature: historyData.temperature[i]?.value || 0,
						humidity: historyData.humidity[i]?.value || 0,
						formaldehyde: historyData.formaldehyde[i]?.value || 0,
						voc: historyData.voc[i]?.value || 0,
						uv: historyData.uv[i]?.value || 0,
						noise: historyData.noise[i]?.value || 0
					});
				}
			} else if (Array.isArray(historyData)) {
				// 当historyData已经是数组时，直接使用
				processedData = historyData;
			} else {
				return '数据格式错误';
			}
			
			if (processedData.length === 0) {
				return '无数据';
			}
			
			// 计算各项指标的统计信息
			const stats = this.calculateEnvironmentStats(processedData);
			
			let dataText = `数据统计（共${processedData.length}条记录）：\n`;
			dataText += `温度：平均${stats.temperature.avg}°C，最高${stats.temperature.max}°C，最低${stats.temperature.min}°C\n`;
			dataText += `湿度：平均${stats.humidity.avg}%，最高${stats.humidity.max}%，最低${stats.humidity.min}%\n`;
			dataText += `甲醛：平均${stats.formaldehyde.avg}mg/m³，最高${stats.formaldehyde.max}mg/m³，最低${stats.formaldehyde.min}mg/m³\n`;
			dataText += `VOC：平均${stats.voc.avg}mg/m³，最高${stats.voc.max}mg/m³，最低${stats.voc.min}mg/m³\n`;
			dataText += `紫外线：平均${stats.uv.avg}，最高${stats.uv.max}，最低${stats.uv.min}\n`;
			dataText += `噪音：平均${stats.noise.avg}dB，最高${stats.noise.max}dB，最低${stats.noise.min}dB\n`;
			
			// 添加最近几条详细数据
			dataText += `\n最近数据样本：\n`;
			const sampleData = processedData.slice(-5); // 取最后5条数据
			sampleData.forEach((item, index) => {
				dataText += `${index + 1}. 时间：${item.time}，温度：${item.temperature}°C，湿度：${item.humidity}%，甲醛：${item.formaldehyde}mg/m³，VOC：${item.voc}mg/m³，紫外线：${item.uv}，噪音：${item.noise}dB\n`;
			});
			
			return dataText;
		},
		
		// 计算环境数据统计信息
		calculateEnvironmentStats(data) {
			const stats = {
				temperature: { sum: 0, count: 0, min: Infinity, max: -Infinity },
				humidity: { sum: 0, count: 0, min: Infinity, max: -Infinity },
				formaldehyde: { sum: 0, count: 0, min: Infinity, max: -Infinity },
				voc: { sum: 0, count: 0, min: Infinity, max: -Infinity },
				uv: { sum: 0, count: 0, min: Infinity, max: -Infinity },
				noise: { sum: 0, count: 0, min: Infinity, max: -Infinity }
			};
			
			data.forEach(item => {
				Object.keys(stats).forEach(key => {
					const value = parseFloat(item[key]) || 0;
					if (!isNaN(value)) {
						stats[key].sum += value;
						stats[key].count++;
						stats[key].min = Math.min(stats[key].min, value);
						stats[key].max = Math.max(stats[key].max, value);
					}
				});
			});
			
			// 计算平均值并格式化结果
			Object.keys(stats).forEach(key => {
				const stat = stats[key];
				stat.avg = stat.count > 0 ? (stat.sum / stat.count).toFixed(2) : '0.00';
				stat.min = stat.min === Infinity ? '0.00' : stat.min.toFixed(2);
				stat.max = stat.max === -Infinity ? '0.00' : stat.max.toFixed(2);
			});
			
			return stats;
		},
		
		// 发送AI分析请求
		async sendAIAnalysis(prompt) {
			// #ifdef APP-PLUS
			// 安卓App使用非流式传输
			var content = {
				model: "deepseek-chat",
				messages: [{ role: "user", content: prompt }],
				stream: false, // 关闭流式传输
				max_tokens: 4096,
			};
			
			this.scrollToBottom();
			
			try {
				// 使用uni.request发送非流式请求
				const response = await new Promise((resolve, reject) => {
					uni.request({
						url: 'https://api.deepseek.com/chat/completions',
						method: 'POST',
						data: content,
						header: {
							'Content-Type': 'application/json',
							'Authorization': 'Bearer sk-0c7eb8f261ab42f9b8fb5ecfa8e5bcf8'
						},
						success: resolve,
						fail: reject
					});
				});
				
				if (response.statusCode === 200 && response.data.choices && response.data.choices.length > 0) {
					const fullContent = response.data.choices[0].message.content;
					
					// 清空加载状态
					this.chatList[this.chatList.length - 1].content = "";
					this.chatList[this.chatList.length - 1].ds_loading = false;
					
					// 模拟打字机效果
					let currentIndex = 0;
					const typewriterInterval = setInterval(() => {
						if (currentIndex < fullContent.length) {
							this.chatList[this.chatList.length - 1].content = fullContent.substring(0, currentIndex + 1);
							currentIndex++;
							this.scrollToBottom();
						} else {
							clearInterval(typewriterInterval);
						}
					}, 30); // 每30ms显示一个字符
				} else {
					this.chatList[this.chatList.length - 1].content = "环境数据分析服务暂不可用，请重试。";
					this.chatList[this.chatList.length - 1].ds_loading = false;
				}
			} catch (err) {
				console.error('AI分析请求失败:', err);
				this.chatList[this.chatList.length - 1].content = "环境数据分析服务暂不可用，请重试。";
				this.chatList[this.chatList.length - 1].ds_loading = false;
			}
			// #endif
			
			// #ifndef APP-PLUS
			// 非App平台使用流式传输
			var content = {
				model: "deepseek-chat",
				messages: [{ role: "user", content: prompt }],
				stream: true,
				max_tokens: 4096,
			};
			
			this.scrollToBottom();
			
			try {
				const requestTask = await StreamRequest(content);
				
				requestTask.onHeadersReceived((e) => {
					this.chatList[this.chatList.length - 1].content = "";
					this.chatList[this.chatList.length - 1].ds_loading = true;
				});
				
				requestTask.onChunkReceived((res) => {
					var decodedData = this.decode(res.data);
					if (decodedData) {
						this.chatList[this.chatList.length - 1].content += decodedData;
						this.scrollToBottom();
					}
				});
			} catch (err) {
				this.chatList[this.chatList.length - 1].content = "环境数据分析服务暂不可用，请重试。";
				this.chatList[this.chatList.length - 1].ds_loading = false;
			}
			// #endif
		},
		//获取聊天消息的高度
		getChatHeight(){
			if(!this.isMorePage){
				let query = uni.createSelectorQuery().in(this);
				query.select('#scroll-view-content').boundingClientRect(data => {
					if (data) {
						let systemInfo = uni.getStorageSync('systemInfo');
						let editHeight = 65;//有表情框
						let toMoreHeight = 0;
						let caHeight = Number(systemInfo.windowHeight) - Number(editHeight)-Number(data.height)- toMoreHeight;
						this.isMorePage = Number(caHeight) <= 0;//是否只有一屏//内容的高度大于可用窗口的高度-输入文字的高度
						this.scrollTop = data.height * 100;
					}
				}).exec();
			}
		},


		scrollToBottom(){
			let size = this.chatList.length;
			if (size > 0) {
				this.scrollToMsgIdx(size - 1);
			}
		},

		scrollToMsgIdx(idx) {
			// 如果scrollMsgIdx值没变化，滚动条不会移动
			if (idx == this.scrollMsgIdx && idx > 0) {
				let that = this;
				let query = uni.createSelectorQuery();
				query.selectAll('.content').boundingClientRect();
				query.select('#scroll-view-content').boundingClientRect();
				query.exec((res) => {
				    that.scrollStyle.mitemHeight = 0;
				    res[0].forEach((rect) => that.scrollStyle.mitemHeight = that.scrollStyle.mitemHeight + rect.height + 40)   //获取所有内部子元素的高度
				    if (that.scrollStyle.mitemHeight > (that.scrollStyle.contentViewHeight - 100)) {   //判断子元素高度是否大于显示高度
				        that.scrollTop = that.scrollStyle.mitemHeight - that.scrollStyle.contentViewHeight    //用子元素的高度减去显示的高度就获益获得序言滚动的高度
				    }
				})
			}
			this.$nextTick(() => {
				this.scrollMsgIdx = idx;
			});

		},

		focus() {
			this.getChatHeight();
		},

		//发送消息
		async sendTest(message,flag) {
			if (!this.message && !message) {
				return uni.showToast({
					title: '消息为空',
					icon: 'none'
				})
			}
			
			// #ifdef APP-PLUS
			// 安卓App使用非流式传输
			var content = {
				model: "deepseek-chat",
				messages: [{ role: "user", content: this.message }],
				stream: false, // 关闭流式传输
				max_tokens: 4096,
			}
			this.chatList.push({ role: "user", content: this.message })
			this.chatList.push({ role: "assistant", content: "信息接收中......", ds_loading: false})
			this.scrollToBottom();
			this.message = "";
			
			try {
				// 使用uni.request发送非流式请求
				const response = await new Promise((resolve, reject) => {
					uni.request({
						url: 'https://api.deepseek.com/chat/completions',
						method: 'POST',
						data: content,
						header: {
							'Content-Type': 'application/json',
							'Authorization': 'Bearer sk-0c7eb8f261ab42f9b8fb5ecfa8e5bcf8'
						},
						success: resolve,
						fail: reject
					});
				});
				
				if (response.statusCode === 200 && response.data.choices && response.data.choices.length > 0) {
					const fullContent = response.data.choices[0].message.content;
					
					// 清空加载状态
					this.chatList[this.chatList.length - 1].content = "";
					this.chatList[this.chatList.length - 1].ds_loading = false;
					
					// 模拟打字机效果
					let currentIndex = 0;
					const typewriterInterval = setInterval(() => {
						if (currentIndex < fullContent.length) {
							this.chatList[this.chatList.length - 1].content = fullContent.substring(0, currentIndex + 1);
							currentIndex++;
							this.scrollToBottom();
						} else {
							clearInterval(typewriterInterval);
						}
					}, 30); // 每30ms显示一个字符
				} else {
					this.chatList[this.chatList.length - 1].content = "服务暂不可用，请重试。";
					this.chatList[this.chatList.length - 1].ds_loading = false;
				}
			} catch (err) {
				console.error('聊天请求失败:', err);
				this.chatList[this.chatList.length - 1].content = "服务暂不可用，请重试。";
				this.chatList[this.chatList.length - 1].ds_loading = false;
			}
			// #endif
			
			// #ifndef APP-PLUS
			// 非App平台使用流式传输
			var content = {
				model: "deepseek-chat",
				messages: [{ role: "user", content: this.message }],
				stream: true,
				max_tokens: 4096,
			}
			this.chatList.push({ role: "user", content: this.message })
			this.chatList.push({ role: "assistant", content: "信息接收中......"})
			this.scrollToBottom();
			this.message = "";
			
			try {
				const requestTask= await StreamRequest(content)
				// 返回请求头信息
				requestTask.onHeadersReceived((e)=>{
					this.chatList[this.chatList.length - 1].content = ""
					this.chatList[this.chatList.length - 1].ds_loading = true
				})
				
				// 成功回调 返回流传输信息 返回arrayBuffer
				requestTask.onChunkReceived((res)=>{
					var decodedData = this.decode(res.data);
					if (decodedData) {
						this.chatList[this.chatList.length - 1].content += decodedData
						// 数据和DOM都更新完成后，获取容器高度
						//this.getChatHeight();
						this.scrollToBottom();
					}
				})
			} catch (err) {
				this.chatList.push({ role: "assistant", content: "服务暂不可用，请重试。" });
			}
			// #endif
		},
		
		//数据解析器（处理SSE格式）
		decode(data) {
		    const text = decodeUTF8(data);
		    const lines = text.split('\n');
		    let result = '';
		    
		    for (let line of lines) {
		        if (line.startsWith('data: ')) {
		            const jsonData = line.slice(6).trim();
		            
		            // 结束标识处理
		            if (jsonData === '[DONE]') {
						this.chatList[this.chatList.length - 1].ds_loading = false;
						return result;
					}
		            
		            // 清理控制字符（防止JSON解析失败）
		            const cleanedData = jsonData.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
		            
		            try {
		                const parsedData = JSON.parse(cleanedData);
		                // 提取AI生成内容
		                result += parsedData.choices[0].delta.reasoning_content || '';
		            } catch (e) {
		                console.error('解析失败:', e);
		            }
		        }
		    }
		    return result;
		},
	},
}
</script>

<style lang="scss">

.setting {
	padding-top: 20rpx;
}

/* 时间选择器区域样式 */
.time-selector-section {
	padding: 30rpx;
	background: #fff;
	margin-bottom: 20rpx;
	border-radius: 20rpx;
	box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
}

.time-picker-row {
	display: flex;
	align-items: center;
	margin-bottom: 30rpx;
}

.time-label {
	width: 160rpx;
	font-size: 28rpx;
	color: #333;
	font-weight: 500;
}

.time-picker {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 20rpx 30rpx;
	background: #f8f9fa;
	border-radius: 12rpx;
	border: 2rpx solid #e9ecef;
	transition: all 0.3s ease;
}

.time-picker:active {
	background: #e9ecef;
	border-color: #007aff;
}

.picker-text {
	font-size: 28rpx;
	color: #333;
}

.picker-icon {
	font-size: 32rpx;
	color: #007aff;
}

.analyze-btn {
	width: 100%;
	height: 88rpx;
	background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
	color: white;
	border: none;
	border-radius: 44rpx;
	font-size: 32rpx;
	font-weight: 600;
	margin-top: 20rpx;
	transition: all 0.3s ease;
}

.analyze-btn:active {
	transform: scale(0.98);
	opacity: 0.8;
}

/* 时间选择器弹窗样式 */
.popup-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	z-index: 9999;
	display: flex;
	align-items: center;
	justify-content: center;
}

.popup-content {
	width: 90%;
	max-width: 600rpx;
	background: white;
	border-radius: 20rpx;
	overflow: hidden;
}

.popup-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 30rpx;
	border-bottom: 1rpx solid #e9ecef;
}

.popup-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #333;
}

.popup-close {
	font-size: 36rpx;
	color: #999;
	padding: 10rpx;
}

.popup-body {
	padding: 30rpx;
}

.picker-view-container {
	height: 400rpx;
	border-radius: 12rpx;
	overflow: hidden;
	border: 1rpx solid #e9ecef;
}

.time-picker-view {
	height: 100%;
}

.picker-item {
	height: 80rpx;
	line-height: 80rpx;
	text-align: center;
	font-size: 28rpx;
	color: #333;
}

.popup-footer {
	display: flex;
	padding: 30rpx;
	gap: 20rpx;
}

.popup-btn {
	flex: 1;
	height: 80rpx;
	border-radius: 12rpx;
	font-size: 28rpx;
	border: none;
}

.cancel-btn {
	background: #f8f9fa;
	color: #666;
}

.confirm-btn {
	background: #007aff;
	color: white;
}

.scroll-h {
	max-height: calc(100vh - 100px);
	padding-bottom: 20upx;
	overflow-anchor: auto;
	transform: rotate(360deg);
}
.autoHeight{
	height: calc(100% - 65px);
	overflow-y: auto;
}

.scroll-h-icon.autoHeight {
	height: calc(100% - 380px);
	overflow-y: auto;
}


.user-chat-info {
	flex: 1;
}

.user-info{
	margin-bottom: 10upx;
}
.order-2.user-info {
	text-align: right;
}

.setting {
	min-height: auto;
	background: #f5f5f5;
}

.kefu-box {
	padding: 0 20upx;
	height: calc(100vh - 100px);

	.content {
		transform: rotate(360deg);
		display: flex;
		// align-items: center;
		padding-bottom: 35upx;
	}

	.avatar-image {
		width: 60upx;
		height: 60upx;
		border-radius: 50%;
		margin: 10upx 10upx;
	}


	.content-text-knowledge {
		padding: 10upx 15upx;
		background-color: #fff !important;
		border-radius: 5px;
		margin-top: 10upx;
		position: relative;

		.knowledge-title {
			font-size: 20upx;
			// font-weight: 550;
			margin-bottom: 20upx;
		}

		.border-none {
			:last-child {
				border: none !important;
			}

			.iconfont {
				font-size: 24upx !important;
			}
		}

		.knowledge-flxe {
			min-width: 60upx;
			max-width: 600upx;
			padding: 10px 0;
			display: flex;
			justify-content: space-between;
			align-items: center;
			cursor: pointer;
			border-bottom: 1px solid #f5f5f5;
			font-size: 20upx;
		}
	}

	.content-text {
		// background-color: #c7dcfa;
		margin-top: 10upx;
		position: relative;

		.text-span {
			max-width: 600upx;
			border-radius: 5px;
			padding: 10upx 15upx;
			display: inline-block;
			background-color: #c7dcfa;
			text-align: left;
		}

		.avatar-image {
			max-width: 300upx;
			max-height: 300upx;
		}
		
		.role-span {
			max-width: 600upx;
			border-radius: 5px;
			padding: 10upx 15upx;
			display: inline-block;
			background-color: #fcb08c;
			text-align: left;
		}
	}

	.online-time {
		color: #666;
		font-size: 20upx;
	}
}



.user-chat-name {
	color: #000;
}

.setting-item {
	padding: 25upx 20upx;
	border-bottom: 2upx #dfdfdf solid;
	font-size: 20upx;
}

.avatar {
	width: 60upx;
	height: 60upx;
	border-radius: 50%;
	overflow: hidden;
}

.item-value {
	color: #999999;
}

.send {
	width: 100upx;
	text-align: center;
	height: 60upx;
	line-height: 60upx;
	background-color: #f56c6c;
	font-size: 12px;
	color: #ffffff;
	margin-left: 10px;
}

.input {
	max-height: 150upx;
	overflow-y: auto;
	overflow-x: hidden;
	flex: 1;
	margin: 0 10upx;
	border-radius: 10upx;
	background-color: #e5e5e5;
	/* padding: 17upx 30upx; */
	height: 60upx;
	padding: 0 10upx;
}

.footer {
	width: 90%;
	background-color: #fff;
	padding: 17upx 26upx;
	display: flex;
	align-items: center;
}

.footer image {
	width: 61upx;
	height: 60upx;
	display: block;
}

.footerCon {
	position: fixed;
	bottom: 0upx;
	min-height: 100upx;
	width: 100%;
	transition: all 0.005s cubic-bezier(0.25, 0.5, 0.5, 0.9);
	background-color: #fff;
}

.footerCon .on {
	bottom: 300upx;
	transform: translate3d(0, 0, 0) !important;
}


.bottom-icon {
	padding: 15upx;
}
.chat-image{
	max-width: 375upx !important;
}
.load-more{
	text-align: center;
    color: #1423fc;
    padding: 5px 0;
	transform: rotate(180deg);
}
textarea{
	background-color: #ebeced; 
	border-radius: 5px; 
	padding:5px;
}
.loading-container {
	display: flex;
	align-items: center;
	margin-top: 10px;
}

.loading-text {
	color: #fcb08c;
	font-size: 14px;
}
</style>
