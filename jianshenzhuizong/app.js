// ===== FitTrack - 健身追踪仪表盘 =====

// ===== Data Store (IndexedDB) =====
class DB {
  static NAME = 'FitTrackDB';
  static VERSION = 1;

  static open() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.NAME, this.VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('workouts')) {
          db.createObjectStore('workouts', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('weights')) {
          db.createObjectStore('weights', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('goals')) {
          db.createObjectStore('goals', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('steps')) {
          db.createObjectStore('steps', { keyPath: 'date' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  static async getAll(store) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readonly');
      const s = tx.objectStore(store).getAll();
      s.onsuccess = () => resolve(s.result);
      s.onerror = () => reject(s.error);
    });
  }

  static async put(store, data) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      const s = tx.objectStore(store).put(data);
      s.onsuccess = () => resolve(s.result);
      s.onerror = () => reject(s.error);
    });
  }

  static async delete(store, id) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      const s = tx.objectStore(store).delete(id);
      s.onsuccess = () => resolve(s.result);
      s.onerror = () => reject(s.error);
    });
  }

  static async get(store, key) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readonly');
      const s = tx.objectStore(store).get(key);
      s.onsuccess = () => resolve(s.result);
      s.onerror = () => reject(s.error);
    });
  }
}

// ===== Utilities =====
const WORKOUT_TYPES = {
  running: { icon: '🏃', label: '跑步', caloriesPerMin: 11 },
  cycling: { icon: '🚴', label: '骑行', caloriesPerMin: 8 },
  weightlifting: { icon: '🏋️', label: '举重', caloriesPerMin: 6 },
  swimming: { icon: '🏊', label: '游泳', caloriesPerMin: 10 },
  yoga: { icon: '🧘', label: '瑜伽', caloriesPerMin: 4 },
  hiit: { icon: '⚡', label: 'HIIT', caloriesPerMin: 13 },
  walking: { icon: '🚶', label: '散步', caloriesPerMin: 4 }
};

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(d) {
  return new Date(d).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDateShort(d) {
  return new Date(d).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
}

function getStartOfWeek() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay() + 1); // Monday
  return d;
}

function getToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function showToast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show ' + type;
  setTimeout(() => el.className = 'toast', 2500);
}

// ===== App State =====
let charts = {};
let lastWorkout = null;
let pedometerActive = false;
let deferredPrompt = null;

// ===== Navigation =====
function initNav() {
  const links = document.querySelectorAll('.nav-link, .mobile-link');
  const menuBtn = document.getElementById('menuBtn');
  const mobileMenu = document.getElementById('mobileMenu');

  function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-link, .mobile-link').forEach(l => l.classList.remove('active'));
    document.getElementById(tab).classList.add('active');
    document.querySelectorAll(`[data-tab="${tab}"]`).forEach(l => l.classList.add('active'));
    mobileMenu.classList.remove('open');

    // Refresh charts when tab becomes visible
    if (tab === 'dashboard') refreshDashboard();
    if (tab === 'workouts') refreshWorkouts();
    if (tab === 'goals') refreshGoals();
    if (tab === 'progress') refreshProgress();
  }

  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab(link.dataset.tab);
    });
  });

  menuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
  });

  // Close mobile menu on outside click
  document.addEventListener('click', (e) => {
    if (!mobileMenu.contains(e.target) && e.target !== menuBtn) {
      mobileMenu.classList.remove('open');
    }
  });
}

// ===== Quick Workout Form =====
async function addWorkout(data) {
  const workout = {
    id: genId(),
    type: data.type,
    duration: data.duration,
    distance: data.distance || null,
    weight: data.weight || null,
    calories: calcCalories(data.type, data.duration, data.distance),
    notes: data.notes || '',
    createdAt: new Date().toISOString()
  };
  await DB.put('workouts', workout);
  return workout;
}

function calcCalories(type, duration, distance) {
  const meta = WORKOUT_TYPES[type];
  let cal = (meta.caloriesPerMin * duration);
  if (distance && (type === 'running' || type === 'cycling')) {
    cal = Math.max(cal, distance * (type === 'running' ? 70 : 30));
  }
  return Math.round(cal);
}

// ===== Dashboard =====
async function refreshDashboard() {
  const workouts = await DB.getAll('workouts');
  const weights = await DB.getAll('weights');

  // Weekly stats
  const weekStart = getStartOfWeek();
  const weekWorkouts = workouts.filter(w => new Date(w.createdAt) >= weekStart);

  const totalCal = weekWorkouts.reduce((s, w) => s + w.calories, 0);
  const totalDur = weekWorkouts.reduce((s, w) => s + w.duration, 0);

  document.getElementById('totalCalories').textContent = totalCal.toLocaleString();
  document.getElementById('totalDuration').textContent = totalDur;
  document.getElementById('totalWorkouts').textContent = weekWorkouts.length;

  // Current weight
  if (weights.length > 0) {
    const latest = weights.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    document.getElementById('currentWeight').textContent = latest.value;
  }

  // Recent workouts
  renderRecentWorkouts(workouts);

  // Weight chart
  renderWeightChart(weights);
}

function renderRecentWorkouts(workouts) {
  const container = document.getElementById('recentWorkouts');
  const sorted = workouts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  if (sorted.length === 0) {
    container.innerHTML = '<p class="empty-state">还没有锻炼记录，开始记录吧！</p>';
    return;
  }

  container.innerHTML = sorted.map(w => `
    <div class="workout-item">
      <div class="workout-icon">${WORKOUT_TYPES[w.type].icon}</div>
      <div class="workout-details">
        <div class="workout-type">${WORKOUT_TYPES[w.type].label}</div>
        <div class="workout-meta">
          <span>⏱ ${w.duration}分钟</span>
          ${w.distance ? `<span>📏 ${w.distance}km</span>` : ''}
          ${w.weight ? `<span>🏋️ ${w.weight}kg</span>` : ''}
          <span>🔥 ${w.calories}千卡</span>
        </div>
      </div>
      <div class="workout-actions">
        <button title="分享" onclick="shareWorkout('${w.id}')">📤</button>
        <button title="删除" class="delete" onclick="deleteWorkout('${w.id}')">🗑</button>
      </div>
    </div>
  `).join('');
}

// ===== Charts =====
function renderWeightChart(weights) {
  const sorted = weights.sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-30);
  const ctx = document.getElementById('weightChart').getContext('2d');

  if (charts.weight) charts.weight.destroy();

  if (sorted.length === 0) {
    charts.weight = new Chart(ctx, {
      type: 'line',
      data: { labels: ['暂无数据'], datasets: [{ data: [0], borderColor: 'rgba(233,69,96,0.5)' }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
    return;
  }

  charts.weight = new Chart(ctx, {
    type: 'line',
    data: {
      labels: sorted.map(w => formatDateShort(w.date)),
      datasets: [{
        label: '体重 (kg)',
        data: sorted.map(w => w.value),
        borderColor: '#e94560',
        backgroundColor: 'rgba(233,69,96,0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#e94560',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6b6b80', font: { size: 11 } } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6b6b80', font: { size: 11 } } }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1a1a2e',
          borderColor: 'rgba(233,69,96,0.3)',
          borderWidth: 1,
          titleColor: '#e8e8f0',
          bodyColor: '#a0a0b8',
        }
      }
    }
  });
}

// ===== Workouts Tab =====
async function refreshWorkouts() {
  const workouts = await DB.getAll('workouts');
  renderWorkoutHistory(workouts);
  renderVolumeChart(workouts);
}

function renderWorkoutHistory(workouts) {
  const typeFilter = document.getElementById('filterType').value;
  const dateFrom = document.getElementById('filterDateFrom').value;
  const dateTo = document.getElementById('filterDateTo').value;

  let filtered = workouts;
  if (typeFilter !== 'all') filtered = filtered.filter(w => w.type === typeFilter);
  if (dateFrom) filtered = filtered.filter(w => new Date(w.createdAt) >= new Date(dateFrom));
  if (dateTo) filtered = filtered.filter(w => new Date(w.createdAt) <= new Date(dateTo + 'T23:59:59'));

  filtered = filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const container = document.getElementById('workoutHistory');
  if (filtered.length === 0) {
    container.innerHTML = '<p class="empty-state">暂无匹配的锻炼记录</p>';
    return;
  }

  container.innerHTML = filtered.map(w => `
    <div class="workout-item">
      <div class="workout-icon">${WORKOUT_TYPES[w.type].icon}</div>
      <div class="workout-details">
        <div class="workout-type">${WORKOUT_TYPES[w.type].label}</div>
        <div class="workout-meta">
          <span>📅 ${formatDateTime(w.createdAt)}</span>
          <span>⏱ ${w.duration}分钟</span>
          ${w.distance ? `<span>📏 ${w.distance}km</span>` : ''}
          ${w.weight ? `<span>🏋️ ${w.weight}kg</span>` : ''}
          <span>🔥 ${w.calories}千卡</span>
        </div>
        ${w.notes ? `<div class="workout-meta"><span>💬 ${w.notes}</span></div>` : ''}
      </div>
      <div class="workout-actions">
        <button title="分享" onclick="shareWorkout('${w.id}')">📤</button>
        <button title="删除" class="delete" onclick="deleteWorkout('${w.id}')">🗑</button>
      </div>
    </div>
  `).join('');
}

function renderVolumeChart(workouts) {
  // Weekly volume for last 8 weeks
  const weeks = [];
  for (let i = 7; i >= 0; i--) {
    const start = new Date();
    start.setDate(start.getDate() - start.getDay() + 1 - i * 7);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    const label = `第${start.getMonth() + 1}/${start.getDate()}周`;
    const weekW = workouts.filter(w => {
      const d = new Date(w.createdAt);
      return d >= start && d <= end;
    });
    weeks.push({
      label,
      count: weekW.length,
      duration: weekW.reduce((s, w) => s + w.duration, 0),
      calories: weekW.reduce((s, w) => s + w.calories, 0)
    });
  }

  const ctx = document.getElementById('volumeChart').getContext('2d');
  if (charts.volume) charts.volume.destroy();

  charts.volume = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: weeks.map(w => w.label),
      datasets: [
        {
          label: '锻炼次数',
          data: weeks.map(w => w.count),
          backgroundColor: 'rgba(233,69,96,0.7)',
          borderRadius: 6,
          yAxisID: 'y'
        },
        {
          label: '时长(分钟)',
          data: weeks.map(w => w.duration),
          backgroundColor: 'rgba(0,180,216,0.7)',
          borderRadius: 6,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6b6b80', font: { size: 10 } } },
        y: { position: 'left', grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#e94560' }, title: { display: true, text: '次数', color: '#6b6b80' } },
        y1: { position: 'right', grid: { display: false }, ticks: { color: '#00b4d8' }, title: { display: true, text: '分钟', color: '#6b6b80' } }
      },
      plugins: {
        legend: { labels: { color: '#a0a0b8', usePointStyle: true, pointStyle: 'rectRounded' } },
        tooltip: { backgroundColor: '#1a1a2e', borderColor: 'rgba(233,69,96,0.3)', borderWidth: 1, titleColor: '#e8e8f0', bodyColor: '#a0a0b8' }
      }
    }
  });
}

// ===== Goals =====
async function addGoal(data) {
  const goal = {
    id: genId(),
    type: data.type,
    target: data.target,
    current: 0,
    deadline: data.deadline,
    createdAt: new Date().toISOString(),
    completed: false
  };
  await DB.put('goals', goal);
  return goal;
}

async function refreshGoals() {
  const goals = await DB.getAll('goals');
  const workouts = await DB.getAll('workouts');
  const weights = await DB.getAll('weights');

  // Calculate current progress for each goal
  for (const goal of goals) {
    if (goal.completed) continue;

    const weekStart = getStartOfWeek();
    const weekWorkouts = workouts.filter(w => new Date(w.createdAt) >= weekStart);
    const allWorkouts = workouts;

    switch (goal.type) {
      case 'weekly_workouts':
        goal.current = weekWorkouts.length;
        break;
      case 'weekly_duration':
        goal.current = weekWorkouts.reduce((s, w) => s + w.duration, 0);
        break;
      case 'weekly_distance':
        goal.current = weekWorkouts.reduce((s, w) => s + (w.distance || 0), 0);
        break;
      case 'weight_target':
        if (weights.length > 0) {
          const latest = weights.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
          goal.current = latest.value;
          // Reverse progress for weight loss (closer to target = more progress)
        }
        break;
      case 'run_5k':
        goal.current = allWorkouts
          .filter(w => w.type === 'running' && w.distance)
          .reduce((max, w) => Math.max(max, w.distance), 0);
        break;
      case 'run_10k':
        goal.current = allWorkouts
          .filter(w => w.type === 'running' && w.distance)
          .reduce((max, w) => Math.max(max, w.distance), 0);
        break;
      case 'total_workouts':
        goal.current = allWorkouts.length;
        break;
    }

    // Auto-complete
    const progress = goal.type === 'weight_target'
      ? 1 - Math.abs(goal.current - goal.target) / goal.target
      : Math.min(goal.current / goal.target, 1);

    if (progress >= 1) {
      goal.completed = true;
      await DB.put('goals', goal);
    }
  }

  renderGoals(goals);
}

function getGoalProgress(goal) {
  if (goal.type === 'weight_target') {
    if (!goal.current) return 0;
    // If target is less than initial weight (losing weight)
    return Math.max(0, Math.min(1, 1 - Math.abs(goal.current - goal.target) / goal.target));
  }
  return Math.min(goal.current / goal.target, 1);
}

function getGoalLabel(type) {
  const labels = {
    weekly_workouts: '每周锻炼次数',
    weekly_duration: '每周运动时长(分钟)',
    weekly_distance: '每周运动距离(km)',
    weight_target: '目标体重(kg)',
    run_5k: '5公里跑步',
    run_10k: '10公里跑步',
    total_workouts: '总锻炼次数'
  };
  return labels[type] || type;
}

function renderGoals(goals) {
  const container = document.getElementById('goalsList');
  const sorted = goals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (sorted.length === 0) {
    container.innerHTML = '<p class="empty-state">还没有设定目标</p>';
    return;
  }

  container.innerHTML = sorted.map(goal => {
    const progress = getGoalProgress(goal);
    const pct = Math.round(progress * 100);
    const isOverdue = new Date(goal.deadline) < new Date() && !goal.completed;
    const statusClass = goal.completed ? 'completed' : (isOverdue ? 'overdue' : 'in-progress');
    const statusText = goal.completed ? '✅ 已达成' : (isOverdue ? '⏰ 已过期' : '🔄 进行中');

    // Milestones
    const milestones = [25, 50, 75, 100];
    const milestoneHtml = milestones.map(m => {
      const reached = pct >= m;
      const isCurrent = !reached && milestones.filter(mm => pct >= mm).length === milestones.indexOf(m) - 1;
      return `<div class="goal-milestone">
        <div class="milestone-marker ${reached ? 'reached' : ''} ${isCurrent && !goal.completed ? 'current' : ''}"></div>
        <div class="milestone-label">${m}%</div>
      </div>`;
    }).join('');

    const currentDisplay = goal.type === 'weight_target'
      ? `${goal.current || '--'} kg` : goal.current;

    return `<div class="goal-item ${goal.completed ? 'completed' : ''}">
      <div class="goal-header">
        <div class="goal-title">${getGoalLabel(goal.type)}</div>
        <span class="goal-status ${statusClass}">${statusText}</span>
      </div>
      <div class="goal-progress-container">
        <div class="goal-progress-bar">
          <div class="goal-progress-fill ${goal.completed ? 'complete' : ''}" style="width: ${pct}%"></div>
        </div>
        <div class="goal-milestones">${milestoneHtml}</div>
      </div>
      <div class="goal-info">
        <span>当前: ${currentDisplay} / 目标: ${goal.target}</span>
        <span>截止: ${formatDate(goal.deadline)}</span>
      </div>
      <div class="goal-actions">
        <button class="btn btn-secondary btn-sm" onclick="deleteGoal('${goal.id}')">删除目标</button>
      </div>
    </div>`;
  }).join('');
}

// ===== Progress Tab =====
async function refreshProgress() {
  const workouts = await DB.getAll('workouts');
  renderTypeChart(workouts);
  renderMonthlyChart(workouts);
  renderCaloriesChart(workouts);
  renderPersonalRecords(workouts);
}

function renderTypeChart(workouts) {
  const counts = {};
  workouts.forEach(w => {
    counts[w.type] = (counts[w.type] || 0) + 1;
  });

  const ctx = document.getElementById('typeChart').getContext('2d');
  if (charts.type) charts.type.destroy();

  const types = Object.keys(counts);
  if (types.length === 0) return;

  const colors = ['#e94560', '#00b4d8', '#00d68f', '#ffaa00', '#a855f7', '#f97316', '#06b6d4'];

  charts.type = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: types.map(t => WORKOUT_TYPES[t]?.label || t),
      datasets: [{
        data: types.map(t => counts[t]),
        backgroundColor: colors.slice(0, types.length),
        borderWidth: 0,
        spacing: 2,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: { position: 'bottom', labels: { color: '#a0a0b8', usePointStyle: true, padding: 16, font: { size: 12 } } }
      }
    }
  });
}

function renderMonthlyChart(workouts) {
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i, 1);
    d.setHours(0, 0, 0, 0);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    const label = `${d.getFullYear()}/${d.getMonth() + 1}`;
    const mWorkouts = workouts.filter(w => {
      const wd = new Date(w.createdAt);
      return wd >= d && wd <= end;
    });
    months.push({
      label,
      count: mWorkouts.length,
      duration: mWorkouts.reduce((s, w) => s + w.duration, 0),
    });
  }

  const ctx = document.getElementById('monthlyChart').getContext('2d');
  if (charts.monthly) charts.monthly.destroy();

  charts.monthly = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months.map(m => m.label),
      datasets: [{
        label: '锻炼次数',
        data: months.map(m => m.count),
        backgroundColor: 'rgba(0,214,143,0.7)',
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6b6b80' } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6b6b80', stepSize: 1 } }
      },
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor: '#1a1a2e', borderColor: 'rgba(0,214,143,0.3)', borderWidth: 1, titleColor: '#e8e8f0', bodyColor: '#a0a0b8' }
      }
    }
  });
}

function renderCaloriesChart(workouts) {
  // Last 14 days
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const label = formatDateShort(d);
    const nextD = new Date(d);
    nextD.setDate(nextD.getDate() + 1);
    const dayCal = workouts
      .filter(w => {
        const wd = new Date(w.createdAt);
        return wd >= d && wd < nextD;
      })
      .reduce((s, w) => s + w.calories, 0);
    days.push({ label, calories: dayCal });
  }

  const ctx = document.getElementById('caloriesChart').getContext('2d');
  if (charts.calories) charts.calories.destroy();

  charts.calories = new Chart(ctx, {
    type: 'line',
    data: {
      labels: days.map(d => d.label),
      datasets: [{
        label: '卡路里(千卡)',
        data: days.map(d => d.calories),
        borderColor: '#ffaa00',
        backgroundColor: 'rgba(255,170,0,0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#ffaa00',
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6b6b80', font: { size: 10 }, maxRotation: 45 } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6b6b80' } }
      },
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor: '#1a1a2e', borderColor: 'rgba(255,170,0,0.3)', borderWidth: 1, titleColor: '#e8e8f0', bodyColor: '#a0a0b8' }
      }
    }
  });
}

function renderPersonalRecords(workouts) {
  const container = document.getElementById('personalRecords');

  if (workouts.length === 0) {
    container.innerHTML = '<p class="empty-state">继续锻炼来创造记录吧！</p>';
    return;
  }

  const records = [];

  // Longest duration
  const longest = workouts.reduce((max, w) => w.duration > (max?.duration || 0) ? w : max, null);
  if (longest) records.push({ icon: '⏱', value: `${longest.duration}分`, label: `最长${WORKOUT_TYPES[longest.type].label}` });

  // Most calories
  const mostCal = workouts.reduce((max, w) => w.calories > (max?.calories || 0) ? w : max, null);
  if (mostCal) records.push({ icon: '🔥', value: `${mostCal.calories}千卡`, label: '单次最高消耗' });

  // Longest distance (running)
  const runDist = workouts.filter(w => w.type === 'running' && w.distance).reduce((max, w) => Math.max(max, w.distance), 0);
  if (runDist) records.push({ icon: '🏃', value: `${runDist}km`, label: '最长跑步距离' });

  // Heaviest lift
  const heaviest = workouts.filter(w => w.weight).reduce((max, w) => Math.max(max, w.weight), 0);
  if (heaviest) records.push({ icon: '🏋️', value: `${heaviest}kg`, label: '最大重量' });

  // Total workouts
  records.push({ icon: '💪', value: `${workouts.length}`, label: '总锻炼次数' });

  // Total calories
  const totalCal = workouts.reduce((s, w) => s + w.calories, 0);
  if (totalCal) records.push({ icon: '🔥', value: `${totalCal.toLocaleString()}`, label: '总消耗(千卡)' });

  container.innerHTML = records.map(r => `
    <div class="record-item">
      <div class="record-icon">${r.icon}</div>
      <div class="record-value">${r.value}</div>
      <div class="record-label">${r.label}</div>
    </div>
  `).join('');
}

// ===== Share =====
async function shareWorkout(id) {
  const workouts = await DB.getAll('workouts');
  const w = workouts.find(x => x.id === id);
  if (!w) return;

  const meta = WORKOUT_TYPES[w.type];

  document.getElementById('shareDate').textContent = formatDateTime(w.createdAt);
  document.getElementById('shareWorkoutType').textContent = meta.icon + ' ' + meta.label;

  const stats = [
    { label: '时长', value: `${w.duration} 分钟` },
    { label: '卡路里', value: `${w.calories} 千卡` },
  ];
  if (w.distance) stats.push({ label: '距离', value: `${w.distance} km` });
  if (w.weight) stats.push({ label: '重量', value: `${w.weight} kg` });

  document.getElementById('shareStats').innerHTML = stats.map(s => `
    <div class="share-stat">
      <span class="share-stat-value">${s.value}</span>
      <span class="share-stat-label">${s.label}</span>
    </div>
  `).join('');

  // Show native share button if available
  const nativeBtn = document.getElementById('nativeShareBtn');
  nativeBtn.style.display = navigator.share ? 'inline-flex' : 'none';

  // Store canvas reference for sharing
  nativeBtn.onclick = async () => {
    try {
      const card = document.getElementById('shareCard');
      const canvas = await html2canvas(card, { backgroundColor: '#1a1a2e', scale: 2 });
      const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
      const file = new File([blob], 'workout.png', { type: 'image/png' });
      await navigator.share({ title: '我的锻炼 - FitTrack', text: `${meta.label} ${w.duration}分钟 ${w.calories}千卡`, files: [file] });
    } catch (err) {
      // User cancelled or not supported
    }
  };

  document.getElementById('shareModal').classList.add('open');
}

async function downloadShareCard() {
  const card = document.getElementById('shareCard');
  try {
    const canvas = await html2canvas(card, { backgroundColor: '#1a1a2e', scale: 2 });
    const link = document.createElement('a');
    link.download = `fittrack-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('卡片已保存！');
  } catch (err) {
    showToast('保存失败', 'error');
  }
}

// ===== Pedometer API =====
async function initPedometer() {
  const btn = document.getElementById('startPedometer');
  const statusEl = document.getElementById('stepStatus');

  if (!('GenericSensor' in window)) {
    statusEl.textContent = '不支持';
    statusEl.className = 'badge';
    btn.disabled = true;
    return;
  }

  try {
    const { Pedometer } = await import('https://unpkg.com/pedometer@0.0.7/dist/index.es.js');
    const sensor = new Pedometer({ frequency: 60 });

    sensor.addEventListener('reading', () => {
      updateStepData(sensor.steps, sensor.distance || 0);
    });

    sensor.addEventListener('error', (e) => {
      statusEl.textContent = '错误';
      statusEl.className = 'badge';
      console.error('Pedometer error:', e.error);
    });

    btn.addEventListener('click', () => {
      if (pedometerActive) {
        sensor.stop();
        btn.textContent = '开始计步';
        statusEl.textContent = '已暂停';
        statusEl.className = 'badge';
        pedometerActive = false;
      } else {
        sensor.start();
        btn.textContent = '停止计步';
        statusEl.textContent = '计数中';
        statusEl.className = 'badge active-badge';
        pedometerActive = true;
      }
    });
  } catch (err) {
    // Pedometer API not available, use manual step entry
    btn.addEventListener('click', () => {
      manualStepInput();
    });
  }

  // Restore saved steps for today
  await restoreTodaySteps();
}

function manualStepInput() {
  const steps = prompt('请输入今日步数（使用移动端计步器数据）：');
  if (steps && !isNaN(steps)) {
    const count = parseInt(steps);
    updateStepData(count, count * 0.0007);
    saveTodaySteps(count);
    showToast('步数已更新！');
  }
}

async function saveTodaySteps(count) {
  const today = new Date().toISOString().split('T')[0];
  await DB.put('steps', { date: today, steps: count });
}

async function restoreTodaySteps() {
  const today = new Date().toISOString().split('T')[0];
  const data = await DB.get('steps', today);
  if (data) updateStepData(data.steps, data.steps * 0.0007);
}

function updateStepData(steps, distance) {
  const stepCount = document.getElementById('stepCount');
  const stepProgress = document.getElementById('stepProgress');
  const stepDistance = document.getElementById('stepDistance');
  const stepCalories = document.getElementById('stepCalories');

  const goal = 10000;
  const pct = Math.min(steps / goal, 1);

  stepCount.textContent = steps.toLocaleString();
  stepProgress.style.strokeDashoffset = 565.48 * (1 - pct);
  stepDistance.textContent = (distance / 1000).toFixed(2);
  stepCalories.textContent = Math.round(steps * 0.04);
}

// ===== Delete Functions =====
async function deleteWorkout(id) {
  if (!confirm('确定要删除这条锻炼记录吗？')) return;
  await DB.delete('workouts', id);
  showToast('已删除');
  await refreshDashboard();
}

async function deleteGoal(id) {
  if (!confirm('确定要删除这个目标吗？')) return;
  await DB.delete('goals', id);
  showToast('已删除');
  await refreshGoals();
}

// ===== Event Listeners =====
function initEventListeners() {
  // Quick workout form
  document.getElementById('quickWorkoutForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const type = document.getElementById('quickType').value;
    const duration = parseInt(document.getElementById('quickDuration').value);
    const distance = parseFloat(document.getElementById('quickDistance').value) || null;
    const weight = parseFloat(document.getElementById('quickWeight').value) || null;
    const notes = document.getElementById('quickNotes').value;

    if (!duration || duration < 1) {
      showToast('请输入有效的时长', 'error');
      return;
    }

    const workout = await addWorkout({ type, duration, distance, weight, notes });
    lastWorkout = workout;
    document.getElementById('shareWorkoutBtn').disabled = false;

    e.target.reset();
    showToast(`${WORKOUT_TYPES[type].label} 锻炼已记录！`);
    await refreshDashboard();
  });

  // Share workout button
  document.getElementById('shareWorkoutBtn').addEventListener('click', () => {
    if (lastWorkout) shareWorkout(lastWorkout.id);
  });

  // Weight form
  document.getElementById('weightForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const value = parseFloat(document.getElementById('weightInput').value);
    if (!value) return;

    await DB.put('weights', {
      id: genId(),
      value,
      date: new Date().toISOString().split('T')[0]
    });

    document.getElementById('weightInput').value = '';
    showToast('体重已记录！');
    await refreshDashboard();
  });

  // Goal form
  document.getElementById('goalForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const type = document.getElementById('goalType').value;
    const target = parseInt(document.getElementById('goalTarget').value);
    const deadline = document.getElementById('goalDeadline').value;

    if (!target || !deadline) {
      showToast('请填写完整目标信息', 'error');
      return;
    }

    await addGoal({ type, target, deadline });
    e.target.reset();
    showToast('目标已设定！');
    await refreshGoals();
  });

  // Filter
  document.getElementById('applyFilter').addEventListener('click', async () => {
    const workouts = await DB.getAll('workouts');
    renderWorkoutHistory(workouts);
  });

  // Share modal
  document.getElementById('closeShareModal').addEventListener('click', () => {
    document.getElementById('shareModal').classList.remove('open');
  });

  document.getElementById('shareModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      e.currentTarget.classList.remove('open');
    }
  });

  document.getElementById('downloadShareCard').addEventListener('click', downloadShareCard);

  // Set goal deadline min date
  const deadlineInput = document.getElementById('goalDeadline');
  deadlineInput.min = new Date().toISOString().split('T')[0];
}

// ===== PWA Install =====
function initPWA() {
  // Register Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then(reg => {
      console.log('Service Worker registered');
    }).catch(err => {
      console.log('Service Worker failed:', err);
    });
  }

  // Install prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallBanner();
  });
}

function showInstallBanner() {
  const existing = document.querySelector('.install-banner');
  if (existing) return;

  const banner = document.createElement('div');
  banner.className = 'install-banner';
  banner.innerHTML = `
    <p>📲 将 FitTrack 安装到您的设备</p>
    <button class="btn btn-primary btn-sm" id="installBtn">安装</button>
    <button class="install-dismiss" id="installDismiss">&times;</button>
  `;
  document.body.appendChild(banner);

  banner.querySelector('#installBtn').addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
    }
    banner.remove();
  });

  banner.querySelector('#installDismiss').addEventListener('click', () => {
    banner.remove();
  });
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', async () => {
  initNav();
  initEventListeners();
  initPWA();
  initPedometer();
  await refreshDashboard();
});
