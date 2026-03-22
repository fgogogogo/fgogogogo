// ============================================
// AI Health Management Assistant - Main Logic
// ============================================

// --- Health Data State ---
const state = {
  heartRate: 72,
  bpSystolic: 118,
  bpDiastolic: 76,
  bloodOxygen: 98,
  temperature: 36.5,
  calories: 1847,
  steps: 7234,
  sleepHours: 6.5,
  score: 82,
  currentChart: 'heart'
};

// Historical data for charts (24 data points = ~24 hours)
const history = {
  labels: generateTimeLabels(24),
  heartRate: generateSeries(24, 65, 82, 72),
  bpSystolic: generateSeries(24, 108, 128, 118),
  bpDiastolic: generateSeries(24, 68, 85, 76),
  bloodOxygen: generateSeries(24, 95, 99, 98, 1),
  temperature: generateSeries(24, 36.1, 36.9, 36.5, 0.1),
};

// Sparkline history (short, for mini cards)
const sparkHistory = {
  heartRate: generateSeries(12, 65, 82, 72),
  bpSystolic: generateSeries(12, 110, 126, 118),
  calories: generateSeries(12, 200, 250, 1847 / 12),
  sleep: [7.2, 6.8, 7.5, 6.1, 7.0, 6.5, 6.8],
};

// Weekly sleep data
const weeklySleep = [
  { day: '一', hours: 7.2, deep: 1.8, light: 4.1, rem: 1.3 },
  { day: '二', hours: 6.8, deep: 1.5, light: 3.9, rem: 1.4 },
  { day: '三', hours: 7.5, deep: 2.0, light: 4.0, rem: 1.5 },
  { day: '四', hours: 6.1, deep: 1.1, light: 3.6, rem: 1.4 },
  { day: '五', hours: 7.0, deep: 1.6, light: 3.8, rem: 1.6 },
  { day: '六', hours: 6.5, deep: 1.2, light: 3.7, rem: 1.6 },
  { day: '日', hours: 6.5, deep: 1.2, light: 3.8, rem: 1.5 },
];

// --- Utility Functions ---
function generateTimeLabels(count) {
  const labels = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const h = new Date(now - i * 3600000);
    labels.push(String(h.getHours()).padStart(2, '0') + ':00');
  }
  return labels;
}

function generateSeries(count, min, max, base, decimals = 0) {
  const arr = [];
  for (let i = 0; i < count; i++) {
    const variation = (Math.random() - 0.5) * (max - min) * 0.6;
    let val = base + variation;
    val = Math.min(max, Math.max(min, val));
    arr.push(parseFloat(val.toFixed(decimals)));
  }
  return arr;
}

function lerp(a, b, t) { return a + (b - a) * t; }

// --- Toast Notification ---
function showToast(message, icon = "&#128203;") {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `${icon} ${message}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// --- Real-time Data Simulation ---
function simulateRealtimeData() {
  // Heart rate fluctuation
  const hrDelta = (Math.random() - 0.5) * 6;
  state.heartRate = Math.round(Math.min(100, Math.max(58, state.heartRate + hrDelta)));

  // Blood pressure
  const sysDelta = (Math.random() - 0.5) * 4;
  state.bpSystolic = Math.round(Math.min(135, Math.max(105, state.bpSystolic + sysDelta)));
  state.bpDiastolic = Math.round(Math.min(90, Math.max(60, state.bpDiastolic + sysDelta * 0.5)));

  // Blood oxygen
  state.bloodOxygen = Math.round(Math.min(100, Math.max(94, state.bloodOxygen + (Math.random() - 0.5) * 2)));

  // Temperature
  state.temperature = parseFloat((state.temperature + (Math.random() - 0.5) * 0.1).toFixed(1));
  state.temperature = Math.min(37.5, Math.max(36.0, state.temperature));

  // Calories increment
  state.calories += Math.round(Math.random() * 2);
  state.steps += Math.round(Math.random() * 15);

  // Update DOM
  updateMetricDisplays();
  updateStatusIndicators();

  // Push to history
  history.heartRate.push(state.heartRate);
  history.bpSystolic.push(state.bpSystolic);
  history.bpDiastolic.push(state.bpDiastolic);
  history.bloodOxygen.push(state.bloodOxygen);
  history.temperature.push(state.temperature);
  history.heartRate.shift();
  history.bpSystolic.shift();
  history.bpDiastolic.shift();
  history.bloodOxygen.shift();
  history.temperature.shift();

  // Update sparklines
  sparkHistory.heartRate.push(state.heartRate);
  sparkHistory.heartRate.shift();
  sparkHistory.bpSystolic.push(state.bpSystolic);
  sparkHistory.bpSystolic.shift();
  sparkHistory.calories.push(state.calories / 12 + (Math.random() - 0.5) * 30);
  sparkHistory.calories.shift();

  // Redraw
  drawSparklines();
  drawVitalsChart();
}

function updateMetricDisplays() {
  document.getElementById('heartRate').textContent = state.heartRate;
  document.getElementById('bpSystolic').textContent = state.bpSystolic;
  document.getElementById('bpDiastolic').textContent = state.bpDiastolic;
  document.getElementById('calories').textContent = state.calories.toLocaleString();
  document.getElementById('tHR').textContent = state.heartRate;
  document.getElementById('tO2').textContent = state.bloodOxygen;
  document.getElementById('tTemp').textContent = state.temperature;
  document.getElementById('stepProgress').textContent = `${state.steps.toLocaleString()} / 10,000 步`;
  document.getElementById('calProgress').textContent = `${state.calories.toLocaleString()} / 2,200 kcal`;
}

function updateStatusIndicators() {
  // Heart rate status
  const hrEl = document.getElementById('hrStatus');
  if (state.heartRate >= 60 && state.heartRate <= 100) {
    hrEl.className = 'metric-status normal';
    hrEl.innerHTML = '&#9679; 正常';
  } else if (state.heartRate > 100) {
    hrEl.className = 'metric-status warning';
    hrEl.innerHTML = '&#9679; 偏高';
  } else {
    hrEl.className = 'metric-status danger';
    hrEl.innerHTML = '&#9679; 偏低';
  }

  // Blood pressure status
  const bpEl = document.getElementById('bpStatus');
  if (state.bpSystolic < 120 && state.bpDiastolic < 80) {
    bpEl.className = 'metric-status normal';
    bpEl.innerHTML = '&#9679; 正常';
  } else if (state.bpSystolic < 140) {
    bpEl.className = 'metric-status warning';
    bpEl.innerHTML = '&#9679; 偏高';
  } else {
    bpEl.className = 'metric-status danger';
    bpEl.innerHTML = '&#9679; 警告';
  }
}

// --- Sparkline Drawing ---
function drawSparkline(svgId, data, color) {
  const svg = document.getElementById(svgId);
  if (!svg || data.length < 2) return;

  const w = 200, h = 40;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = Math.max(max - min, 1);
  const padding = 4;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - padding - ((v - min) / range) * (h - padding * 2);
    return `${x},${y}`;
  });

  // Gradient fill
  const gradId = svgId + 'Grad';
  const pathD = `M${points.join(' L')}`;
  const fillD = `${pathD} L${w},${h} L0,${h} Z`;

  svg.innerHTML = `
    <defs>
      <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <path d="${fillD}" fill="url(#${gradId})"/>
    <path d="${pathD}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${points[points.length-1].split(',')[0]}" cy="${points[points.length-1].split(',')[1]}" r="3" fill="${color}"/>
  `;
}

function drawSparklines() {
  drawSparkline('hrSparkline', sparkHistory.heartRate, '#ef4444');
  drawSparkline('bpSparkline', sparkHistory.bpSystolic, '#10b981');
  drawSparkline('calSparkline', sparkHistory.calories, '#f59e0b');
  drawSparkline('sleepSparkline', sparkHistory.sleep, '#8b5cf6');
}

// --- Main Vitals Chart (Canvas) ---
function drawVitalsChart() {
  const canvas = document.getElementById('vitalsChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  const W = rect.width;
  const H = rect.height;

  ctx.clearRect(0, 0, W, H);

  const padding = { top: 20, right: 20, bottom: 35, left: 45 };
  const chartW = W - padding.left - padding.right;
  const chartH = H - padding.top - padding.bottom;

  let data, color, lineColor2, data2, label, minVal, maxVal, unit;

  switch (state.currentChart) {
    case 'heart':
      data = history.heartRate; color = '#ef4444'; label = '心率 (bpm)';
      minVal = 55; maxVal = 105; unit = 'bpm'; break;
    case 'bp':
      data = history.bpSystolic; data2 = history.bpDiastolic;
      color = '#f59e0b'; lineColor2 = '#06b6d4';
      label = '血压 (mmHg)'; minVal = 55; maxVal = 140; unit = 'mmHg'; break;
    case 'bo2':
      data = history.bloodOxygen; color = '#3b82f6';
      label = '血氧 (%)'; minVal = 92; maxVal = 101; unit = '%'; break;
    case 'temp':
      data = history.temperature; color = '#10b981';
      label = '体温 (°C)'; minVal = 35.5; maxVal = 38; unit = '°C'; break;
  }

  // Grid lines
  const gridLines = 5;
  ctx.strokeStyle = 'rgba(42,53,80,0.5)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  for (let i = 0; i <= gridLines; i++) {
    const y = padding.top + (i / gridLines) * chartH;
    ctx.beginPath(); ctx.moveTo(padding.left, y); ctx.lineTo(W - padding.right, y); ctx.stroke();

    // Y-axis labels
    const val = maxVal - (i / gridLines) * (maxVal - minVal);
    ctx.fillStyle = '#5a6a82';
    ctx.font = '11px Inter';
    ctx.textAlign = 'right';
    ctx.fillText(val.toFixed(unit === '°C' ? 1 : 0), padding.left - 8, y + 4);
  }
  ctx.setLineDash([]);

  // X-axis labels
  const labelInterval = Math.max(1, Math.floor(data.length / 6));
  ctx.fillStyle = '#5a6a82';
  ctx.font = '11px Inter';
  ctx.textAlign = 'center';
  for (let i = 0; i < history.labels.length; i += labelInterval) {
    const x = padding.left + (i / (history.labels.length - 1)) * chartW;
    ctx.fillText(history.labels[i], x, H - 8);
  }

  // Draw line function
  function drawLine(dataArr, lineColor, fillOpacity = 0.08) {
    const points = dataArr.map((v, i) => ({
      x: padding.left + (i / (dataArr.length - 1)) * chartW,
      y: padding.top + ((maxVal - v) / (maxVal - minVal)) * chartH
    }));

    // Gradient fill
    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
    gradient.addColorStop(0, lineColor.replace(')', `,${fillOpacity})`).replace('rgb', 'rgba'));
    gradient.addColorStop(1, lineColor.replace(')', ',0)').replace('rgb', 'rgba'));

    // Fill area
    ctx.beginPath();
    ctx.moveTo(points[0].x, padding.top + chartH);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, padding.top + chartH);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.stroke();

    // Glow effect
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 6;
    ctx.globalAlpha = 0.15;
    ctx.beginPath();
    points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.stroke();
    ctx.globalAlpha = 1;

    // End dot
    const last = points[points.length - 1];
    ctx.beginPath();
    ctx.arc(last.x, last.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = lineColor;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(last.x, last.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
  }

  drawLine(data, color);

  if (data2) {
    drawLine(data2, lineColor2, 0.05);
  }

  // Legend
  if (data2) {
    ctx.fillStyle = color;
    ctx.fillRect(W - padding.right - 140, 6, 12, 3);
    ctx.fillStyle = '#8896ab';
    ctx.font = '11px Inter';
    ctx.textAlign = 'left';
    ctx.fillText('收缩压', W - padding.right - 124, 11);

    ctx.fillStyle = lineColor2;
    ctx.fillRect(W - padding.right - 60, 6, 12, 3);
    ctx.fillStyle = '#8896ab';
    ctx.fillText('舒张压', W - padding.right - 44, 11);
  }
}

function switchChart(btn, type) {
  document.querySelectorAll('.card-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  state.currentChart = type;
  drawVitalsChart();
}

// --- Sleep Bars ---
function renderSleepBars() {
  const container = document.getElementById('sleepBars');
  if (!container) return;
  const maxH = weeklySleep.reduce((m, d) => Math.max(m, d.hours), 0);
  const colors = ['deep', 'light', 'rem'];
  const colorMap = {
    deep: '#8b5cf6',
    light: '#3b82f6',
    rem: '#06b6d4'
  };

  container.innerHTML = weeklySleep.map(d => {
    const totalH = (d.hours / maxH) * 100;
    const deepH = (d.deep / maxH) * 100;
    const remH = (d.rem / maxH) * 100;
    const lightH = totalH - deepH - remH;
    return `
      <div class="sleep-bar-group">
        <div style="width:100%;display:flex;flex-direction:column-reverse;height:100%;gap:2px">
          <div class="sleep-bar" style="height:${Math.max(lightH, 4)}%;background:${colorMap.light};opacity:0.6"></div>
          <div class="sleep-bar" style="height:${Math.max(remH, 4)}%;background:${colorMap.rem};opacity:0.8"></div>
          <div class="sleep-bar" style="height:${Math.max(deepH, 4)}%;background:${colorMap.deep}"></div>
        </div>
        <span class="sleep-day">${d.day}</span>
      </div>
    `;
  }).join('');
}

// --- Score Animation ---
function animateScore() {
  const target = state.score;
  const circumference = 2 * Math.PI * 78; // ~490
  const ring = document.getElementById('scoreRing');
  const numEl = document.getElementById('scoreNumber');

  const targetOffset = circumference * (1 - target / 100);
  let current = 0;

  function step() {
    current += 1.5;
    if (current > target) current = target;

    ring.setAttribute('stroke-dashoffset', circumference * (1 - current / 100));
    numEl.textContent = Math.round(current);

    if (current < target) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// --- AI Plan Generation ---
function generatePlan() {
  showToast('AI 正在为您生成个性化健康方案...', '&#10024;');

  const insightCards = document.getElementById('insightCards');
  const insights = [
    {
      icon: '&#127939;', type: '运动建议', tag: 'tag-exercise', tagText: '&#127939; 运动方案',
      iconBg: 'rgba(16,185,129,0.12)',
      title: 'HIIT训练建议',
      desc: `您的心率变异性(HRV)数据显示恢复良好，建议尝试20分钟HIIT训练。推荐动作：波比跳、登山者、深蹲跳，间隔休息30秒。预计可额外消耗180-220kcal。`
    },
    {
      icon: '&#127858;', type: '饮食调整', tag: 'tag-diet', tagText: '&#127858; 饮食方案',
      iconBg: 'rgba(245,158,11,0.12)',
      title: '个性化营养补充',
      desc: `根据当前BMI和运动消耗分析，建议今日蛋白质摄入提升至85g。晚餐推荐：三文鱼150g + 藜麦饭 + 蒸西兰花。同时补充Omega-3脂肪酸，有益心血管健康。`
    },
    {
      icon: '&#128164;', type: '睡眠优化', tag: 'tag-sleep', tagText: '&#128164; 睡眠方案',
      iconBg: 'rgba(139,92,246,0.12)',
      title: '深度睡眠提升方案',
      desc: `检测到您近期REM睡眠比例偏低。建议：1) 睡前2小时完成中高强度运动；2) 使用478呼吸法（吸气4s-屏息7s-呼气8s）；3) 保持卧室完全避光。`
    },
    {
      icon: '&#129504;', type: '心理调节', tag: 'tag-mental', tagText: '&#129504; 心理健康',
      iconBg: 'rgba(6,182,212,0.12)',
      title: '压力管理建议',
      desc: `根据您近7天的心率变异性和睡眠模式分析，压力指数为中等偏高。建议每日进行10分钟正念冥想，优先安排在午休时段。推荐使用身体扫描冥想引导。`
    },
    {
      icon: '&#9888;', type: '预警提醒', tag: 'tag-alert', tagText: '&#9888; 健康预警',
      iconBg: 'rgba(239,68,68,0.12)',
      title: '久坐提醒',
      desc: `数据显示您今天已连续坐姿超过2小时。久坐会降低血液循环效率，增加腰椎压力。建议立即起身活动10分钟，做简单的腰部旋转和肩部放松操。`
    }
  ];

  // Shuffle and pick 3
  const shuffled = insights.sort(() => Math.random() - 0.5).slice(0, 3);

  insightCards.style.opacity = '0';
  insightCards.style.transform = 'translateY(10px)';

  setTimeout(() => {
    insightCards.innerHTML = shuffled.map(ins => `
      <div class="insight-card" onclick="expandInsight(this)">
        <div class="insight-card-header">
          <div class="insight-icon" style="background:${ins.iconBg}">${ins.icon}</div>
          <span class="insight-type">${ins.type}</span>
        </div>
        <div class="insight-title">${ins.title}</div>
        <div class="insight-desc">${ins.desc}</div>
        <span class="insight-tag ${ins.tag}">${ins.tagText}</span>
      </div>
    `).join('');

    insightCards.style.transition = 'all 0.4s ease';
    insightCards.style.opacity = '1';
    insightCards.style.transform = 'translateY(0)';
  }, 600);
}

function expandInsight(card) {
  card.style.transform = 'scale(1.02)';
  card.style.boxShadow = '0 0 20px rgba(59,130,246,0.15)';
  showToast('已记录您的关注，将为您优化相关方案', '&#128161;');
  setTimeout(() => {
    card.style.transform = '';
    card.style.boxShadow = '';
  }, 800);
}

// --- Export Report ---
function exportReport() {
  showToast('健康报告正在生成中，即将下载...', '&#128196;');
}

// --- Nav Switch ---
function switchTab(el) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  el.classList.add('active');
  // Close mobile sidebar
  document.getElementById('sidebar').classList.remove('open');
}

// --- Update Date ---
function updateDate() {
  const now = new Date();
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  const dateStr = `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日 星期${days[now.getDay()]} · 数据实时刷新中`;
  document.getElementById('currentDate').textContent = dateStr;
}

// --- Initialize ---
function init() {
  updateDate();
  drawSparklines();
  drawVitalsChart();
  renderSleepBars();

  setTimeout(() => animateScore(), 500);

  // Real-time update every 3 seconds
  setInterval(simulateRealtimeData, 3000);

  // Resize handler
  window.addEventListener('resize', () => {
    drawVitalsChart();
  });

  // Show welcome toast
  setTimeout(() => {
    showToast('AI 健康助手已就绪，正在为您监测各项指标', '&#129302;');
  }, 1000);
}

document.addEventListener('DOMContentLoaded', init);
