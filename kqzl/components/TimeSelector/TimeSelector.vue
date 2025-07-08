<template>
	<view class="time-selector">
		<view class="selector-title">时间段选择：</view>
		<view class="selector-buttons">
			<button 
				v-for="(item, index) in timeOptions" 
				:key="index"
				:class="['time-btn', { 'active': selectedTimeIndex === index }]"
				@click="selectTimeRange(index)"
			>
				{{ item.label }}
			</button>
		</view>
	</view>
</template>

<script>
export default {
	name: 'TimeSelector',
	props: {
		// 当前选中的时间段索引
		selectedIndex: {
			type: Number,
			default: 0
		}
	},
	data() {
		return {
			timeOptions: [
				{ label: '5分钟', minutes: 5 },
				{ label: '30分钟', minutes: 30 },
				{ label: '1小时', minutes: 60 },
				{ label: '6小时', minutes: 360 },
				{ label: '12小时', minutes: 720 },
				{ label: '24小时', minutes: 1440 }
			]
		}
	},
	computed: {
		selectedTimeIndex() {
			return this.selectedIndex;
		}
	},
	methods: {
		selectTimeRange(index) {
			// 触发父组件的时间段选择事件
			this.$emit('timeChange', {
				index: index,
				timeOption: this.timeOptions[index]
			});
		}
	}
}
</script>

<style scoped>
.time-selector {
	padding: 20upx;
	background-color: #f8f9fa;
	border-bottom: 1px solid #e9ecef;
}

.selector-title {
	font-size: 28upx;
	color: #333;
	margin-bottom: 15upx;
	font-weight: 500;
}

.selector-buttons {
	display: flex;
	flex-wrap: wrap;
	gap: 10upx;
}

.time-btn {
	padding: 8upx 16upx;
	border: 1px solid #ddd;
	border-radius: 20upx;
	background-color: #fff;
	color: #666;
	font-size: 24upx;
	min-width: 80upx;
	text-align: center;
	transition: all 0.3s ease;
}

.time-btn.active {
	background-color: #1890FF;
	color: #fff;
	border-color: #1890FF;
}

.time-btn:hover {
	background-color: #e6f7ff;
	border-color: #1890FF;
}
</style>