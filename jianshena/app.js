// ==================== 数据模型 ====================
const DB_KEY = 'fittrack_workouts';
const GOALS_KEY = 'fittrack_goals';
const PROFILE_KEY = 'fittrack_profile';

const WORKOUT_TYPES = {
  running: { emoji: '🏃', label: '跑步', color: '#3b82f6' },
  cycling: { emoji: '🚴', label: '骑行', color: '#22c55e' },
  weights: { emoji: '🏋️', label: '举重', color: '#f59e0b' },
  other:   { emoji: '🎯', label: '其他', color: '#a855f7' }
};

// ==================== 数据存取 ====================
function getWorkouts() {
  return JSON.parse(localStorage.getItem(DB_KEY) || '[]');
}

function saveWorkouts(workouts) {
  localStorage.setItem(DB_KEY, JSON.stringify(workouts));
}

function getGoals() {
  return JSON.parse(localStorage.getItem(GOALS_KEY) || '[]');
}

function saveGoals(goals) {
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}

// ==================== 标签页切换 ====================
function switchTab(tab) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  const tabEl = document.getElementById(tab);
  if (tabEl) tabEl.classList.add('active');

  const navBtn = document.querySelector(`.nav-btn[data-tab="${tab}"]`);
  if (navBtn) navBtn.classList.add('active');

  // 刷新对应数据
  if (tab === 'dashboard') refreshDashboard();
  if (tab === 'workouts') renderWorkoutList();
  if (tab === 'goals') renderGoals();
  if (tab === 'stats') refreshStats();
}

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// ==================== 仪表盘 ====================
function refreshDashboard() {
  updateGreeting();
  updateStats();
  renderRecentWorkouts();
  renderWeeklyChart();
  updateStepDisplay();
  updateStreak();
}

function updateGreeting() {
  const hour = new Date().getHours();
  let greeting = '早上好';
  if (hour >= 12 && hour < 18) greeting = '下午好';
  else if (hour >= 18) greeting = '晚上好';
  document.getElementById('greeting').textContent = `${greeting}，准备好锻炼了吗？`;
}

function updateStats() {
  const workouts = getWorkouts();
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const weekWorkouts = workouts.filter(w => new Date(w.date) >= weekStart);

  document.getElementById('weeklyWorkouts').textContent = weekWorkouts.length;
  document.getElementById('weeklyMinutes').textContent = weekWorkouts.reduce((s, w) => s + (w.duration || 0), 0);
  document.getElementById('weeklyCalories').textContent = weekWorkouts.reduce((s, w) => s + (w.calories || 0), 0);
  document.getElementById('totalWorkouts').textContent = workouts.length;
}

function updateStreak() {
  const workouts = getWorkouts();
  if (!workouts.length) {
    document.getElementById('streakCount').textContent = '0';
    return;
  }

  const dates = [...new Set(workouts.map(w => w.date))].sort().reverse();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  let streak = 0;
  let checkDate = dates[0] === today ? today : dates[0] === yesterday ? yesterday : null;

  if (checkDate) {
    streak = 1;
    for (let i = 1; i < 365; i++) {
      const prev = new Date(new Date(checkDate).getTime() - 86400000).toISOString().split('T')[0];
      if (dates.includes(prev)) {
        streak++;
        checkDate = prev;
      } else break;
    }
  }

  document.getElementById('streakCount').textContent = streak;
}

function renderRecentWorkouts() {
  const workouts = getWorkouts().slice(0, 5);
  const container = document.getElementById('recentWorkouts');

  if (!workouts.length) {
    container.innerHTML = `
      <div class="empty-state">
        <p>还没有锻炼记录</p>
        <button class="btn-primary" onclick="switchTab('log')">开始记录</button>
      </div>`;
    return;
  }

  container.innerHTML = workouts.map(w => workoutItemHTML(w)).join('');
}

// ==================== 锻炼列表 ====================
let currentFilter = 'all';

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderWorkoutList();
  });
});

function renderWorkoutList() {
  let workouts = getWorkouts();
  if (currentFilter !== 'all') {
    workouts = workouts.filter(w => w.type === currentFilter);
  }

  const container = document.getElementById('allWorkouts');
  if (!workouts.length) {
    container.innerHTML = `
      <div class="empty-state">
        <p>没有${currentFilter === 'all' ? '' : WORKOUT_TYPES[currentFilter]?.label || ''}锻炼记录</p>
        <p class="text-muted">点击 "+" 开始记录</p>
      </div>`;
    return;
  }

  container.innerHTML = workouts.map(w => workoutItemHTML(w, true)).join('');
}

function workoutItemHTML(w, showActions = false) {
  const type = WORKOUT_TYPES[w.type] || WORKOUT_TYPES.other;
  let details = `${w.duration} 分钟`;
  if (w.distance) details += ` · ${w.distance} 公里`;
  if (w.weight) details += ` · ${w.weight} 公斤`;
  if (w.sets && w.reps) details += ` · ${w.sets}×${w.reps}`;
  if (w.calories) details += ` · ${w.calories} 千卡`;

  const dateStr = formatDate(w.date);

  return `
    <div class="workout-item" data-type="${w.type}">
      <div class="workout-icon">${type.emoji}</div>
      <div class="workout-info">
        <h3>${type.label}</h3>
        <div class="workout-meta">
          <span>${dateStr}</span>
          <span>${details}</span>
        </div>
        ${w.notes ? `<div class="workout-meta" style="margin-top:4px;color:var(--text-muted);font-style:italic">${escapeHTML(w.notes)}</div>` : ''}
      </div>
      ${showActions ? `
        <div class="workout-actions">
          <button class="share-btn" onclick="shareSingleWorkout('${w.id}')" title="分享">📤</button>
          <button onclick="deleteWorkout('${w.id}')" title="删除">🗑</button>
        </div>
      ` : ''}
    </div>`;
}

// ==================== 记录锻炼表单 ====================
let selectedType = 'running';

const typeLabels = { distanceGroup: ['running', 'cycling'], weightGroup: ['weights'], repsGroup: ['weights'] };

document.querySelectorAll('.type-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedType = btn.dataset.type;
    toggleFormFields();
  });
});

function toggleFormFields() {
  document.getElementById('distanceGroup').style.display =
    ['running', 'cycling'].includes(selectedType) ? 'block' : 'none';
  document.getElementById('weightGroup').style.display =
    selectedType === 'weights' ? 'block' : 'none';
  document.getElementById('repsGroup').style.display =
    selectedType === 'weights' ? 'block' : 'none';
}

// 设置默认日期为今天
document.getElementById('workoutDate').value = new Date().toISOString().split('T')[0];
toggleFormFields();

document.getElementById('workoutForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const workout = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    type: selectedType,
    date: document.getElementById('workoutDate').value,
    duration: parseInt(document.getElementById('workoutDuration').value) || 0,
    distance: parseFloat(document.getElementById('workoutDistance').value) || 0,
    weight: parseFloat(document.getElementById('workoutWeight').value) || 0,
    sets: parseInt(document.getElementById('workoutSets').value) || 0,
    reps: parseInt(document.getElementById('workoutReps').value) || 0,
    calories: parseInt(document.getElementById('workoutCalories').value) || estimateCalories(),
    notes: document.getElementById('workoutNotes').value.trim(),
    createdAt: new Date().toISOString()
  };

  const workouts = getWorkouts();
  workouts.unshift(workout);
  saveWorkouts(workouts);

  // 重置表单
  this.reset();
  document.getElementById('workoutDate').value = new Date().toISOString().split('T')[0];
  selectedType = 'running';
  document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.type-btn[data-type="running"]').classList.add('active');
  toggleFormFields();

  showToast('锻炼记录已保存！');
  switchTab('dashboard');
  checkMilestones();
});

function estimateCalories() {
  const duration = parseInt(document.getElementById('workoutDuration').value) || 0;
  const rates = { running: 10, cycling: 7, weights: 6, other: 5 };
  return Math.round(duration * (rates[selectedType] || 5));
}

function deleteWorkout(id) {
  if (!confirm('确定要删除这条锻炼记录吗？')) return;
  const workouts = getWorkouts().filter(w => w.id !== id);
  saveWorkouts(workouts);
  renderWorkoutList();
  refreshDashboard();
  showToast('记录已删除');
}

// ==================== 计步器 ====================
let stepCount = parseInt(localStorage.getItem('fittrack_steps') || '0');
let stepDate = localStorage.getItem('fittrack_step_date') || '';

function initPedometer() {
  // 每日重置
  const today = new Date().toISOString().split('T')[0];
  if (stepDate !== today) {
    stepCount = 0;
    stepDate = today;
    localStorage.setItem('fittrack_step_date', stepDate);
    localStorage.setItem('fittrack_steps', '0');
  }

  // 尝试使用 Pedometer API
  if ('PedestrianStatus' in window) {
    try {
      const status = new PedestrianStatus();
      status.addEventListener('state', (e) => {
        if (e.state === 'started') {
          stepCount++;
          localStorage.setItem('fittrack_steps', stepCount.toString());
          updateStepDisplay();
        }
      });
      status.start();
    } catch (e) {
      console.log('Pedometer API not available');
    }
  }

  // 使用 Generic Sensor API (DeviceMotion fallback)
  if ('DeviceMotionEvent' in window) {
    let lastAccel = null;
    let lastStepTime = 0;

    window.addEventListener('devicemotion', (e) => {
      const accel = e.accelerationIncludingGravity;
      if (!accel || accel.x === null) return;

      const magnitude = Math.sqrt(accel.x ** 2 + accel.y ** 2 + accel.z ** 2);

      if (lastAccel !== null) {
        const delta = Math.abs(magnitude - lastAccel);
        const now = Date.now();

        if (delta > 6 && now - lastStepTime > 300) {
          stepCount++;
          lastStepTime = now;
          localStorage.setItem('fittrack_steps', stepCount.toString());
          updateStepDisplay();
        }
      }
      lastAccel = magnitude;
    });
  }

  updateStepDisplay();
}

function updateStepDisplay() {
  const goalSteps = 10000;
  document.getElementById('stepCount').textContent = stepCount.toLocaleString();

  const circumference = 2 * Math.PI * 54; // 339.292
  const progress = Math.min(stepCount / goalSteps, 1);
  const offset = circumference * (1 - progress);
  document.getElementById('stepRingFill').style.strokeDashoffset = offset;

  // 估算消耗和距离
  const calories = Math.round(stepCount * 0.04);
  const distance = (stepCount * 0.0007).toFixed(2);
  document.getElementById('stepCalories').textContent = calories;
  document.getElementById('stepDistance').textContent = distance;
}

// ==================== 图表 ====================
let weeklyChartInstance = null;
let durationChartInstance = null;
let typeChartInstance = null;
let chartRange = 'week';

function renderWeeklyChart() {
  const ctx = document.getElementById('weeklyChart');
  if (!ctx) return;

  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const dayData = Array(7).fill(0);
  const dayCalories = Array(7).fill(0);
  const workouts = getWorkouts();

  workouts.forEach(w => {
    const d = new Date(w.date);
    if (d >= weekStart) {
      const dayIdx = d.getDay();
      dayData[dayIdx] += w.duration || 0;
      dayCalories[dayIdx] += w.calories || 0;
    }
  });

  // 重新排列为 周一...周日
  const reordered = dayData.map((_, i) => dayData[(i + 1) % 7]);
  const reorderedCal = dayCalories.map((_, i) => dayCalories[(i + 1) % 7]);
  const labels = days.slice(1).concat(days[0]);

  if (weeklyChartInstance) weeklyChartInstance.destroy();

  weeklyChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: '时长(分)',
          data: reordered,
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
          borderRadius: 6,
          borderSkipped: false
        },
        {
          label: '千卡',
          data: reorderedCal,
          backgroundColor: 'rgba(34, 197, 94, 0.5)',
          borderRadius: 6,
          borderSkipped: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#94a3b8', font: { size: 11 } } }
      },
      scales: {
        x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    }
  });
}

function refreshStats() {
  renderDurationChart(chartRange);
  renderTypeChart();
  renderMilestones();
  updateShareCard();
}

document.querySelectorAll('.chart-range').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.chart-range').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    chartRange = btn.dataset.range;
    renderDurationChart(chartRange);
  });
});

function getFilteredWorkouts(range) {
  const workouts = getWorkouts();
  const now = new Date();
  let startDate;

  if (range === 'week') {
    startDate = new Date(now);
    startDate.setDate(now.getDate() - now.getDay());
  } else if (range === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    startDate = new Date(now);
    startDate.setMonth(now.getMonth() - 3);
  }
  startDate.setHours(0, 0, 0, 0);

  return workouts.filter(w => new Date(w.date) >= startDate);
}

function renderDurationChart(range) {
  const ctx = document.getElementById('durationChart');
  if (!ctx) return;

  const workouts = getFilteredWorkouts(range);

  // 按日期分组
  const grouped = {};
  workouts.forEach(w => {
    if (!grouped[w.date]) grouped[w.date] = { duration: 0, calories: 0 };
    grouped[w.date].duration += w.duration || 0;
    grouped[w.date].calories += w.calories || 0;
  });

  const dates = Object.keys(grouped).sort();
  const durations = dates.map(d => grouped[d].duration);

  if (durationChartInstance) durationChartInstance.destroy();

  durationChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates.map(d => formatDateShort(d)),
      datasets: [{
        label: '锻炼时长(分)',
        data: durations,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#3b82f6',
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#94a3b8' } }
      },
      scales: {
        x: { ticks: { color: '#64748b', maxRotation: 45 }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' }, beginAtZero: true }
      }
    }
  });
}

function renderTypeChart() {
  const ctx = document.getElementById('typeChart');
  if (!ctx) return;

  const workouts = getWorkouts();
  const typeCounts = {};
  workouts.forEach(w => {
    typeCounts[w.type] = (typeCounts[w.type] || 0) + 1;
  });

  const types = Object.keys(typeCounts);
  const data = types.map(t => typeCounts[t]);
  const colors = types.map(t => WORKOUT_TYPES[t]?.color || '#a855f7');
  const labels = types.map(t => WORKOUT_TYPES[t]?.label || '其他');

  if (typeChartInstance) typeChartInstance.destroy();

  typeChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderWidth: 0,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'right',
          labels: { color: '#94a3b8', padding: 12, font: { size: 13 } }
        }
      }
    }
  });
}

// ==================== 里程碑 ====================
const MILESTONE_DEFS = [
  { id: 'first',   label: '初次锻炼',     emoji: '⭐', check: ws => ws.length >= 1 },
  { id: 'five',    label: '完成5次锻炼',   emoji: '🏅', check: ws => ws.length >= 5 },
  { id: 'ten',     label: '完成10次锻炼',  emoji: '🥈', check: ws => ws.length >= 10 },
  { id: 'twenty',  label: '完成20次锻炼',  emoji: '🥇', check: ws => ws.length >= 20 },
  { id: 'fifty',   label: '完成50次锻炼',  emoji: '💎', check: ws => ws.length >= 50 },
  { id: 'hundred', label: '完成100次锻炼', emoji: '👑', check: ws => ws.length >= 100 },
  { id: 'streak3', label: '连续锻炼3天',   emoji: '🔥', check: ws => calcStreakFrom(ws) >= 3 },
  { id: 'streak7', label: '连续锻炼7天',   emoji: '💪', check: ws => calcStreakFrom(ws) >= 7 },
  { id: 'streak30',label: '连续锻炼30天',  emoji: '🏆', check: ws => calcStreakFrom(ws) >= 30 },
  { id: 'marathon',label: '累计跑步42km',  emoji: '🏃‍♂️', check: ws => ws.filter(w=>w.type==='running').reduce((s,w)=>s+(w.distance||0),0) >= 42 },
];

function calcStreakFrom(workouts) {
  const dates = [...new Set(workouts.map(w => w.date))].sort().reverse();
  if (!dates.length) return 0;
  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diff = (prev - curr) / 86400000;
    if (Math.round(diff) === 1) streak++;
    else break;
  }
  return streak;
}

function renderMilestones() {
  const workouts = getWorkouts();
  const container = document.getElementById('milestones');

  container.innerHTML = MILESTONE_DEFS.map(m => {
    const achieved = m.check(workouts);
    return `
      <div class="milestone-item">
        <div class="milestone-icon ${achieved ? 'achieved' : ''}">${m.emoji}</div>
        <div class="milestone-info">
          <h4>${m.label}</h4>
          <p>${achieved ? '已达成！' : '继续努力...'}</p>
        </div>
      </div>`;
  }).join('');
}

function checkMilestones() {
  const workouts = getWorkouts();
  const achieved = MILESTONE_DEFS.filter(m => m.check(workouts));
  // 简单通知最近的里程碑
  if (achieved.length > 0) {
    const latest = achieved[achieved.length - 1];
    const prevAchieved = parseInt(localStorage.getItem('fittrack_milestone_count') || '0');
    if (achieved.length > prevAchieved) {
      showToast(`🎉 达成里程碑: ${latest.label}！`);
      localStorage.setItem('fittrack_milestone_count', achieved.length.toString());
    }
  }
}

// ==================== 目标管理 ====================
function showAddGoal() {
  document.getElementById('goalModal').classList.add('show');
}

function closeGoalModal() {
  document.getElementById('goalModal').classList.remove('show');
}

document.getElementById('goalForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const goal = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    type: document.getElementById('goalType').value,
    target: parseFloat(document.getElementById('goalTarget').value),
    deadline: document.getElementById('goalDeadline').value || null,
    createdAt: new Date().toISOString()
  };

  const goals = getGoals();
  goals.push(goal);
  saveGoals(goals);

  this.reset();
  closeGoalModal();
  renderGoals();
  showToast('目标已设定！');
});

function renderGoals() {
  const goals = getGoals();
  const workouts = getWorkouts();
  const container = document.getElementById('goalsList');

  if (!goals.length) {
    container.innerHTML = `
      <div class="empty-state">
        <p>还没有设定目标</p>
        <p class="text-muted">设定目标，追踪你的健身里程碑</p>
        <button class="btn-primary" onclick="showAddGoal()">设定目标</button>
      </div>`;
    return;
  }

  const typeLabels = {
    weekly_workouts: '每周锻炼次数',
    weekly_minutes: '每周锻炼时长(分钟)',
    total_distance: '总距离(公里)',
    total_weight: '举重总量(公斤)',
    streak: '连续锻炼天数'
  };

  container.innerHTML = goals.map(g => {
    const current = calcGoalProgress(g, workouts);
    const pct = Math.min((current / g.target) * 100, 100);
    const isComplete = pct >= 100;

    // 里程碑节点 (25%, 50%, 75%, 100%)
    const milestones = [25, 50, 75, 100];
    const milestoneHTML = milestones.map(m => {
      let cls = '';
      if (pct >= m) cls = 'achieved';
      else if (pct >= m - 25) cls = 'current';
      return `<div class="milestone-dot ${cls}">${m}%</div>`;
    }).join('');

    return `
      <div class="goal-item" style="${isComplete ? 'border:1px solid var(--success)' : ''}">
        <div class="goal-header">
          <h3>${typeLabels[g.type] || g.type}${isComplete ? ' ✅' : ''}</h3>
          ${g.deadline ? `<span class="goal-deadline">截止: ${formatDate(g.deadline)}</span>` : ''}
        </div>
        <div class="goal-progress-bar">
          <div class="goal-progress-fill" style="width:${pct}%;${isComplete ? 'background:var(--success)' : ''}"></div>
        </div>
        <div class="goal-progress-text">
          <span>${current} / ${g.target}</span>
          <span>${Math.round(pct)}%</span>
        </div>
        <div class="goal-milestones">${milestoneHTML}</div>
        <div class="goal-actions">
          <button onclick="deleteGoal('${g.id}')">删除</button>
        </div>
      </div>`;
  }).join('');
}

function calcGoalProgress(goal, workouts) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  switch (goal.type) {
    case 'weekly_workouts':
      return workouts.filter(w => new Date(w.date) >= weekStart).length;
    case 'weekly_minutes':
      return workouts.filter(w => new Date(w.date) >= weekStart).reduce((s, w) => s + (w.duration || 0), 0);
    case 'total_distance':
      return workouts.reduce((s, w) => s + (w.distance || 0), 0);
    case 'total_weight':
      return workouts.filter(w => w.type === 'weights').reduce((s, w) => s + (w.weight || 0) * (w.reps || 1) * (w.sets || 1), 0);
    case 'streak':
      return calcStreakFrom(workouts);
    default:
      return 0;
  }
}

function deleteGoal(id) {
  if (!confirm('确定要删除这个目标吗？')) return;
  const goals = getGoals().filter(g => g.id !== id);
  saveGoals(goals);
  renderGoals();
  showToast('目标已删除');
}

// ==================== 分享功能 ====================
function updateShareCard() {
  const workouts = getWorkouts();
  document.getElementById('shareTotalWorkouts').textContent = workouts.length;
  document.getElementById('shareTotalMinutes').textContent = workouts.reduce((s, w) => s + (w.duration || 0), 0);
  document.getElementById('shareTotalCalories').textContent = workouts.reduce((s, w) => s + (w.calories || 0), 0);
  document.getElementById('shareStreak').textContent = calcStreakFrom(workouts);
  document.getElementById('shareDate').textContent = new Date().toLocaleDateString('zh-CN');
}

function shareWorkout() {
  updateShareCard();
  document.getElementById('shareModal').classList.add('show');
  document.getElementById('sharePreview').innerHTML = `
    <div class="share-card">
      <div class="share-header">
        <h2>FitTrack 健身报告</h2>
        <p>${new Date().toLocaleDateString('zh-CN')}</p>
      </div>
      <div class="share-stats">
        <div class="share-stat">
          <span class="share-stat-value">${document.getElementById('shareTotalWorkouts').textContent}</span>
          <span class="share-stat-label">总锻炼次数</span>
        </div>
        <div class="share-stat">
          <span class="share-stat-value">${document.getElementById('shareTotalMinutes').textContent}</span>
          <span class="share-stat-label">总时长(分)</span>
        </div>
        <div class="share-stat">
          <span class="share-stat-value">${document.getElementById('shareTotalCalories').textContent}</span>
          <span class="share-stat-label">总千卡</span>
        </div>
        <div class="share-stat">
          <span class="share-stat-value">${document.getElementById('shareStreak').textContent}</span>
          <span class="share-stat-label">最长连续</span>
        </div>
      </div>
      <div class="share-footer">FitTrack - 你的健身伙伴</div>
    </div>`;
}

function closeShareModal() {
  document.getElementById('shareModal').classList.remove('show');
}

function shareSingleWorkout(id) {
  const workout = getWorkouts().find(w => w.id === id);
  if (!workout) return;

  const type = WORKOUT_TYPES[workout.type] || WORKOUT_TYPES.other;
  let text = `${type.emoji} ${type.label}\n`;
  text += `📅 ${formatDate(workout.date)}\n`;
  text += `⏱ ${workout.duration} 分钟\n`;
  if (workout.distance) text += `📏 ${workout.distance} 公里\n`;
  if (workout.weight) text += `🏋️ ${workout.weight} 公斤\n`;
  if (workout.sets && workout.reps) text += `🔄 ${workout.sets}×${workout.reps}\n`;
  text += `🔥 ${workout.calories} 千卡`;
  if (workout.notes) text += `\n💬 ${workout.notes}`;

  if (navigator.share) {
    navigator.share({ title: '我的锻炼记录', text }).catch(() => {});
  } else {
    copyToClipboard(text);
  }
}

function downloadShareCard() {
  const card = document.querySelector('#shareModal .share-card');
  if (!card) return;

  if (typeof html2canvas !== 'undefined') {
    html2canvas(card, { backgroundColor: '#0f172a', scale: 2 }).then(canvas => {
      const link = document.createElement('a');
      link.download = `fittrack-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL();
      link.click();
      showToast('图片已下载！');
    });
  } else {
    showToast('截图功能不可用');
  }
}

function copyShareText() {
  const workouts = getWorkouts();
  const totalMin = workouts.reduce((s, w) => s + (w.duration || 0), 0);
  const totalCal = workouts.reduce((s, w) => s + (w.calories || 0), 0);
  const streak = calcStreakFrom(workouts);
  const text = `FitTrack 健身报告\n总锻炼: ${workouts.length} 次\n总时长: ${totalMin} 分钟\n总消耗: ${totalCal} 千卡\n最长连续: ${streak} 天`;

  copyToClipboard(text);
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('已复制到剪贴板！');
  }).catch(() => {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('已复制到剪贴板！');
  });
}

// ==================== Toast ====================
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// ==================== 工具函数 ====================
function formatDate(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today - 86400000);

  if (dateStr === today.toISOString().split('T')[0]) return '今天';
  if (dateStr === yesterday.toISOString().split('T')[0]) return '昨天';

  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function formatDateShort(dateStr) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
  refreshDashboard();
  initPedometer();
  checkMilestones();

  // 注册 Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
      .then(() => console.log('SW registered'))
      .catch(err => console.log('SW failed:', err));
  }
});
