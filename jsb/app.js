// ===== 健身追踪仪表盘 - 主应用逻辑 =====

(function () {
  'use strict';

  // ===== Data Store =====
  const Store = {
    get(key, fallback = null) {
      try {
        const data = localStorage.getItem('fitness_' + key);
        return data ? JSON.parse(data) : fallback;
      } catch (e) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem('fitness_' + key, JSON.stringify(value));
      } catch (e) {
        console.warn('Storage full or unavailable:', e);
      }
    }
  };

  // Initialize data
  if (!Store.get('workouts')) Store.set('workouts', []);
  if (!Store.get('weights')) Store.set('weights', []);
  if (!Store.get('goals')) Store.set('goals', []);
  if (!Store.get('settings')) Store.set('settings', { stepsGoal: 10000 });

  // ===== Type Configuration =====
  const TYPE_CONFIG = {
    running: { name: '跑步', icon: '🏃', color: '#22c55e', caloriesPerMin: 10 },
    cycling: { name: '骑行', icon: '🚴', color: '#3b82f6', caloriesPerMin: 8 },
    weightlifting: { name: '举重', icon: '🏋️', color: '#f59e0b', caloriesPerMin: 6 },
    swimming: { name: '游泳', icon: '🏊', color: '#06b6d4', caloriesPerMin: 9 },
    yoga: { name: '瑜伽', icon: '🧘', color: '#ec4899', caloriesPerMin: 3 },
    other: { name: '其他', icon: '💪', color: '#94a3b8', caloriesPerMin: 5 }
  };

  const GOAL_TYPE_CONFIG = {
    weekly_workouts: { name: '每周锻炼次数', unit: '次' },
    weekly_duration: { name: '每周锻炼时长', unit: '分钟' },
    monthly_distance: { name: '每月运动距离', unit: '公里' },
    weight_loss: { name: '目标体重', unit: 'kg', direction: 'down' },
    weight_gain: { name: '增重目标', unit: 'kg', direction: 'up' },
    total_workouts: { name: '总锻炼次数', unit: '次' },
    streak: { name: '连续锻炼天数', unit: '天' }
  };

  // ===== DOM Elements =====
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // ===== Utility Functions =====
  function formatDate(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function formatDateDisplay(date) {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (formatDate(d) === formatDate(today)) return '今天';
    if (formatDate(d) === formatDate(yesterday)) return '昨天';
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  }

  function formatDuration(minutes) {
    if (minutes < 60) return `${minutes}分钟`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}小时${m}分钟` : `${h}小时`;
  }

  function showToast(message, type = 'info') {
    const toast = $('#toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 2500);
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  // ===== Tab Navigation =====
  function initTabs() {
    $$('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        $$('.tab').forEach(t => t.classList.remove('active'));
        $$('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        $(`#tab-${tab.dataset.tab}`).classList.add('active');

        // Refresh data on tab switch
        if (tab.dataset.tab === 'dashboard') refreshDashboard();
        if (tab.dataset.tab === 'history') renderHistory();
        if (tab.dataset.tab === 'goals') renderGoals();
      });
    });
  }

  // ===== Modal =====
  function openModal(id) {
    $(`#${id}`).classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(id) {
    $(`#${id}`).classList.remove('show');
    document.body.style.overflow = '';
  }

  function initModals() {
    $$('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => closeModal(btn.dataset.close));
    });
    $$('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal(overlay.id);
      });
    });
  }

  // ===== Workout Form =====
  let selectedType = 'running';

  function initWorkoutForm() {
    // Set default date
    $('#workoutDate').value = formatDate(new Date());

    // Type selector
    $$('.type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedType = btn.dataset.type;
        toggleDynamicFields(selectedType);
      });
    });

    // Auto calculate pace
    $('#workoutDuration').addEventListener('input', autoCalculatePace);
    $('#workoutDistance').addEventListener('input', autoCalculatePace);

    // Form submit
    $('#workoutForm').addEventListener('submit', handleWorkoutSubmit);

    // Quick records
    $$('.quick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        const duration = parseInt(btn.dataset.duration);
        const distance = btn.dataset.distance ? parseFloat(btn.dataset.distance) : null;
        const weight = btn.dataset.weight ? parseFloat(btn.dataset.weight) : null;

        // Set type
        $$('.type-btn').forEach(b => b.classList.remove('active'));
        $(`.type-btn[data-type="${type}"]`).classList.add('active');
        selectedType = type;
        toggleDynamicFields(type);

        // Fill form
        $('#workoutDuration').value = duration;
        if (distance) $('#workoutDistance').value = distance;
        if (weight) $('#workoutWeight').value = weight;
        $('#workoutDate').value = formatDate(new Date());

        // Auto submit
        const workout = {
          id: generateId(),
          type,
          duration,
          date: $('#workoutDate').value,
          distance: distance || null,
          weight: weight || null,
          calories: estimateCalories(type, duration, distance, weight),
          notes: '',
          createdAt: new Date().toISOString()
        };

        saveWorkout(workout);
        resetWorkoutForm();
        showToast(`${TYPE_CONFIG[type].name}记录已保存！`, 'success');
      });
    });

    // Add weight button
    $('#addWeightBtn').addEventListener('click', () => {
      $('#weightDate').value = formatDate(new Date());
      openModal('weightModal');
    });

    // Weight form
    $('#weightForm').addEventListener('submit', handleWeightSubmit);

    // Volume period selector
    $('#volumePeriod').addEventListener('change', () => updateVolumeChart());
  }

  function toggleDynamicFields(type) {
    const cardioFields = $('#fields-cardio');
    const weightFields = $('#fields-weights');

    if (type === 'running' || type === 'cycling' || type === 'swimming') {
      cardioFields.style.display = 'grid';
      weightFields.style.display = 'none';
    } else if (type === 'weightlifting') {
      cardioFields.style.display = 'none';
      weightFields.style.display = 'grid';
    } else {
      cardioFields.style.display = 'none';
      weightFields.style.display = 'none';
    }
  }

  function autoCalculatePace() {
    const duration = parseFloat($('#workoutDuration').value) || 0;
    const distance = parseFloat($('#workoutDistance').value) || 0;
    if (duration > 0 && distance > 0) {
      const pace = (duration / distance).toFixed(1);
      $('#workoutPace').value = pace;
    }
  }

  function estimateCalories(type, duration, distance, weight) {
    const manual = parseInt($('#workoutCalories').value);
    if (manual && manual > 0) return manual;
    const config = TYPE_CONFIG[type];
    let base = duration * config.caloriesPerMin;
    if (distance && (type === 'running' || type === 'cycling')) {
      base += distance * (type === 'running' ? 60 : 30);
    }
    if (weight && type === 'weightlifting') {
      base += weight * 0.5;
    }
    return Math.round(base);
  }

  function handleWorkoutSubmit(e) {
    e.preventDefault();

    const distance = parseFloat($('#workoutDistance').value) || null;
    const weight = parseFloat($('#workoutWeight').value) || null;

    const workout = {
      id: generateId(),
      type: selectedType,
      duration: parseInt($('#workoutDuration').value),
      date: $('#workoutDate').value,
      distance,
      weight,
      sets: parseInt($('#workoutSets').value) || null,
      calories: estimateCalories(selectedType, parseInt($('#workoutDuration').value), distance, weight),
      notes: $('#workoutNotes').value.trim(),
      createdAt: new Date().toISOString()
    };

    saveWorkout(workout);
    resetWorkoutForm();
    showToast(`${TYPE_CONFIG[selectedType].name}记录已保存！`, 'success');
  }

  function saveWorkout(workout) {
    const workouts = Store.get('workouts', []);
    workouts.push(workout);
    Store.set('workouts', workouts);
  }

  function resetWorkoutForm() {
    $('#workoutForm').reset();
    $('#workoutDate').value = formatDate(new Date());
    $$('.type-btn').forEach(b => b.classList.remove('active'));
    $('.type-btn[data-type="running"]').classList.add('active');
    selectedType = 'running';
    toggleDynamicFields('running');
  }

  function handleWeightSubmit(e) {
    e.preventDefault();
    const weight = {
      id: generateId(),
      value: parseFloat($('#weightValue').value),
      date: $('#weightDate').value,
      note: $('#weightNote').value.trim(),
      createdAt: new Date().toISOString()
    };

    const weights = Store.get('weights', []);
    weights.push(weight);
    Store.set('weights', weights);

    closeModal('weightModal');
    $('#weightForm').reset();
    showToast('体重记录已保存！', 'success');
    updateWeightChart();
  }

  // ===== Dashboard =====
  let weightChart = null;
  let volumeChart = null;

  function refreshDashboard() {
    updateStats();
    updateWeightChart();
    updateVolumeChart();
    renderGoalsPreview();
  }

  function updateStats() {
    const workouts = Store.get('workouts', []);
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const totalWorkouts = workouts.length;
    const totalDuration = workouts.reduce((sum, w) => sum + (w.duration || 0), 0);
    const totalCalories = workouts.reduce((sum, w) => sum + (w.calories || 0), 0);
    const thisWeekWorkouts = workouts.filter(w => new Date(w.date) >= weekStart).length;

    animateValue($('#totalWorkouts'), totalWorkouts);
    animateValue($('#totalDuration'), totalDuration);
    animateValue($('#totalCalories'), totalCalories);
    animateValue($('#thisWeekWorkouts'), thisWeekWorkouts);
  }

  function animateValue(el, target) {
    const current = parseInt(el.textContent) || 0;
    if (current === target) return;
    const diff = target - current;
    const steps = 20;
    const stepValue = diff / steps;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      el.textContent = Math.round(current + stepValue * step);
      if (step >= steps) {
        el.textContent = target;
        clearInterval(interval);
      }
    }, 25);
  }

  // ===== Weight Chart =====
  function updateWeightChart() {
    const weights = Store.get('weights', []).sort((a, b) => new Date(a.date) - new Date(b.date));
    const canvas = $('#weightChart');
    const ctx = canvas.getContext('2d');

    if (weights.length === 0) {
      canvas.parentElement.innerHTML = '<p class="empty-state" style="padding:40px;">暂无体重数据，点击"记录体重"开始追踪</p>';
      if (weightChart) { weightChart.destroy(); weightChart = null; }
      return;
    }

    // Restore canvas if it was replaced
    if (!canvas.isConnected) {
      const container = canvas.parentElement;
      container.innerHTML = '<canvas id="weightChart"></canvas>';
    }

    const newCanvas = $('#weightChart');
    const newCtx = newCanvas.getContext('2d');

    const labels = weights.map(w => {
      const d = new Date(w.date);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    });
    const data = weights.map(w => w.value);

    if (weightChart) weightChart.destroy();

    weightChart = new Chart(newCtx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: '体重 (kg)',
          data,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          borderWidth: 2.5,
          fill: true,
          tension: 0.3,
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
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#f1f5f9',
            bodyColor: '#94a3b8',
            borderColor: '#334155',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: (ctx) => `${ctx.parsed.y} kg`
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(51, 65, 85, 0.3)' },
            ticks: { color: '#64748b', font: { size: 11 } }
          },
          y: {
            grid: { color: 'rgba(51, 65, 85, 0.3)' },
            ticks: { color: '#64748b', font: { size: 11 } }
          }
        }
      }
    });
  }

  // ===== Volume Chart =====
  function updateVolumeChart() {
    const workouts = Store.get('workouts', []);
    const period = $('#volumePeriod')?.value || 'week';
    const canvas = $('#volumeChart');
    const ctx = canvas.getContext('2d');

    if (workouts.length === 0) {
      canvas.parentElement.innerHTML = '<p class="empty-state" style="padding:40px;">暂无锻炼数据</p>';
      if (volumeChart) { volumeChart.destroy(); volumeChart = null; }
      return;
    }

    // Restore canvas
    if (!canvas.isConnected) {
      const container = canvas.parentElement;
      container.innerHTML = '<canvas id="volumeChart"></canvas>';
    }

    const newCanvas = $('#volumeChart');
    const newCtx = newCanvas.getContext('2d');

    let labels, data;

    if (period === 'week') {
      const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      labels = days;
      const now = new Date();
      data = days.map((_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - d.getDay() + i);
        const dateStr = formatDate(d);
        return workouts.filter(w => w.date === dateStr).reduce((sum, w) => sum + w.duration, 0);
      });
    } else if (period === 'month') {
      labels = [];
      data = [];
      const now = new Date();
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        labels.push(`${d.getMonth() + 1}/${d.getDate()}`);
        const dateStr = formatDate(d);
        data.push(workouts.filter(w => w.date === dateStr).reduce((sum, w) => sum + w.duration, 0));
      }
    } else {
      labels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
      const year = new Date().getFullYear();
      data = labels.map((_, i) =>
        workouts.filter(w => {
          const d = new Date(w.date);
          return d.getFullYear() === year && d.getMonth() === i;
        }).reduce((sum, w) => sum + w.duration, 0)
      );
    }

    if (volumeChart) volumeChart.destroy();

    const barColors = data.map(v => v > 0 ? 'rgba(99, 102, 241, 0.7)' : 'rgba(99, 102, 241, 0.2)');
    const borderColors = data.map(v => v > 0 ? '#6366f1' : 'rgba(99, 102, 241, 0.3)');

    volumeChart = new Chart(newCtx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: '锻炼时长 (分钟)',
          data,
          backgroundColor: barColors,
          borderColor: borderColors,
          borderWidth: 1,
          borderRadius: 4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#f1f5f9',
            bodyColor: '#94a3b8',
            borderColor: '#334155',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: (ctx) => `${ctx.parsed.y} 分钟`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#64748b', font: { size: 10 } }
          },
          y: {
            grid: { color: 'rgba(51, 65, 85, 0.3)' },
            ticks: { color: '#64748b', font: { size: 11 } },
            beginAtZero: true
          }
        }
      }
    });
  }

  // ===== Goals =====
  function renderGoalsPreview() {
    const goals = Store.get('goals', []).filter(g => !g.completed && !g.expired);
    const container = $('#goalsPreview');

    if (goals.length === 0) {
      container.innerHTML = '<p class="empty-state">暂无目标，去"目标"页面设定吧</p>';
      return;
    }

    container.innerHTML = goals.slice(0, 3).map(goal => {
      const progress = calculateGoalProgress(goal);
      const pct = Math.min(100, Math.round((progress.current / goal.value) * 100));
      return `
        <div class="goal-item">
          <div class="goal-header">
            <span class="goal-name">${goal.name || GOAL_TYPE_CONFIG[goal.type]?.name || goal.type}</span>
            <span class="goal-type-badge">${pct}%</span>
          </div>
          <div class="goal-progress-bar">
            <div class="goal-progress-fill" style="width: ${pct}%"></div>
          </div>
          <div class="goal-meta">
            <span>${progress.current} / ${goal.value} ${GOAL_TYPE_CONFIG[goal.type]?.unit || ''}</span>
            <span>${formatDateDisplay(goal.deadline)} 截止</span>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderGoals() {
    const goals = Store.get('goals', []);
    const active = goals.filter(g => !g.completed && !g.expired);
    const completed = goals.filter(g => g.completed);
    const expired = goals.filter(g => g.expired && !g.completed);

    // Check for expired goals
    const today = formatDate(new Date());
    goals.forEach(g => {
      if (!g.completed && g.deadline < today && !g.expired) {
        g.expired = true;
      }
    });
    Store.set('goals', goals);

    // Active goals
    const activeContainer = $('#activeGoals');
    if (active.length === 0) {
      activeContainer.innerHTML = '<p class="empty-state">暂无进行中的目标</p>';
    } else {
      activeContainer.innerHTML = active.map(goal => renderGoalItem(goal)).join('');
    }

    // Completed goals
    const completedContainer = $('#completedGoals');
    const allCompleted = [...completed, ...expired];
    if (allCompleted.length === 0) {
      completedContainer.innerHTML = '<p class="empty-state">暂无已完成的目标</p>';
    } else {
      completedContainer.innerHTML = allCompleted.map(goal => renderGoalItem(goal, true)).join('');
    }

    // Bind delete buttons
    $$('.goal-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const goals = Store.get('goals', []);
        const filtered = goals.filter(g => g.id !== btn.dataset.id);
        Store.set('goals', filtered);
        renderGoals();
        showToast('目标已删除', 'info');
      });
    });
  }

  function renderGoalItem(goal, showMilestones = false) {
    const progress = calculateGoalProgress(goal);
    const pct = Math.min(100, Math.round((progress.current / goal.value) * 100));
    const isCompleted = goal.completed || pct >= 100;
    const config = GOAL_TYPE_CONFIG[goal.type] || { name: goal.type, unit: '' };

    let milestonesHTML = '';
    if (showMilestones && !goal.completed) {
      milestonesHTML = renderMilestones(goal, progress.current);
    }

    return `
      <div class="goal-item ${isCompleted ? 'completed' : ''} ${goal.expired ? 'expired' : ''}">
        <div class="goal-header">
          <span class="goal-name">${goal.name || config.name}</span>
          <span class="goal-type-badge">${isCompleted ? '已完成' : pct + '%'}</span>
        </div>
        <div class="goal-progress-bar">
          <div class="goal-progress-fill" style="width: ${pct}%"></div>
        </div>
        <div class="goal-meta">
          <span>${progress.current} / ${goal.value} ${config.unit}</span>
          <span>${formatDateDisplay(goal.deadline)} ${goal.expired ? '(已过期)' : ''}</span>
        </div>
        ${milestonesHTML}
        <div class="goal-actions">
          <button class="goal-delete-btn" data-id="${goal.id}">删除</button>
        </div>
      </div>
    `;
  }

  function renderMilestones(goal, current) {
    const milestones = [];
    const count = Math.min(5, Math.max(3, Math.ceil(goal.value / 5)));
    const step = goal.value / count;

    for (let i = 1; i <= count; i++) {
      const milestoneValue = Math.round(step * i);
      const achieved = current >= milestoneValue;
      const isCurrent = !achieved && (i === 1 || current >= Math.round(step * (i - 1)));

      milestones.push(`
        <div class="milestone">
          <div class="milestone-marker ${achieved ? 'achieved' : ''} ${isCurrent ? 'current' : ''}">
            ${achieved ? '✓' : i}
          </div>
          <span class="milestone-label ${achieved ? 'achieved' : ''}">${milestoneValue} ${GOAL_TYPE_CONFIG[goal.type]?.unit || ''}</span>
        </div>
      `);
    }

    return `<div class="goal-milestones">${milestones.join('')}</div>`;
  }

  function calculateGoalProgress(goal) {
    const workouts = Store.get('workouts', []);
    const weights = Store.get('weights', []);
    const now = new Date();
    let current = 0;

    switch (goal.type) {
      case 'weekly_workouts': {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        current = workouts.filter(w => new Date(w.date) >= weekStart).length;
        break;
      }
      case 'weekly_duration': {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        current = workouts.filter(w => new Date(w.date) >= weekStart).reduce((s, w) => s + w.duration, 0);
        break;
      }
      case 'monthly_distance': {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        current = workouts
          .filter(w => new Date(w.date) >= monthStart)
          .reduce((s, w) => s + (w.distance || 0), 0);
        break;
      }
      case 'weight_loss':
      case 'weight_gain': {
        if (weights.length > 0) {
          const latest = weights[weights.length - 1].value;
          if (goal.type === 'weight_loss') {
            // For weight loss, "current" is how much lost from the earliest
            const earliest = weights[0].value;
            current = Math.max(0, earliest - latest);
          } else {
            current = latest;
          }
        }
        break;
      }
      case 'total_workouts':
        current = workouts.length;
        break;
      case 'streak': {
        current = calculateStreak(workouts);
        break;
      }
    }

    return { current, goal };
  }

  function calculateStreak(workouts) {
    if (workouts.length === 0) return 0;
    const dates = [...new Set(workouts.map(w => w.date))].sort().reverse();
    if (dates.length === 0) return 0;

    let streak = 0;
    let checkDate = new Date();
    const today = formatDate(checkDate);

    // Check if there's a workout today or yesterday
    if (dates[0] !== today) {
      checkDate.setDate(checkDate.getDate() - 1);
      if (dates[0] !== formatDate(checkDate)) return 0;
    }

    streak = 1;
    while (true) {
      checkDate.setDate(checkDate.getDate() - 1);
      const dateStr = formatDate(checkDate);
      if (dates.includes(dateStr)) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  // Goal form
  function initGoalForm() {
    const deadlineDefault = new Date();
    deadlineDefault.setMonth(deadlineDefault.getMonth() + 1);
    $('#goalDeadline').value = formatDate(deadlineDefault);

    $('#goalForm').addEventListener('submit', (e) => {
      e.preventDefault();

      const goal = {
        id: generateId(),
        type: $('#goalType').value,
        value: parseFloat($('#goalValue').value),
        deadline: $('#goalDeadline').value,
        name: $('#goalName').value.trim() || GOAL_TYPE_CONFIG[$('#goalType').value]?.name || '目标',
        completed: false,
        expired: false,
        createdAt: new Date().toISOString()
      };

      const goals = Store.get('goals', []);
      goals.push(goal);
      Store.set('goals', goals);

      $('#goalForm').reset();
      const newDeadline = new Date();
      newDeadline.setMonth(newDeadline.getMonth() + 1);
      $('#goalDeadline').value = formatDate(newDeadline);

      showToast('目标已创建！', 'success');
      renderGoals();
    });
  }

  // ===== History =====
  function renderHistory() {
    const workouts = Store.get('workouts', []).sort((a, b) => new Date(b.date) - new Date(a.date));
    const typeFilter = $('#historyTypeFilter')?.value || 'all';
    const dateFilter = $('#historyDateFilter')?.value || '';

    let filtered = workouts;
    if (typeFilter !== 'all') {
      filtered = filtered.filter(w => w.type === typeFilter);
    }
    if (dateFilter) {
      filtered = filtered.filter(w => w.date === dateFilter);
    }

    const container = $('#historyList');
    if (filtered.length === 0) {
      container.innerHTML = '<p class="empty-state">暂无锻炼记录</p>';
    } else {
      container.innerHTML = filtered.map(w => {
        const config = TYPE_CONFIG[w.type];
        let detail = `${w.duration}分钟`;
        if (w.distance) detail += ` · ${w.distance}公里`;
        if (w.weight) detail += ` · ${w.weight}kg`;
        if (w.calories) detail += ` · ${w.calories}卡`;

        return `
          <div class="history-item">
            <div class="history-icon type-${w.type}">${config.icon}</div>
            <div class="history-info">
              <div class="history-type">${config.name}${w.notes ? ' - ' + w.notes : ''}</div>
              <div class="history-detail">${detail}</div>
            </div>
            <span class="history-date">${formatDateDisplay(w.date)}</span>
            <button class="history-delete" data-id="${w.id}" title="删除">✕</button>
          </div>
        `;
      }).join('');
    }

    // Bind delete
    $$('.history-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const workouts = Store.get('workouts', []);
        const filtered = workouts.filter(w => w.id !== btn.dataset.id);
        Store.set('workouts', filtered);
        renderHistory();
        showToast('记录已删除', 'info');
      });
    });

    // Weight list
    renderWeightList();
  }

  function renderWeightList() {
    const weights = Store.get('weights', []).sort((a, b) => new Date(b.date) - new Date(a.date));
    const container = $('#weightList');

    if (weights.length === 0) {
      container.innerHTML = '<p class="empty-state">暂无体重记录</p>';
    } else {
      container.innerHTML = weights.map(w => `
        <div class="weight-item">
          <div>
            <span class="weight-value">${w.value} kg</span>
            ${w.note ? `<span style="color:var(--text-muted);font-size:0.8rem;margin-left:8px;">${w.note}</span>` : ''}
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="weight-date">${formatDateDisplay(w.date)}</span>
            <button class="weight-delete" data-id="${w.id}">✕</button>
          </div>
        </div>
      `).join('');
    }

    $$('.weight-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const weights = Store.get('weights', []);
        const filtered = weights.filter(w => w.id !== btn.dataset.id);
        Store.set('weights', filtered);
        renderWeightList();
        updateWeightChart();
        showToast('体重记录已删除', 'info');
      });
    });
  }

  // History filters
  function initHistoryFilters() {
    $('#historyTypeFilter')?.addEventListener('change', renderHistory);
    $('#historyDateFilter')?.addEventListener('change', renderHistory);
  }

  // ===== Share Feature =====
  function initShare() {
    $('#shareBtn').addEventListener('click', () => {
      generateShareCard();
      openModal('shareModal');
    });

    $('#downloadCard').addEventListener('click', downloadShareCard);
    $('#shareNative').addEventListener('click', shareNative);
  }

  function generateShareCard() {
    const workouts = Store.get('workouts', []);
    const totalWorkouts = workouts.length;
    const totalDuration = workouts.reduce((s, w) => s + (w.duration || 0), 0);
    const totalCalories = workouts.reduce((s, w) => s + (w.calories || 0), 0);
    const totalDistance = workouts.reduce((s, w) => s + (w.distance || 0), 0);

    // Update card data
    $('#shareCardDate').textContent = formatDate(new Date());
    $('#shareTotalWorkouts').textContent = totalWorkouts;
    $('#shareTotalDuration').textContent = formatDuration(totalDuration);
    $('#shareTotalCalories').textContent = totalCalories;
    $('#shareTotalDistance').textContent = totalDistance.toFixed(1);

    // Milestones
    const goals = Store.get('goals', []).filter(g => g.completed);
    const milestonesHTML = goals.length > 0
      ? `<div style="font-size:0.85rem;color:rgba(255,255,255,0.7);margin-bottom:8px;">已达成 ${goals.length} 个目标</div>`
      : '';
    $('#shareMilestones').innerHTML = milestonesHTML;

    // Motivational quote
    const quotes = [
      '"坚持就是胜利！"',
      '"每一步都算数！"',
      '"你比你想象的更强大！"',
      '"汗水不会背叛你！"',
      '"今天的努力是明天的收获！"',
      '"强者不息，永不止步！"',
      '"身体是革命的本钱！"'
    ];
    $('#shareQuote').textContent = quotes[Math.floor(Math.random() * quotes.length)];
  }

  async function downloadShareCard() {
    const card = $('#shareCard');

    try {
      // Use html2canvas-like approach with Canvas API
      const canvas = await createCardCanvas(card);
      const link = document.createElement('a');
      link.download = `健身摘要_${formatDate(new Date())}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast('图片已下载！', 'success');
    } catch (err) {
      // Fallback: use Web Share API or copy HTML
      console.warn('Canvas export failed, using fallback:', err);
      const html = card.outerHTML;
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `健身摘要_${formatDate(new Date())}.html`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      showToast('HTML卡片已下载！', 'info');
    }
  }

  async function createCardCanvas(element) {
    // Create a canvas from the share card element
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const scale = 2; // High DPI
      const width = 480;
      const height = 420;
      canvas.width = width * scale;
      canvas.height = height * scale;
      ctx.scale(scale, scale);

      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#1e1b4b');
      bgGrad.addColorStop(0.5, '#312e81');
      bgGrad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = bgGrad;
      roundRect(ctx, 0, 0, width, height, 16);
      ctx.fill();

      // Header
      ctx.fillStyle = 'white';
      ctx.font = 'bold 20px -apple-system, sans-serif';
      ctx.fillText('健身BB', 20, 35);

      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '13px -apple-system, sans-serif';
      ctx.fillText($('#shareCardDate').textContent, width - 120, 35);

      // Divider
      ctx.strokeStyle = 'rgba(99,102,241,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(20, 55);
      ctx.lineTo(width - 20, 55);
      ctx.stroke();

      // Stats grid
      const stats = [
        { label: '总锻炼', value: $('#shareTotalWorkouts').textContent },
        { label: '总时长', value: $('#shareTotalDuration').textContent },
        { label: '卡路里', value: $('#shareTotalCalories').textContent },
        { label: '公里', value: $('#shareTotalDistance').textContent }
      ];

      const statsY = 95;
      const statsH = 80;
      stats.forEach((stat, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = 24 + col * 225;
        const y = statsY + row * (statsH + 12);

        // Stat box background
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        roundRect(ctx, x, y, 205, statsH, 10);
        ctx.fill();

        // Value
        ctx.fillStyle = 'white';
        ctx.font = 'bold 26px -apple-system, sans-serif';
        ctx.fillText(stat.value, x + 14, y + 35);

        // Label
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '13px -apple-system, sans-serif';
        ctx.fillText(stat.label, x + 14, y + 60);
      });

      // Quote
      const quoteY = 295;
      ctx.fillStyle = 'rgba(99,102,241,0.15)';
      roundRect(ctx, 20, quoteY, width - 40, 50, 10);
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = 'italic 15px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText($('#shareQuote').textContent, width / 2, quoteY + 32);
      ctx.textAlign = 'left';

      // Footer
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '11px -apple-system, sans-serif';
      ctx.fillText('由 健身BB 生成', 20, height - 20);

      resolve(canvas);
    });
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  async function shareNative() {
    const workouts = Store.get('workouts', []);
    const totalWorkouts = workouts.length;
    const totalDuration = workouts.reduce((s, w) => s + (w.duration || 0), 0);
    const totalCalories = workouts.reduce((s, w) => s + (w.calories || 0), 0);
    const totalDistance = workouts.reduce((s, w) => s + (w.distance || 0), 0);

    const text = `🏋️ 我的健身摘要

📊 总锻炼: ${totalWorkouts} 次
⏱️ 总时长: ${formatDuration(totalDuration)}
🔥 消耗卡路里: ${totalCalories} kcal
📏 运动距离: ${totalDistance.toFixed(1)} km

${$('#shareQuote').textContent}

—— 由 健身BB 生成`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: '我的健身摘要 - 健身BB',
          text: text
        });
      } catch (e) {
        // User cancelled or share failed
        if (e.name !== 'AbortError') {
          // Fallback to clipboard
          await navigator.clipboard.writeText(text);
          showToast('已复制到剪贴板！', 'success');
        }
      }
    } else {
      await navigator.clipboard.writeText(text);
      showToast('已复制到剪贴板！', 'success');
    }
  }

  // ===== Pedometer API =====
  let pedometer = null;
  let stepCount = 0;

  function initPedometer() {
    const statusEl = $('#pedometerStatus');
    const countEl = $('#stepsCount');
    const progressEl = $('#stepsProgress');
    const goalInput = $('#stepsGoal');

    // Load saved goal
    const settings = Store.get('settings', {});
    if (settings.stepsGoal) goalInput.value = settings.stepsGoal;

    goalInput.addEventListener('change', () => {
      const settings = Store.get('settings', {});
      settings.stepsGoal = parseInt(goalInput.value) || 10000;
      Store.set('settings', settings);
      updateStepsProgress();
    });

    // Check for Pedometer API (Web Walking / Generic Sensor API)
    if ('Pedometer' in window) {
      initWebPedometer();
    } else if ('Sensor' in window && 'onreading' in window.Sensor.prototype) {
      // Generic Sensor API - check for pedometer
      try {
        pedometer = new Pedometer();
        pedometer.addEventListener('reading', () => {
          stepCount = pedometer.steps;
          updateStepsDisplay();
        });
        pedometer.addEventListener('error', (e) => {
          console.warn('Pedometer error:', e);
          showPedometerUnavailable();
        });
        pedometer.start();
        statusEl.textContent = '运行中';
        statusEl.style.color = 'var(--success)';
      } catch (e) {
        showPedometerUnavailable();
      }
    } else {
      // Check for Apple's Motion API / DeviceMotion API as fallback
      initMotionFallback();
    }
  }

  function initWebPedometer() {
    const statusEl = $('#pedometerStatus');
    try {
      const ped = new Pedometer();
      ped.addEventListener('reading', () => {
        stepCount = ped.steps || 0;
        updateStepsDisplay();
      });
      ped.start();
      statusEl.textContent = '运行中';
      statusEl.style.color = 'var(--success)';
    } catch (e) {
      showPedometerUnavailable();
    }
  }

  function initMotionFallback() {
    const statusEl = $('#pedometerStatus');

    // Try DeviceMotionEvent for step estimation
    if (typeof DeviceMotionEvent !== 'undefined') {
      // Check permission
      if (typeof DeviceMotionEvent.requestPermission === 'function') {
        // iOS 13+ requires permission
        statusEl.textContent = '点击启用';
        statusEl.style.cursor = 'pointer';
        statusEl.addEventListener('click', async () => {
          try {
            const permission = await DeviceMotionEvent.requestPermission();
            if (permission === 'granted') {
              startMotionTracking();
            } else {
              showPedometerUnavailable();
            }
          } catch (e) {
            showPedometerUnavailable();
          }
        }, { once: true });
      } else {
        // Try to start motion tracking directly
        startMotionTracking();
      }
    } else {
      showPedometerUnavailable();
    }
  }

  let motionSteps = 0;
  let lastAccel = null;
  let stepThreshold = 12;
  let motionListener = null;

  function startMotionTracking() {
    const statusEl = $('#pedometerStatus');
    statusEl.textContent = '运动追踪中';
    statusEl.style.color = 'var(--warning)';

    // Load saved steps for today
    const today = formatDate(new Date());
    const savedSteps = Store.get('steps_' + today, 0);
    motionSteps = savedSteps;

    motionListener = (event) => {
      if (!event.accelerationIncludingGravity) return;
      const acc = event.accelerationIncludingGravity;
      const magnitude = Math.sqrt(
        (acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2
      );

      if (lastAccel !== null) {
        const delta = Math.abs(magnitude - lastAccel);
        if (delta > stepThreshold) {
          motionSteps++;
          updateStepsDisplay();
          // Save periodically
          Store.set('steps_' + today, motionSteps);
        }
      }
      lastAccel = magnitude;
    };

    window.addEventListener('devicemotion', motionListener);
  }

  function showPedometerUnavailable() {
    const statusEl = $('#pedometerStatus');
    statusEl.textContent = '手动输入';
    statusEl.style.color = 'var(--text-muted)';

    // Show manual input
    const countEl = $('#stepsCount');
    countEl.style.cursor = 'pointer';
    countEl.title = '点击输入步数';
    countEl.addEventListener('click', () => {
      const input = prompt('请输入今日步数:', motionSteps || stepCount || '0');
      if (input !== null && !isNaN(input)) {
        stepCount = parseInt(input) || 0;
        motionSteps = stepCount;
        Store.set('steps_' + formatDate(new Date()), stepCount);
        updateStepsDisplay();
      }
    });
  }

  function updateStepsDisplay() {
    const countEl = $('#stepsCount');
    countEl.textContent = stepCount || motionSteps || 0;
    updateStepsProgress();
  }

  function updateStepsProgress() {
    const progressEl = $('#stepsProgress');
    const goal = parseInt($('#stepsGoal')?.value) || 10000;
    const current = stepCount || motionSteps || 0;
    const circumference = 339.292; // 2 * PI * 54
    const progress = Math.min(current / goal, 1);
    const offset = circumference * (1 - progress);
    progressEl.style.strokeDashoffset = offset;
  }

  // ===== PWA Install =====
  let deferredPrompt = null;

  function initPWA() {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js')
        .then(reg => console.log('SW registered:', reg.scope))
        .catch(err => console.warn('SW registration failed:', err));
    }

    // Install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      $('#installBtn').style.display = 'flex';
    });

    $('#installBtn').addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        $('#installBtn').style.display = 'none';
        showToast('应用已安装！', 'success');
      }
      deferredPrompt = null;
    });

    // Handle installed
    window.addEventListener('appinstalled', () => {
      $('#installBtn').style.display = 'none';
    });
  }

  // ===== Initialize App =====
  function init() {
    initTabs();
    initModals();
    initWorkoutForm();
    initGoalForm();
    initHistoryFilters();
    initShare();
    initPedometer();
    initPWA();

    // Initial render
    refreshDashboard();

    console.log('健身追踪仪表盘 已启动 🏋️');
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
