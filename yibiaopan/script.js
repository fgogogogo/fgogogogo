// Study Dashboard JavaScript

// Global state
let currentRange = 7;
let studyTimeChart = null;
let subjectChart = null;
let taskCompareChart = null;
let currentChartType = 'line';

// Subjects configuration
const subjects = [
    { name: '数学', color: '#6366f1' },
    { name: '英语', color: '#22c55e' },
    { name: '编程', color: '#8b5cf6' },
    { name: '阅读', color: '#f59e0b' },
    { name: '其他', color: '#64748b' }
];

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Simulate loading delay
    setTimeout(() => {
        document.getElementById('skeleton').style.display = 'none';
        document.getElementById('content').style.display = 'block';
        loadData();
    }, 1500);

    // Event listeners
    setupEventListeners();

    // Check saved theme
    checkSavedTheme();
}

function setupEventListeners() {
    // Date filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentRange = parseInt(this.dataset.range);
            updateCharts();
        });
    });

    // Chart type toggle
    document.querySelectorAll('.chart-type-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.chart-type-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentChartType = this.dataset.chart;
            updateStudyTimeChart();
        });
    });

    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    // Export button
    document.getElementById('exportBtn').addEventListener('click', exportReport);
}

function checkSavedTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    // Update charts for theme
    if (studyTimeChart) studyTimeChart.destroy();
    if (subjectChart) subjectChart.destroy();
    if (taskCompareChart) taskCompareChart.destroy();
    initCharts();
}

function loadData() {
    updateStats();
    initCharts();
    updateTable();
    animateProgress();
}

function updateStats() {
    const data = generateStudyData(currentRange);
    const today = data[data.length - 1];
    const yesterday = data[data.length - 2] || today;

    // Today hours
    const todayHours = today.hours;
    const hoursDiff = ((todayHours - yesterday.hours) / yesterday.hours * 100).toFixed(0);
    animateNumber('todayHours', todayHours);
    document.getElementById('hoursTrend').innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="${hoursDiff >= 0 ? '23 6 13.5 15.5 8.5 10.5 1 18' : '23 18 13.5 8.5 8.5 13.5 1 6'}"></polyline>
            <polyline points="17 ${hoursDiff >= 0 ? '6 23 6 23 12' : '18 23 18 23 6'}"></polyline>
        </svg>
        较昨日 ${hoursDiff >= 0 ? '+' : ''}${hoursDiff}%
    `;
    document.getElementById('hoursTrend').className = `stat-trend ${hoursDiff >= 0 ? 'up' : 'down'}`;

    // Task rate
    const avgRate = Math.round(data.reduce((sum, d) => sum + d.taskRate, 0) / data.length);
    animateNumber('taskRate', avgRate);

    // Streak days (random between 15-60)
    const streak = Math.floor(Math.random() * 45) + 15;
    animateNumber('streakDays', streak);

    // Total days (random between 100-300)
    const total = Math.floor(Math.random() * 200) + 100;
    animateNumber('totalDays', total);

    // Update task stats
    const completed = Math.floor(Math.random() * 20) + 25;
    const pending = Math.floor(Math.random() * 10) + 5;
    document.getElementById('completedTasks').textContent = completed;
    document.getElementById('pendingTasks').textContent = pending;
}

function animateNumber(id, target) {
    const element = document.getElementById(id);
    const duration = 1000;
    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (target - start) * easeOut);
        element.textContent = current;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

function animateProgress() {
    const circle = document.getElementById('progressCircle');
    const value = document.getElementById('progressValue');
    const target = 75;
    const circumference = 2 * Math.PI * 54;
    const offset = circumference - (target / 100) * circumference;

    setTimeout(() => {
        circle.style.strokeDashoffset = offset;
    }, 500);

    // Animate value
    let current = 0;
    const interval = setInterval(() => {
        if (current >= target) {
            clearInterval(interval);
        } else {
            current++;
            value.textContent = current + '%';
        }
    }, 20);
}

function generateStudyData(days) {
    const data = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        data.push({
            date: date,
            dateStr: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
            hours: parseFloat((Math.random() * 4 + 2).toFixed(1)),
            taskRate: Math.floor(Math.random() * 30) + 70,
            subjects: {
                '数学': Math.random() * 60 + 30,
                '英语': Math.random() * 50 + 20,
                '编程': Math.random() * 80 + 40,
                '阅读': Math.random() * 40 + 10,
                '其他': Math.random() * 30 + 5
            },
            tasks: {
                completed: Math.floor(Math.random() * 8) + 3,
                total: Math.floor(Math.random() * 4) + 10
            }
        });
    }

    return data;
}

function initCharts() {
    const data = generateStudyData(currentRange);
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? '#334155' : '#e2e8f0';

    // Study Time Chart
    const ctx1 = document.getElementById('studyTimeChart').getContext('2d');
    const gradient = ctx1.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

    studyTimeChart = new Chart(ctx1, {
        type: currentChartType,
        data: {
            labels: data.map(d => d.dateStr),
            datasets: [{
                label: '学习时长 (小时)',
                data: data.map(d => d.hours),
                borderColor: '#6366f1',
                backgroundColor: currentChartType === 'line' ? gradient : 'rgba(99, 102, 241, 0.7)',
                borderWidth: 3,
                tension: 0.4,
                fill: currentChartType === 'line',
                pointBackgroundColor: '#6366f1',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    titleColor: isDark ? '#f1f5f9' : '#1e293b',
                    bodyColor: isDark ? '#94a3b8' : '#64748b',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return `学习时长: ${context.parsed.y} 小时`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: textColor
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: gridColor,
                        borderDash: [5, 5]
                    },
                    ticks: {
                        color: textColor,
                        callback: function(value) {
                            return value + 'h';
                        }
                    }
                }
            }
        }
    });

    // Subject Distribution Chart
    const subjectData = subjects.map(s => ({
        name: s.name,
        value: Math.floor(Math.random() * 40) + 10,
        color: s.color
    }));

    const ctx2 = document.getElementById('subjectChart').getContext('2d');
    subjectChart = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: subjectData.map(s => s.name),
            datasets: [{
                data: subjectData.map(s => s.value),
                backgroundColor: subjectData.map(s => s.color),
                borderWidth: 0,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    titleColor: isDark ? '#f1f5f9' : '#1e293b',
                    bodyColor: isDark ? '#94a3b8' : '#64748b',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: ${percentage}%`;
                        }
                    }
                }
            }
        }
    });

    // Update legend
    updateSubjectLegend(subjectData);

    // Task Comparison Chart
    const ctx3 = document.getElementById('taskCompareChart').getContext('2d');
    taskCompareChart = new Chart(ctx3, {
        type: 'bar',
        data: {
            labels: data.slice(-7).map(d => d.dateStr),
            datasets: [{
                label: '已完成',
                data: data.slice(-7).map(d => d.tasks.completed),
                backgroundColor: '#22c55e',
                borderRadius: 4
            }, {
                label: '未开始',
                data: data.slice(-7).map(d => d.tasks.total - d.tasks.completed),
                backgroundColor: '#f59e0b',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: textColor,
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    titleColor: isDark ? '#f1f5f9' : '#1e293b',
                    bodyColor: isDark ? '#94a3b8' : '#64748b',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    stacked: true,
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: textColor
                    }
                },
                y: {
                    stacked: true,
                    grid: {
                        color: gridColor,
                        borderDash: [5, 5]
                    },
                    ticks: {
                        color: textColor,
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function updateSubjectLegend(data) {
    const container = document.getElementById('subjectLegend');
    const total = data.reduce((sum, d) => sum + d.value, 0);

    container.innerHTML = data.map(item => `
        <div class="legend-item">
            <span class="legend-dot" style="background: ${item.color}"></span>
            <span>${item.name} ${((item.value / total) * 100).toFixed(0)}%</span>
        </div>
    `).join('');
}

function updateStudyTimeChart() {
    if (studyTimeChart) {
        studyTimeChart.destroy();
    }

    const data = generateStudyData(currentRange);
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const ctx = document.getElementById('studyTimeChart').getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

    studyTimeChart = new Chart(ctx, {
        type: currentChartType,
        data: {
            labels: data.map(d => d.dateStr),
            datasets: [{
                label: '学习时长 (小时)',
                data: data.map(d => d.hours),
                borderColor: '#6366f1',
                backgroundColor: currentChartType === 'line' ? gradient : 'rgba(99, 102, 241, 0.7)',
                borderWidth: 3,
                tension: 0.4,
                fill: currentChartType === 'line',
                pointBackgroundColor: '#6366f1',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    titleColor: isDark ? '#f1f5f9' : '#1e293b',
                    bodyColor: isDark ? '#94a3b8' : '#64748b',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: isDark ? '#94a3b8' : '#64748b'
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: isDark ? '#334155' : '#e2e8f0',
                        borderDash: [5, 5]
                    },
                    ticks: {
                        color: isDark ? '#94a3b8' : '#64748b',
                        callback: function(value) {
                            return value + 'h';
                        }
                    }
                }
            }
        }
    });
}

function updateCharts() {
    if (studyTimeChart) studyTimeChart.destroy();
    if (subjectChart) subjectChart.destroy();
    if (taskCompareChart) taskCompareChart.destroy();

    initCharts();
    updateStats();
    updateTable();
}

function updateTable() {
    const tbody = document.getElementById('tableBody');
    const data = generateStudyData(7);

    tbody.innerHTML = data.reverse().slice(0, 5).map(item => {
        const efficiency = Math.floor(Math.random() * 40) + 60;
        let efficiencyClass = 'low';
        if (efficiency >= 80) efficiencyClass = 'high';
        else if (efficiency >= 60) efficiencyClass = 'medium';

        const mainSubject = Object.entries(item.subjects)
            .sort((a, b) => b[1] - a[1])[0][0];

        const status = efficiency >= 80 ? 'completed' : 'partial';
        const statusText = efficiency >= 80 ? '已完成' : '进行中';

        return `
            <tr>
                <td>${item.date.toLocaleDateString('zh-CN')}</td>
                <td class="duration-cell">${item.hours}h</td>
                <td>${item.tasks.completed}/${item.tasks.total}</td>
                <td>${mainSubject}</td>
                <td>
                    <span class="score-badge ${efficiencyClass}">
                        ${efficiency}分
                    </span>
                </td>
                <td>
                    <span class="status-badge ${status}">
                        ${statusText}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
}

function exportReport() {
    // Generate CSV data
    const data = generateStudyData(currentRange);
    const csvContent = [
        ['日期', '学习时长(小时)', '任务完成率(%)', '效率评分'],
        ...data.map(d => [
            d.date.toLocaleDateString('zh-CN'),
            d.hours,
            d.taskRate,
            Math.floor(Math.random() * 40) + 60
        ])
    ].map(row => row.join(',')).join('\n');

    // Create and download file
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `学习报告_${new Date().toLocaleDateString('zh-CN')}.csv`;
    link.click();

    // Show toast
    showToast();
}

function showToast() {
    const toast = document.getElementById('toast');
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Navigation highlight
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        this.classList.add('active');
    });
});
