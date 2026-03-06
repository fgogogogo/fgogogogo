// 宠物饮水记录应用
class WaterTracker {
    constructor() {
        this.data = this.loadData();
        this.chart = null;
        this.petType = 'cat';
        this.init();
    }

    // 初始化
    init() {
        this.initChart();
        this.bindEvents();
        this.updateUI();
        this.updateRecommendation();
    }

    // 加载数据
    loadData() {
        const saved = localStorage.getItem('petWaterData');
        return saved ? JSON.parse(saved) : {
            records: [],
            petName: '小白',
            petType: 'cat',
            petWeight: 4
        };
    }

    // 保存数据
    saveData() {
        localStorage.setItem('petWaterData', JSON.stringify(this.data));
    }

    // 获取日期字符串
    getDateString(date = new Date()) {
        return date.toISOString().split('T')[0];
    }

    // 获取今天日期的显示格式
    getTodayDisplay() {
        const today = new Date();
        const hours = today.getHours();
        if (hours >= 0 && hours < 6) return '凌晨';
        if (hours >= 6 && hours < 12) return '上午';
        if (hours >= 12 && hours < 18) return '下午';
        return '晚上';
    }

    // 添加饮水记录
    addWaterRecord(amount) {
        const now = new Date();
        const record = {
            id: Date.now(),
            date: this.getDateString(now),
            time: now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
            amount: parseInt(amount)
        };

        this.data.records.push(record);
        this.saveData();

        // 播放添加动画效果
        this.showAddAnimation(amount);
        this.updateUI();
    }

    // 显示添加动画
    showAddAnimation(amount) {
        const todayValue = document.getElementById('todayTotal');
        todayValue.style.transform = 'scale(1.2)';
        todayValue.style.transition = 'transform 0.3s';
        setTimeout(() => {
            todayValue.style.transform = 'scale(1)';
        }, 300);
    }

    // 获取最近7天的数据
    getLast7DaysData() {
        const days = [];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = this.getDateString(date);

            // 计算该日期的总饮水量
            const dayRecords = this.data.records.filter(r => r.date === dateStr);
            const total = dayRecords.reduce((sum, r) => sum + r.amount, 0);

            const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
            const dayName = i === 0 ? '今天' : dayNames[date.getDay()];

            days.push({
                date: dateStr,
                dayName: dayName,
                amount: total
            });
        }

        return days;
    }

    // 获取今日总饮水量
    getTodayTotal() {
        const today = this.getDateString();
        const todayRecords = this.data.records.filter(r => r.date === today);
        return todayRecords.reduce((sum, r) => sum + r.amount, 0);
    }

    // 计算建议饮水量
    calculateRecommendation() {
        const weight = parseFloat(this.data.petWeight) || 4;
        // 猫咪建议: 60ml/kg, 狗狗建议: 50-100ml/kg, 取中值75ml/kg
        const multiplier = this.petType === 'cat' ? 60 : 75;
        return Math.round(weight * multiplier);
    }

    // 更新建议饮水量
    updateRecommendation() {
        const recommended = this.calculateRecommendation();
        document.getElementById('recommendedWater').textContent = recommended;
        this.updateProgress();
    }

    // 更新进度条
    updateProgress() {
        const todayTotal = this.getTodayTotal();
        const recommended = this.calculateRecommendation();
        const percentage = Math.min((todayTotal / recommended) * 100, 100);

        document.getElementById('progressFill').style.width = percentage + '%';
        document.getElementById('progressText').textContent = Math.round(percentage) + '%';

        // 根据完成度改变颜色
        const progressFill = document.getElementById('progressFill');
        if (percentage >= 100) {
            progressFill.style.background = 'linear-gradient(90deg, #6ee7b7 0%, #34d399 100%)';
        } else if (percentage >= 70) {
            progressFill.style.background = 'linear-gradient(90deg, #7dd3fc 0%, #6ee7b7 100%)';
        } else {
            progressFill.style.background = 'linear-gradient(90deg, #fcd34d 0%, #fbbf24 100%)';
        }
    }

    // 更新统计数据
    updateStats() {
        const last7Days = this.getLast7DaysData();
        const amounts = last7Days.map(d => d.amount);

        // 7天平均
        const avg = Math.round(amounts.reduce((a, b) => a + b, 0) / 7);

        // 最高记录
        const max = Math.max(...amounts, 0);

        // 达标天数
        const recommended = this.calculateRecommendation();
        const达标天数 = amounts.filter(a => a >= recommended).length;

        document.getElementById('avg7Days').textContent = avg;
        document.getElementById('max7Days').textContent = max;
        document.getElementById('达标天数').textContent = 达标天数;
    }

    // 更新历史记录列表
    updateHistory() {
        const historyList = document.getElementById('historyList');

        if (this.data.records.length === 0) {
            historyList.innerHTML = '<p class="empty-state">暂无记录，快来添加第一条吧~</p>';
            return;
        }

        // 获取最近10条记录，按时间倒序
        const recentRecords = [...this.data.records]
            .sort((a, b) => b.id - a.id)
            .slice(0, 10);

        const today = this.getDateString();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = this.getDateString(yesterday);

        historyList.innerHTML = recentRecords.map(record => {
            let dateDisplay = record.date;
            if (record.date === today) {
                dateDisplay = '今天 ' + record.time;
            } else if (record.date === yesterdayStr) {
                dateDisplay = '昨天 ' + record.time;
            } else {
                dateDisplay = record.date.substr(5) + ' ' + record.time;
            }

            return `
                <div class="history-item">
                    <div>
                        <div class="history-date">${dateDisplay}</div>
                        <div class="history-time">${this.getTimePeriod(record.time)}</div>
                    </div>
                    <div class="history-amount">+${record.amount} ml</div>
                </div>
            `;
        }).join('');
    }

    // 获取时间段描述
    getTimePeriod(time) {
        const hour = parseInt(time.split(':')[0]);
        if (hour >= 5 && hour < 12) return '上午';
        if (hour >= 12 && hour < 18) return '下午';
        if (hour >= 18 && hour < 22) return '晚上';
        return '深夜';
    }

    // 初始化图表
    initChart() {
        const ctx = document.getElementById('waterChart').getContext('2d');
        const last7Days = this.getLast7DaysData();

        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: last7Days.map(d => d.dayName),
                datasets: [{
                    label: '饮水量 (ml)',
                    data: last7Days.map(d => d.amount),
                    backgroundColor: 'rgba(125, 211, 252, 0.7)',
                    borderColor: 'rgba(125, 211, 252, 1)',
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(51, 65, 85, 0.95)',
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 13 },
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            title: function(context) {
                                return context[0].label;
                            },
                            label: function(context) {
                                return `饮水量: ${context.parsed.y} ml`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(226, 232, 240, 0.8)',
                        },
                        ticks: {
                            color: '#64748b',
                            font: { size: 11 }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#64748b',
                            font: { size: 11 }
                        }
                    }
                }
            }
        });
    }

    // 更新图表
    updateChart() {
        const last7Days = this.getLast7DaysData();
        this.chart.data.labels = last7Days.map(d => d.dayName);
        this.chart.data.datasets[0].data = last7Days.map(d => d.amount);
        this.chart.update('active');
    }

    // 更新UI
    updateUI() {
        // 更新今日总饮水量
        document.getElementById('todayTotal').textContent = this.getTodayTotal();

        // 更新进度条
        this.updateProgress();

        // 更新图表
        this.updateChart();

        // 更新统计数据
        this.updateStats();

        // 更新历史记录
        this.updateHistory();

        // 更新宠物信息
        document.getElementById('petName').value = this.data.petName;
        document.getElementById('petWeight').value = this.data.petWeight;
    }

    // 绑定事件
    bindEvents() {
        // 添加饮水按钮
        document.getElementById('addWaterBtn').addEventListener('click', () => {
            const input = document.getElementById('waterAmount');
            const amount = parseInt(input.value);

            if (!amount || amount <= 0) {
                alert('请输入有效的水量！');
                return;
            }

            if (amount > 1000) {
                alert('单次饮水量不应超过1000ml，请分多次记录~');
                return;
            }

            this.addWaterRecord(amount);
            input.value = '';
        });

        // 回车键添加
        document.getElementById('waterAmount').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('addWaterBtn').click();
            }
        });

        // 快速添加按钮
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const amount = btn.dataset.amount;
                this.addWaterRecord(amount);
            });
        });

        // 宠物类型选择
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.petType = btn.dataset.type;
                document.getElementById('petEmoji').textContent = btn.dataset.emoji;
                this.data.petType = this.petType;
                this.updateRecommendation();
                this.saveData();
            });
        });

        // 宠物名字
        document.getElementById('petName').addEventListener('change', (e) => {
            this.data.petName = e.target.value || '小白';
            this.saveData();
        });

        // 宠物体重
        document.getElementById('petWeight').addEventListener('change', (e) => {
            const weight = parseFloat(e.target.value);
            if (weight > 0 && weight <= 100) {
                this.data.petWeight = weight;
                this.updateRecommendation();
                this.updateStats();
                this.saveData();
            }
        });

        // 清除数据按钮
        document.getElementById('clearDataBtn').addEventListener('click', () => {
            if (confirm('确定要清除所有记录吗？此操作不可恢复~')) {
                this.data.records = [];
                this.saveData();
                this.updateUI();
                alert('数据已清除，重新开始记录吧！');
            }
        });
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new WaterTracker();
});
