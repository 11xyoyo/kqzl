<template>
	<view class="charts-container">
		<!-- 时间选择器 -->
		<view class="time-selector">
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
			<button @click="fetchAllData" class="refresh-btn" :loading="loading">{{ loading ? '加载中...' : '刷新数据' }}</button>
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
		
		<!-- 下拉刷新 -->
		<scroll-view scroll-y="true" refresher-enabled="true" @refresherrefresh="onRefresh" :refresher-triggered="refreshing" class="scroll-container">
			<!-- 温度图表 -->
			<view class="chart-section temperature-section">
				<view class="section-header">
					<view class="status-bar temperature-bar"></view>
					<text class="section-title">温度监测 (°C)</text>
				</view>
				<qiun-data-charts type="line" :chartData="tempChartData" :opts="tempOpts" :ontouch="true" />
			</view>
			
			<!-- 湿度变化趋势图表 -->
			<view class="chart-section">
				<view class="chart-header">
					<text class="chart-title">湿度变化趋势 (%)</text>
				</view>
				<view class="status-bar">
					<view class="status-item good"></view>
					<view class="status-item good"></view>
					<view class="status-item good"></view>
					<view class="status-item warning"></view>
					<view class="status-item good"></view>
					<view class="status-item good"></view>
					<view class="status-item good"></view>
				</view>
				<view class="charts-box">
					<qiun-data-charts type="line" :opts="humiOpts" :chartData="humiChartData" :ontouch="true" />
				</view>
			</view>
			
			<!-- 甲醛浓度图表 -->
			<view class="chart-section">
				<view class="chart-header">
					<text class="chart-title">甲醛浓度 (mg/m³)</text>
				</view>
				<view class="charts-box">
					<qiun-data-charts type="line" :opts="formOpts" :chartData="formChartData" :ontouch="true" />
				</view>
			</view>
			
			<!-- VOC浓度图表 -->
			<view class="chart-section">
				<view class="chart-header">
					<text class="chart-title">VOC浓度 (ppm)</text>
				</view>
				<view class="charts-box">
					<qiun-data-charts type="column" :opts="vocOpts" :chartData="vocChartData" :ontouch="true" />
				</view>
			</view>
			
			<!-- 紫外线强度图表 -->
			<view class="chart-section">
				<view class="chart-header">
					<text class="chart-title">紫外线强度 (UV)</text>
				</view>
				<view class="charts-box">
					<qiun-data-charts type="area" :opts="uvOpts" :chartData="uvChartData" :ontouch="true" />
				</view>
			</view>
			
			<!-- 噪音水平图表 -->
			<view class="chart-section">
				<view class="chart-header">
					<text class="chart-title">噪音水平 (dB)</text>
				</view>
				<view class="charts-box">
					<qiun-data-charts type="line" :opts="noiseOpts" :chartData="noiseChartData" :ontouch="true" />
				</view>
			</view>
			
		</scroll-view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			refreshing: false,
			loading: false,
			// 时间选择器
			startTime: '',
			endTime: '',
			// 弹窗时间选择器
			showTimePicker: false,
			currentPickerType: 'start', // 'start' 或 'end'
			tempTime: '', // 临时存储选择的时间
			// 滚轮选择器数据
			pickerValue: [0, 0, 0, 0, 0, 0], // [年, 月, 日, 时, 分, 秒]
			years: [],
			months: [],
			days: [],
			hours: [],
			minutes: [],
			seconds: [],
			// 温度图表数据
			tempChartData: {
				categories: [],
				series: [{
					name: "温度",
					data: []
				}]
			},
			tempOpts: {
				color: ["#FF6B6B"],
				padding: [15, 10, 0, 15],
				enableScroll: true,
				legend: {},
				xAxis: {
					disableGrid: true,
					rotateLabel: true,
					scrollShow: true,
					itemCount: 6,
					scrollAlign: "right",
					fontColor: "#666"
				},
				yAxis: {
					gridType: "dash",
					dashLength: 2,
					fontColor: "#666"
				},
				extra: {
					line: {
						type: "straight",
						width: 2,
						activeType: "hollow",
						activeBgColor: "#FF6B6B",
						activeBgOpacity: 0.1,
						areaOpacity: 0.2
					}
				}
			},
			
			// 湿度图表数据
			humiChartData: {
				categories: [],
				series: [{
					name: "湿度",
					data: []
				}]
			},
			humiOpts: {
				color: ["#4ECDC4"],
				padding: [15, 10, 0, 15],
				enableScroll: true,
				legend: {},
				xAxis: {
					disableGrid: true,
					rotateLabel: true,
					scrollShow: true,
					itemCount: 6,
					scrollAlign: "right",
					fontColor: "#666"
				},
				yAxis: {
					gridType: "dash",
					dashLength: 2,
					fontColor: "#666"
				},
				extra: {
					line: {
						type: "straight",
						width: 2,
						activeType: "hollow",
						activeBgColor: "#4ECDC4",
						activeBgOpacity: 0.1,
						areaOpacity: 0.2
					}
				}
			},
			
			// 甲醛图表数据
			formChartData: {
				categories: [],
				series: [{
					name: "甲醛",
					data: []
				}]
			},
			formOpts: {
				color: ["#FFD93D"],
				padding: [15, 10, 0, 15],
				enableScroll: true,
				legend: {},
				xAxis: {
					disableGrid: true,
					rotateLabel: true,
					scrollShow: true,
					itemCount: 6,
					scrollAlign: "right",
					fontColor: "#666"
				},
				yAxis: {
					gridType: "dash",
					dashLength: 2,
					fontColor: "#666"
				},
				extra: {
					line: {
						type: "straight",
						width: 2,
						activeType: "hollow",
						activeBgColor: "#FFD93D",
						activeBgOpacity: 0.1,
						areaOpacity: 0.3
					}
				}
			},
			
			// VOC图表数据
			vocChartData: {
				categories: [],
				series: [{
					name: "VOC",
					data: []
				}]
			},
			vocOpts: {
				color: ["#FF6B9D"],
				padding: [15, 10, 0, 15],
				enableScroll: true,
				legend: {},
				xAxis: {
					disableGrid: true,
					rotateLabel: true,
					scrollShow: true,
					itemCount: 6,
					scrollAlign: "right",
					fontColor: "#666"
				},
				yAxis: {
					gridType: "dash",
					dashLength: 2,
					fontColor: "#666"
				},
				extra: {
					column: {
						width: 30,
						activeBgColor: "#FF6B9D",
						activeBgOpacity: 0.1
					}
				}
			},
			
			// 紫外线图表数据
			uvChartData: {
				categories: [],
				series: [{
					name: "紫外线",
					data: []
				}]
			},
			uvOpts: {
				color: ["#74B9FF"],
				padding: [15, 10, 0, 15],
				enableScroll: true,
				legend: {},
				xAxis: {
					disableGrid: true,
					rotateLabel: true,
					scrollShow: true,
					itemCount: 6,
					scrollAlign: "right",
					fontColor: "#666"
				},
				yAxis: {
					gridType: "dash",
					dashLength: 2,
					fontColor: "#666"
				},
				extra: {
					area: {
						type: "curve",
						addLine: true,
						width: 2,
						activeBgColor: "#74B9FF",
						activeBgOpacity: 0.1,
						opacity: 0.3
					}
				}
			},
			
			// 噪音图表数据
			noiseChartData: {
				categories: [],
				series: [{
					name: "噪音",
					data: []
				}]
			},
			noiseOpts: {
				color: ["#A29BFE"],
				padding: [15, 10, 0, 15],
				enableScroll: true,
				legend: {},
				xAxis: {
					disableGrid: true,
					rotateLabel: true,
					scrollShow: true,
					itemCount: 6,
					scrollAlign: "right",
					fontColor: "#666"
				},
				yAxis: {
					gridType: "dash",
					dashLength: 2,
					fontColor: "#666"
				},
				extra: {
					line: {
						type: "straight",
						width: 2,
						activeType: "hollow",
						activeBgColor: "#A29BFE",
						activeBgOpacity: 0.1,
						areaOpacity: 0.2
					}
				}
			}
		};
	},
	methods: {
		// 初始化时间
		initTime() {
			const now = new Date();
			const endTime = new Date(now);
			const startTime = new Date(now.getTime() - 2 * 60 * 1000); // 默认2分钟前
			
			this.startTime = this.formatDateTimeForPicker(startTime);
			this.endTime = this.formatDateTimeForPicker(endTime);
		},
		
		// 格式化时间用于picker（微信小程序兼容格式）
		formatDateTimeForPicker(date) {
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');
			const hours = String(date.getHours()).padStart(2, '0');
			const minutes = String(date.getMinutes()).padStart(2, '0');
			// 微信小程序datetime picker需要这种格式
			return `${year}-${month}-${day}T${hours}:${minutes}`;
		},
		
		// 格式化显示时间
		formatDateTime(dateTimeStr) {
			if (!dateTimeStr) return '';
			return dateTimeStr.replace('T', ' ').substring(0, 16);
		},
		
		// 开始时间变化
		onStartTimeChange(e) {
			console.log('开始时间变化:', e.detail.value);
			this.startTime = e.detail.value;
		},
		
		// 结束时间变化
		onEndTimeChange(e) {
			console.log('结束时间变化:', e.detail.value);
			this.endTime = e.detail.value;
		},
		
		// 初始化滚轮选择器数据
		initPickerData() {
			const currentYear = new Date().getFullYear();
			
			// 生成年份数组（当前年份前后5年）
			this.years = [];
			for (let i = currentYear - 5; i <= currentYear + 5; i++) {
				this.years.push(i);
			}
			
			// 生成月份数组
			this.months = [];
			for (let i = 1; i <= 12; i++) {
				this.months.push(String(i).padStart(2, '0'));
			}
			
			// 生成小时数组
			this.hours = [];
			for (let i = 0; i < 24; i++) {
				this.hours.push(String(i).padStart(2, '0'));
			}
			
			// 生成分钟数组
			this.minutes = [];
			for (let i = 0; i < 60; i++) {
				this.minutes.push(String(i).padStart(2, '0'));
			}
			
			// 生成秒钟数组
			this.seconds = [];
			for (let i = 0; i < 60; i++) {
				this.seconds.push(String(i).padStart(2, '0'));
			}
			
			// 初始化日期数组
			this.updateDays();
		},
		
		// 更新日期数组（根据年月变化）
		updateDays() {
			const year = this.years[this.pickerValue[0]];
			const month = parseInt(this.months[this.pickerValue[1]]);
			const daysInMonth = new Date(year, month, 0).getDate();
			
			this.days = [];
			for (let i = 1; i <= daysInMonth; i++) {
				this.days.push(String(i).padStart(2, '0'));
			}
			
			// 如果当前选择的日期超出了新月份的天数，调整到最后一天
			if (this.pickerValue[2] >= daysInMonth) {
				this.pickerValue[2] = daysInMonth - 1;
			}
		},
		
		// 滚轮选择器变化
		onPickerViewChange(e) {
			const newValue = e.detail.value;
			const oldValue = [...this.pickerValue];
			
			this.pickerValue = newValue;
			
			// 如果年份或月份发生变化，更新日期数组
			if (oldValue[0] !== newValue[0] || oldValue[1] !== newValue[1]) {
				this.updateDays();
			}
		},
		
		// 从时间字符串设置picker值
		setPickerValueFromTime(timeStr) {
			if (!timeStr) {
				// 如果没有时间字符串，使用当前时间
				const now = new Date();
				this.setPickerValueFromDate(now);
				return;
			}
			
			// 解析时间字符串
			const date = this.parseDate(timeStr);
			this.setPickerValueFromDate(date);
		},
		
		// 从Date对象设置picker值
		setPickerValueFromDate(date) {
			const year = date.getFullYear();
			const month = date.getMonth() + 1;
			const day = date.getDate();
			const hour = date.getHours();
			const minute = date.getMinutes();
			const second = date.getSeconds();
			
			// 找到对应的索引
			const yearIndex = this.years.findIndex(y => y === year);
			const monthIndex = this.months.findIndex(m => parseInt(m) === month);
			const dayIndex = this.days.findIndex(d => parseInt(d) === day);
			const hourIndex = this.hours.findIndex(h => parseInt(h) === hour);
			const minuteIndex = this.minutes.findIndex(m => parseInt(m) === minute);
			const secondIndex = this.seconds.findIndex(s => parseInt(s) === second);
			
			this.pickerValue = [
				yearIndex >= 0 ? yearIndex : 5, // 默认当前年份
				monthIndex >= 0 ? monthIndex : month - 1,
				dayIndex >= 0 ? dayIndex : day - 1,
				hourIndex >= 0 ? hourIndex : hour,
				minuteIndex >= 0 ? minuteIndex : minute,
				secondIndex >= 0 ? secondIndex : second
			];
		},
		
		// 从picker值获取时间字符串
		getTimeStringFromPicker() {
			const year = this.years[this.pickerValue[0]];
			const month = this.months[this.pickerValue[1]];
			const day = this.days[this.pickerValue[2]];
			const hour = this.hours[this.pickerValue[3]];
			const minute = this.minutes[this.pickerValue[4]];
			const second = this.seconds[this.pickerValue[5]];
			
			// 返回微信小程序兼容格式
			return `${year}-${month}-${day}T${hour}:${minute}`;
		},
		
		// 打开开始时间选择器
		openStartTimePicker() {
			this.currentPickerType = 'start';
			this.setPickerValueFromTime(this.startTime);
			this.showTimePicker = true;
		},
		
		// 打开结束时间选择器
		openEndTimePicker() {
			this.currentPickerType = 'end';
			this.setPickerValueFromTime(this.endTime);
			this.showTimePicker = true;
		},
		
		// 关闭时间选择器弹窗
		closeTimePicker() {
			this.showTimePicker = false;
		},
		
		// 确认时间选择
		confirmTimeSelection() {
			const selectedTime = this.getTimeStringFromPicker();
			
			if (this.currentPickerType === 'start') {
				this.startTime = selectedTime;
				console.log('确认开始时间:', this.startTime);
			} else {
				this.endTime = selectedTime;
				console.log('确认结束时间:', this.endTime);
			}
			this.closeTimePicker();
		},
		
		// 一次性获取所有图表数据
		fetchAllData() {
			if (this.loading) return;
			
			console.log('开始获取所有图表数据...');
			this.loading = true;
			
			// 一次性请求所有数据类型
			uniCloud.callFunction({
				name: 'getHistoryData',
				data: {
					startTime: this.parseDate(this.startTime).getTime(),
					endTime: this.parseDate(this.endTime).getTime(),
					dataType: 'all' // 获取所有类型的数据
				}
			}).then(res => {
				console.log('云函数调用成功:', res);
				
				if (res.result.code === 0) {
					const allData = res.result.data.list;
					console.log('获取到的所有数据:', allData);
					
					// 一次性更新所有图表数据
					this.updateAllChartsData(allData);
					
					uni.showToast({
						title: '数据加载完成',
						icon: 'success',
						duration: 1500
					});
				} else {
					console.error('云函数返回错误:', res.result.message);
					uni.showToast({
						title: res.result.message || '数据加载失败',
						icon: 'none',
						duration: 2000
					});
				}
			}).catch(error => {
				console.error('云函数调用失败:', error);
				uni.showToast({
					title: '网络请求失败',
					icon: 'none',
					duration: 2000
				});
			}).finally(() => {
				this.loading = false;
			});
		},
		
		// iOS兼容的日期解析函数
		parseDate(dateStr) {
			if (!dateStr) return new Date();
			
			// 处理云函数返回的中文本地化时间格式，如 "2024/1/15 14:30:25"
			if (typeof dateStr === 'string' && dateStr.includes('/')) {
				// 直接使用云函数返回的格式，已经是标准格式
				return new Date(dateStr);
			}
			
			// 处理微信小程序的时间格式 "yyyy-MM-ddTHH:mm" 和普通格式 "yyyy-MM-dd HH:mm"
			if (dateStr && dateStr.includes('-')) {
				let convertedStr;
				if (dateStr.includes('T')) {
					// 微信小程序格式: "yyyy-MM-ddTHH:mm" -> "yyyy/MM/dd HH:mm:ss"
					convertedStr = dateStr.replace(/-/g, '/').replace('T', ' ') + ':00';
				} else {
					// 普通格式: "yyyy-MM-dd HH:mm" -> "yyyy/MM/dd HH:mm:ss"
					convertedStr = dateStr.replace(/-/g, '/') + ':00';
				}
				return new Date(convertedStr);
			}
			
			return new Date(dateStr);
		},
		

		
		onRefresh() {
				this.refreshing = true;
				this.fetchAllData();
				// fetchAllData方法内部已经处理了loading状态
				setTimeout(() => {
					this.refreshing = false;
				}, 1000);
			},
			
			// 一次性更新所有图表数据
			updateAllChartsData(allData) {
				console.log('updateAllChartsData called with:', allData);
				
				// 处理数据格式化的通用函数
				const formatChartData = (data, name) => {
					if (!data || data.length === 0) {
						console.log(`${name}数据为空或长度为0`);
						return {
							categories: [],
							series: [{ name: name, data: [] }]
						};
					}
					
					const categories = data.map(item => {
						const date = this.parseDate(item.time);
						return date.getHours() + ':' + String(date.getMinutes()).padStart(2, '0');
					});
					
					return {
						categories: categories,
						series: [{
							name: name,
							data: data.map(item => item.value)
						}]
					};
				};
				
				// 批量更新所有图表数据
				const updates = {
					tempChartData: formatChartData(allData.temperature, '温度'),
					humiChartData: formatChartData(allData.humidity, '湿度'),
					formChartData: formatChartData(allData.formaldehyde, '甲醛'),
					vocChartData: formatChartData(allData.voc, 'VOC'),
					uvChartData: formatChartData(allData.uv, '紫外线'),
					noiseChartData: formatChartData(allData.noise, '噪音')
				};
				
				// 一次性更新所有数据
				Object.keys(updates).forEach(key => {
					this.$set(this, key, updates[key]);
				});
				
				console.log('所有图表数据更新完成:', updates);
				
				// 确保DOM更新完成后强制重新渲染
				this.$nextTick(() => {
					console.log('所有图表DOM更新完成');
				});
			},

		},
	onLoad() {
		// 初始化时间选择器
		this.initTime();
		// 初始化滚轮选择器数据
		this.initPickerData();
		// 获取初始数据
		this.fetchAllData();
	},
	onShow() {
		// 页面显示时无需自动刷新
	},
	onHide() {
		// 页面隐藏
	},
	onUnload() {
		// 页面卸载
	},
	onPullDownRefresh() {
		// 下拉刷新
		this.fetchAllData();
		uni.stopPullDownRefresh();
	}
};
</script>

<style>
.charts-container {
	background-color: #f5f7fa;
	height: 100vh;
	display: flex;
	flex-direction: column;
}

/* 时间选择器样式 */
.time-selector {
	background: white;
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.time-picker-row {
	display: flex;
	align-items: center;
	margin-bottom: 20rpx;
	justify-content: space-between;
}

.time-label {
	font-size: 28rpx;
	color: #333;
	font-weight: 500;
	min-width: 140rpx;
}

.time-picker {
	flex: 1;
	margin-left: 20rpx;
	display: flex;
	align-items: center;
	padding: 20rpx 30rpx;
	background: #f8f9fa;
	border-radius: 12rpx;
	border: 2rpx solid #e9ecef;
	cursor: pointer;
	transition: all 0.3s ease;
}

.time-picker:active {
	background: #e9ecef;
	transform: scale(0.98);
}

.picker-text {
	flex: 1;
	font-size: 26rpx;
	color: #495057;
}

.picker-icon {
	font-size: 32rpx;
	color: #667eea;
	margin-left: 10rpx;
}

.refresh-btn {
	width: 100%;
	height: 80rpx;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	border: none;
	border-radius: 12rpx;
	font-size: 28rpx;
	font-weight: 500;
	margin-top: 10rpx;
}

.scroll-container {
	flex: 1;
	padding: 20rpx;
}

.chart-section {
	background-color: #ffffff;
	margin-bottom: 30rpx;
	border-radius: 15rpx;
	box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
	overflow: hidden;
}

.chart-header {
	padding: 25rpx 30rpx 15rpx;
	border-bottom: 1rpx solid #f0f0f0;
}

/* 弹窗样式 */
.popup-overlay {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-color: rgba(0, 0, 0, 0.5);
	z-index: 9999;
	display: flex;
	align-items: center;
	justify-content: center;
	animation: fadeIn 0.3s ease;
}

.popup-content {
	width: 90%;
	max-width: 500rpx;
	background: white;
	border-radius: 20rpx;
	overflow: hidden;
	animation: slideUp 0.3s ease;
}

.popup-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 30rpx;
	border-bottom: 1rpx solid #f0f0f0;
	background: #f8f9fa;
}

.popup-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #333;
}

.popup-close {
	font-size: 36rpx;
	color: #999;
	cursor: pointer;
	padding: 10rpx;
	line-height: 1;
}

.popup-close:active {
	color: #666;
}

.popup-body {
	padding: 20rpx 30rpx;
}

/* 滚轮选择器容器 */
.picker-view-container {
	width: 100%;
	height: 400rpx;
	position: relative;
}

.time-picker-view {
	width: 100%;
	height: 100%;
}

.picker-item {
	height: 80rpx;
	line-height: 80rpx;
	text-align: center;
	font-size: 28rpx;
	color: #333;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.3s ease;
}

/* 选中项样式 */
.picker-view-column {
	position: relative;
}

/* 添加选中指示器 */
.picker-view-container::before {
	content: '';
	position: absolute;
	top: 50%;
	left: 0;
	right: 0;
	height: 80rpx;
	transform: translateY(-50%);
	background: rgba(102, 126, 234, 0.1);
	border-top: 2rpx solid #667eea;
	border-bottom: 2rpx solid #667eea;
	z-index: 1;
	pointer-events: none;
}

.popup-footer {
	display: flex;
	padding: 20rpx 30rpx 30rpx;
	gap: 20rpx;
}

.popup-btn {
	flex: 1;
	height: 80rpx;
	border: none;
	border-radius: 12rpx;
	font-size: 28rpx;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.3s ease;
}

.cancel-btn {
	background: #f8f9fa;
	color: #666;
	border: 2rpx solid #e9ecef;
}

.cancel-btn:active {
	background: #e9ecef;
}

.confirm-btn {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
}

.confirm-btn:active {
	opacity: 0.8;
}

@keyframes fadeIn {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}

@keyframes slideUp {
	from {
		transform: translateY(100rpx);
		opacity: 0;
	}
	to {
		transform: translateY(0);
		opacity: 1;
	}
}

.chart-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #333;
	letter-spacing: 1rpx;
}

.status-bar {
	display: flex;
	justify-content: space-between;
	padding: 15rpx 30rpx;
	gap: 10rpx;
}

.status-item {
	flex: 1;
	height: 8rpx;
	border-radius: 4rpx;
}

.status-item.good {
	background-color: #52c41a;
}

.status-item.warning {
	background-color: #faad14;
}

.status-item.danger {
	background-color: #ff4d4f;
}

.charts-box {
	padding: 20rpx 30rpx 30rpx;
	height: 400rpx;
}

/* 响应式设计 */
@media screen and (max-width: 750rpx) {
	.scroll-container {
		padding: 15rpx;
	}
	
	.chart-section {
		margin-bottom: 20rpx;
	}
	
	.charts-box {
		height: 350rpx;
		padding: 15rpx 20rpx 25rpx;
	}
}
</style>