// 初始化数据
let waterData = {
    cat: [180, 220, 195, 250, 210, 230, 200],
    dog: [500, 600, 550, 650, 580, 620, 590],
    rabbit: [150, 180, 165, 200, 175, 190, 170]
};

// 获取最近7天的日期
function getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push(`${date.getMonth() + 1}/${date.getDate()}`);
    }
    return days;
}

// Chart.js 实例
let waterChart = null;

// 初始化图表
function initChart() {
    const ctx = document.getElementById('waterChart').getContext('2d');
    const labels = getLast7Days();

    waterChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '饮水量 (ml)',
                data: waterData.cat,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointBackgroundColor: '#667eea',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: { size: 14 },
                    bodyFont: { size: 13 },
                    padding: 12,
                    cornerRadius: 8
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        font: { size: 12 }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: { size: 12 }
                    }
                }
            }
        }
    });
}

// 更新统计数据
function updateStats(petType) {
    const data = waterData[petType];
    const total = data.reduce((a, b) => a + b, 0);
    const avg = Math.round(total / data.length);
    const max = Math.max(...data);

    document.getElementById('totalWater').textContent = total + ' ml';
    document.getElementById('avgWater').textContent = avg + ' ml';
    document.getElementById('maxWater').textContent = max + ' ml';
}

// 更新表格
function updateTable(petType) {
    const data = waterData[petType];
    const dates = getLast7Days();
    const tbody = document.getElementById('dataTableBody');
    tbody.innerHTML = '';

    // 根据宠物类型判断标准饮水量
    let standard;
    if (petType === 'cat') standard = 200;
    else if (petType === 'dog') standard = 600;
    else standard = 180;

    for (let i = 0; i < data.length; i++) {
        const row = document.createElement('tr');
        const value = data[i];
        let status;
        let statusClass;

        if (value < standard * 0.7) {
            status = '偏低';
            statusClass = 'low';
        } else if (value > standard * 1.3) {
            status = '偏高';
            statusClass = 'high';
        } else {
            status = '正常';
            statusClass = 'good';
        }

        row.innerHTML = `
            <td>${dates[i]}</td>
            <td>${value} ml</td>
            <td><span class="status ${statusClass}">${status}</span></td>
        `;
        tbody.appendChild(row);
    }
}

// 宠物类型选择
document.getElementById('petType').addEventListener('change', function(e) {
    const petType = e.target.value;
    const data = waterData[petType];

    // 更新图表
    waterChart.data.datasets[0].data = data;
    waterChart.update();

    // 更新统计
    updateStats(petType);

    // 更新表格
    updateTable(petType);

    // 更新头像
    const avatars = { cat: '🐱', dog: '🐕', rabbit: '🐰' };
    document.querySelector('.pet-avatar').textContent = avatars[petType];

    // 更新提示
    updateTips(petType);
});

// 更新提示信息
function updateTips(petType) {
    const tips = document.getElementById('tipsContent');
    const tipsData = {
        cat: `
            <p>💪 成年猫咪每天需要约40-60ml/kg的水</p>
            <p>🍗 吃湿粮的猫咪会从食物中获得部分水分</p>
            <p>⚠️ 猫咪饮水不足可能导致泌尿问题</p>
        `,
        dog: `
            <p>💪 狗狗每天需要约50-100ml/kg的水</p>
            <p>🏃 运动后需要额外补充水分</p>
            <p>🌡️ 夏天要注意保证充足的饮水</p>
        `,
        rabbit: `
            <p>💪 兔子每天需要约50-150ml/kg的水</p>
            <p>🥬 新鲜蔬菜可以作为水分补充</p>
            <p>💧 饮水器要保持清洁卫生</p>
        `
    };
    tips.innerHTML = tipsData[petType];
}

// 添加饮水记录
function addWaterRecord() {
    const input = document.getElementById('waterAmount');
    const amount = parseInt(input.value);

    if (isNaN(amount) || amount <= 0) {
        alert('请输入有效的饮水量！');
        return;
    }

    const petType = document.getElementById('petType').value;

    // 移除最早的一天，添加今天的数据
    waterData[petType].shift();
    waterData[petType].push(amount);

    // 更新图表
    waterChart.data.datasets[0].data = waterData[petType];
    waterChart.update();

    // 更新统计
    updateStats(petType);

    // 更新表格
    updateTable(petType);

    // 清空输入框
    input.value = '';

    // 显示成功提示
    showNotification('记录添加成功！');
}

// 显示通知
function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// 页面加载时初始化
window.addEventListener('DOMContentLoaded', () => {
    initChart();
    updateStats('cat');
    updateTable('cat');
});
