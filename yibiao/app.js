/* ============================================================
   实时车辆追踪仪表盘 - 主应用
   ============================================================ */

// ============================================================
// 全局状态
// ============================================================
const SPEED_LIMIT = 120; // 超速阈值 km/h
const MAX_CHART_POINTS = 60; // 图表最大数据点数
const CHART_UPDATE_INTERVAL = 3; // 每3秒采样图表数据

let ws = null;
let reconnectTimer = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY = 10000;

let vehicles = {};       // vehicleId -> { marker, data, trail, ... }
let vehicleColors = {};  // vehicleId -> color
let vehicleNames = {};   // vehicleId -> name
let vehicleRoutesData = {};// vehicleId -> [{lat,lng}]
let selectedVehicleId = null;
let followMode = false;
let showRoutes = false;
let routePolylines = {};

// 速度历史数据 (图表用)
const speedHistory = {};  // vehicleId -> [{time, speed}]
const distanceHistory = {}; // vehicleId -> [{time, distance}]
let overspeedCount = 0;

// 警报
const alerts = [];
const MAX_ALERTS = 50;
let alertIdCounter = 0;

// 历史回放
let playbackData = [];
let playbackIndex = 0;
let playbackTimer = null;
let playbackPolyline = null;
let playbackMarker = null;

// ============================================================
// 地图初始化
// ============================================================
const map = L.map('map', {
  center: [39.9042, 116.4074],
  zoom: 14,
  zoomControl: true,
});

// 使用 OpenStreetMap 暗色主题
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
  maxZoom: 19,
}).addTo(map);

// ============================================================
// 图表初始化
// ============================================================
const chartTextColor = '#8899aa';
const chartGridColor = 'rgba(42,58,74,0.5)';

const speedChart = new Chart(document.getElementById('speed-chart'), {
  type: 'line',
  data: {
    labels: [],
    datasets: [],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: true, labels: { color: chartTextColor, font: { size: 11 }, boxWidth: 12 } },
    },
    scales: {
      x: {
        ticks: { color: chartTextColor, maxTicksLimit: 8, font: { size: 10 } },
        grid: { color: chartGridColor },
      },
      y: {
        min: 0,
        max: 160,
        ticks: { color: chartTextColor, font: { size: 10 } },
        grid: { color: chartGridColor },
      },
    },
  },
});

const distanceChart = new Chart(document.getElementById('distance-chart'), {
  type: 'bar',
  data: {
    labels: [],
    datasets: [{
      label: '累计里程 (km)',
      data: [],
      backgroundColor: [],
      borderRadius: 4,
      barThickness: 30,
    }],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        ticks: { color: chartTextColor, font: { size: 10 } },
        grid: { display: false },
      },
      y: {
        ticks: { color: chartTextColor, font: { size: 10 } },
        grid: { color: chartGridColor },
      },
    },
  },
});

// ============================================================
// WebSocket 连接
// ============================================================
function connectWS() {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${location.host}`;

  updateStatus('connecting');

  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log('WebSocket 已连接');
    reconnectAttempts = 0;
    updateStatus('connected');
  };

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    handleMessage(msg);
  };

  ws.onclose = () => {
    console.log('WebSocket 已断开');
    updateStatus('disconnected');
    scheduleReconnect();
  };

  ws.onerror = (err) => {
    console.error('WebSocket 错误:', err);
    ws.close();
  };
}

function scheduleReconnect() {
  if (reconnectTimer) return;

  const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY);
  reconnectAttempts++;

  console.log(`${(delay / 1000).toFixed(1)}s 后尝试重连 (第 ${reconnectAttempts} 次)`);
  updateStatus('connecting');

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectWS();
  }, delay);
}

function updateStatus(state) {
  const el = document.getElementById('ws-status');
  el.className = `status-badge status-${state}`;
  const labels = { connected: '已连接', connecting: '重连中...', disconnected: '已断开' };
  el.innerHTML = `<span class="status-dot"></span>${labels[state] || state}`;
}

// ============================================================
// 消息处理
// ============================================================
let chartSampleCounter = 0;

function handleMessage(msg) {
  switch (msg.type) {
    case 'init':
      handleInit(msg);
      break;
    case 'update':
      handleUpdate(msg);
      break;
    case 'playback-data':
      handlePlaybackData(msg);
      break;
  }

  chartSampleCounter++;
  if (chartSampleCounter % CHART_UPDATE_INTERVAL === 0) {
    updateCharts();
  }
}

function handleInit(msg) {
  // 初始化车辆
  Object.keys(msg.routes).forEach((id) => {
    vehicleColors[id] = msg.routes[id].color;
    vehicleNames[id] = msg.routes[id].name;
    vehicleRoutesData[id] = msg.routes[id].route;
    speedHistory[id] = [];
    distanceHistory[id] = [];

    // 预绘制路线
    const routeCoords = msg.routes[id].route.map((p) => [p.lat, p.lng]);
    const routeLine = L.polyline(routeCoords, {
      color: msg.routes[id].color,
      weight: 2,
      opacity: 0.3,
      dashArray: '6 4',
    });
    routePolylines[id] = routeLine;
  });

  // 填充车辆列表
  renderVehicleList();
  updatePlaybackVehicleSelect();
}

function handleUpdate(msg) {
  const { vehicleId, vehicleName, color, timestamp, lat, lng, speed, heading, totalDistance, fuel } = msg;

  vehicleColors[vehicleId] = color;
  vehicleNames[vehicleId] = vehicleName || vehicleId;

  // 保存轨迹
  if (!vehicles[vehicleId]) {
    createVehicleMarker(vehicleId, color);
  }

  // 更新标记位置
  const v = vehicles[vehicleId];
  const latlng = L.latLng(lat, lng);
  v.marker.setLatLng(latlng);

  // 旋转标记 (通过 CSS transform)
  const iconEl = v.marker.getElement();
  if (iconEl) {
    iconEl.style.transform = `rotate(${heading}deg)`;
  }

  // 更新速度标签
  const speedEl = iconEl?.querySelector('.vehicle-speed-label');
  if (speedEl) {
    speedEl.textContent = `${speed} km/h`;
    if (speed > SPEED_LIMIT) {
      iconEl.querySelector('.vehicle-marker-icon')?.classList.add('overspeed');
    } else {
      iconEl.querySelector('.vehicle-marker-icon')?.classList.remove('overspeed');
    }
  }

  // 绘制轨迹
  v.trail.addLatLng(latlng);
  if (v.trail.getLatLngs().length > 300) {
    v.trail.spliceLatLngs(0, v.trail.getLatLngs().length - 300);
  }

  // 保存历史
  const now = new Date();
  speedHistory[vehicleId].push({ time: now, speed });
  distanceHistory[vehicleId].push({ time: now, distance: totalDistance });

  // 限制历史长度
  if (speedHistory[vehicleId].length > MAX_CHART_POINTS * 2) {
    speedHistory[vehicleId] = speedHistory[vehicleId].slice(-MAX_CHART_POINTS);
  }

  // 保存最新数据
  v.data = msg;
  v.latlng = latlng;

  // 超速警报
  if (speed > SPEED_LIMIT) {
    overspeedCount++;
    triggerOverspeedAlert(vehicleId, vehicleName, speed);
  }

  // 更新UI
  updateVehicleCard(vehicleId);
  updateStats();

  // 跟随模式
  if (followMode && vehicleId === selectedVehicleId) {
    map.panTo(latlng);
  }
}

function handlePlaybackData(msg) {
  playbackData = msg.records;
  playbackIndex = 0;

  if (playbackData.length > 0) {
    document.getElementById('btn-playback-play').disabled = false;
    document.getElementById('btn-playback-stop').disabled = false;
    document.getElementById('playback-progress-bar').style.display = 'block';
  }
}

// ============================================================
// 车辆标记
// ============================================================
function createVehicleMarker(vehicleId, color) {
  const icon = L.divIcon({
    className: 'vehicle-marker',
    html: `
      <div class="vehicle-marker-icon" style="background:${color};">
        <span class="vehicle-speed-label">0 km/h</span>
        🚗
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

  const marker = L.marker([39.9042, 116.4074], { icon, zIndexOffset: 1000 }).addTo(map);

  // 点击选中
  marker.on('click', () => {
    selectVehicle(vehicleId);
  });

  // 轨迹线
  const trail = L.polyline([], {
    color,
    weight: 3,
    opacity: 0.6,
  }).addTo(map);

  vehicles[vehicleId] = { marker, trail, data: {}, latlng: null };
}

// ============================================================
// 车辆列表 UI
// ============================================================
function renderVehicleList() {
  const container = document.getElementById('vehicle-list');
  container.innerHTML = '';

  const ids = Object.keys(vehicleNames);
  ids.forEach((id) => {
    const card = document.createElement('div');
    card.className = 'vehicle-card';
    card.id = `vcard-${id}`;
    card.addEventListener('click', () => selectVehicle(id));

    card.innerHTML = `
      <div class="vehicle-card-header">
        <span class="vehicle-color-dot" style="background:${vehicleColors[id]}"></span>
        <span class="vehicle-name">${vehicleNames[id]}</span>
        <span class="vehicle-plate">${id}</span>
      </div>
      <div class="vehicle-card-stats">
        <div class="vehicle-stat">
          <span class="vehicle-stat-label">速度</span>
          <span class="vehicle-stat-value speed-value" id="vc-speed-${id}">-- km/h</span>
        </div>
        <div class="vehicle-stat">
          <span class="vehicle-stat-label">里程</span>
          <span class="vehicle-stat-value" id="vc-dist-${id}">-- km</span>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

function updateVehicleCard(vehicleId) {
  const v = vehicles[vehicleId];
  if (!v?.data) return;

  const speedEl = document.getElementById(`vc-speed-${vehicleId}`);
  const distEl = document.getElementById(`vc-dist-${vehicleId}`);

  if (speedEl) {
    speedEl.textContent = `${v.data.speed} km/h`;
    speedEl.className = `vehicle-stat-value speed-value${v.data.speed > SPEED_LIMIT ? ' overspeed' : ''}`;
  }
  if (distEl) {
    distEl.textContent = `${v.data.totalDistance} km`;
  }
}

function selectVehicle(vehicleId) {
  selectedVehicleId = vehicleId;

  // 更新选中样式
  document.querySelectorAll('.vehicle-card').forEach((card) => card.classList.remove('selected'));
  const card = document.getElementById(`vcard-${vehicleId}`);
  if (card) card.classList.add('selected');

  // 显示详情
  showVehicleDetail(vehicleId);

  // 飞到车辆位置
  if (vehicles[vehicleId]?.latlng) {
    map.flyTo(vehicles[vehicleId].latlng, 16, { duration: 0.8 });
  }
}

function showVehicleDetail(vehicleId) {
  const panel = document.getElementById('vehicle-detail');
  const content = document.getElementById('detail-content');
  panel.style.display = 'block';

  const v = vehicles[vehicleId];
  if (!v?.data) {
    content.innerHTML = '<div class="loading-placeholder">等待数据...</div>';
    return;
  }

  const d = v.data;
  content.innerHTML = `
    <div>
      <div class="detail-item-label">车牌号</div>
      <div class="detail-item-value">${vehicleId}</div>
    </div>
    <div>
      <div class="detail-item-label">名称</div>
      <div class="detail-item-value">${vehicleNames[vehicleId]}</div>
    </div>
    <div>
      <div class="detail-item-label">当前速度</div>
      <div class="detail-item-value" style="color:${d.speed > SPEED_LIMIT ? 'var(--accent-red)' : 'var(--accent-green)'}">${d.speed} km/h</div>
    </div>
    <div>
      <div class="detail-item-label">行驶方向</div>
      <div class="detail-item-value">${d.heading}°</div>
    </div>
    <div>
      <div class="detail-item-label">累计里程</div>
      <div class="detail-item-value">${d.totalDistance} km</div>
    </div>
    <div>
      <div class="detail-item-label">燃油</div>
      <div class="detail-item-value">${d.fuel}%</div>
    </div>
    <div>
      <div class="detail-item-label">经度</div>
      <div class="detail-item-value">${d.lng.toFixed(4)}</div>
    </div>
    <div>
      <div class="detail-item-label">纬度</div>
      <div class="detail-item-value">${d.lat.toFixed(4)}</div>
    </div>
  `;
}

// ============================================================
// 统计数据
// ============================================================
function updateStats() {
  const ids = Object.keys(vehicleNames);

  // 总里程 (累加)
  let totalDist = 0;
  let allSpeeds = [];
  let maxSpeed = 0;

  ids.forEach((id) => {
    const d = vehicles[id]?.data;
    if (d) {
      totalDist += d.totalDistance;
      allSpeeds.push(d.speed);
      if (d.speed > maxSpeed) maxSpeed = d.speed;
    }
  });

  const avgSpeed = allSpeeds.length > 0 ? allSpeeds.reduce((a, b) => a + b, 0) / allSpeeds.length : 0;

  document.getElementById('stat-distance').textContent = `${totalDist.toFixed(1)} km`;
  document.getElementById('stat-avg-speed').textContent = `${avgSpeed.toFixed(1)} km/h`;
  document.getElementById('stat-max-speed').textContent = `${maxSpeed.toFixed(1)} km/h`;
  document.getElementById('stat-overspeed').textContent = overspeedCount;

  // 更新详情面板 (如果正在查看)
  if (selectedVehicleId && vehicles[selectedVehicleId]?.data) {
    showVehicleDetail(selectedVehicleId);
  }
}

// ============================================================
// 图表更新
// ============================================================
function updateCharts() {
  const ids = Object.keys(vehicleNames);

  // ---- 速度趋势线图 ----
  // 构建时间标签 (从第一个有数据的车辆中取)
  let timeLabels = [];
  ids.forEach((id) => {
    const hist = speedHistory[id];
    if (hist.length > timeLabels.length) {
      timeLabels = hist.slice(-MAX_CHART_POINTS).map((h) => {
        return h.time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      });
    }
  });

  speedChart.data.labels = timeLabels;
  speedChart.data.datasets = ids.map((id) => {
    const hist = speedHistory[id].slice(-timeLabels.length);
    // 如果数据少则右对齐
    const padded = Array(timeLabels.length - hist.length).fill(null).concat(hist.map((h) => h.speed));
    return {
      label: vehicleNames[id],
      data: padded,
      borderColor: vehicleColors[id],
      backgroundColor: vehicleColors[id] + '22',
      borderWidth: 2,
      tension: 0.3,
      pointRadius: 0,
      fill: false,
    };
  });

  // 超速参考线 (作为 dataset)
  if (timeLabels.length > 0) {
    speedChart.data.datasets.push({
      label: '超速线',
      data: Array(timeLabels.length).fill(SPEED_LIMIT),
      borderColor: '#ff525266',
      borderWidth: 1,
      borderDash: [5, 5],
      pointRadius: 0,
      fill: false,
    });
  }

  speedChart.update('none');

  // ---- 里程柱状图 ----
  distanceChart.data.labels = ids.map((id) => vehicleNames[id]);
  distanceChart.data.datasets[0].data = ids.map((id) => {
    const d = vehicles[id]?.data;
    return d ? d.totalDistance : 0;
  });
  distanceChart.data.datasets[0].backgroundColor = ids.map((id) => vehicleColors[id] + '88');

  distanceChart.update('none');
}

// ============================================================
// 超速警报
// ============================================================
let lastAlertTime = {};

function triggerOverspeedAlert(vehicleId, vehicleName, speed) {
  // 避免同一车辆短时间重复触发
  const now = Date.now();
  if (lastAlertTime[vehicleId] && now - lastAlertTime[vehicleId] < 10000) {
    return;
  }
  lastAlertTime[vehicleId] = now;

  const time = new Date().toLocaleTimeString('zh-CN');

  // 存入警报列表
  const alert = {
    id: ++alertIdCounter,
    type: 'overspeed',
    vehicleId,
    vehicleName,
    speed,
    time,
  };

  alerts.unshift(alert);
  if (alerts.length > MAX_ALERTS) alerts.pop();

  // 更新警报 UI
  renderAlerts();

  // 显示 Toast
  showToast(alert);

  // 浏览器通知
  sendBrowserNotification(`${vehicleName} (${vehicleId}) 超速!`, `当前速度: ${speed} km/h，限速: ${SPEED_LIMIT} km/h`);
}

function renderAlerts() {
  const container = document.getElementById('alerts-list');
  const countEl = document.getElementById('alert-count');

  countEl.textContent = alerts.length;
  countEl.style.display = alerts.length > 0 ? 'inline' : 'none';

  container.innerHTML = alerts.slice(0, 20).map((a) => `
    <div class="alert-item" data-alert-id="${a.id}">
      <div class="alert-time">${a.time}</div>
      <div class="alert-msg">${a.vehicleName} 超速 ${a.speed} km/h</div>
    </div>
  `).join('');
}

function showToast(alert) {
  const container = document.getElementById('alert-toast-container');
  const toast = document.createElement('div');
  toast.className = 'alert-toast';
  toast.innerHTML = `
    <span class="alert-toast-icon">⚠️</span>
    <div class="alert-toast-body">
      <div class="alert-toast-title">超速警报</div>
      <div class="alert-toast-msg">${alert.vehicleName} — ${alert.speed} km/h</div>
    </div>
  `;
  container.appendChild(toast);

  // 5秒后移除
  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

function sendBrowserNotification(title, body) {
  if (!('Notification' in window)) return;

  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }

  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🚗</text></svg>',
        tag: 'vehicle-overspeed',
      });
    } catch {
      // Service Worker 环境需要不同 API
    }
  }
}

// 请求通知权限 (用户首次交互时)
document.addEventListener('click', () => {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}, { once: true });

// ============================================================
// 地图工具栏
// ============================================================
document.getElementById('btn-center-all').addEventListener('click', () => {
  followMode = false;
  const bounds = L.latLngBounds([]);
  Object.values(vehicles).forEach((v) => {
    if (v.latlng) bounds.extend(v.latlng);
  });
  if (bounds.isValid()) {
    map.flyToBounds(bounds, { padding: [50, 50], duration: 0.8 });
  }
});

document.getElementById('btn-follow').addEventListener('click', () => {
  followMode = !followMode;
  document.getElementById('btn-follow').classList.toggle('btn-accent', followMode);

  if (followMode && selectedVehicleId && vehicles[selectedVehicleId]?.latlng) {
    map.flyTo(vehicles[selectedVehicleId].latlng, 17, { duration: 0.5 });
  }
});

document.getElementById('btn-show-routes').addEventListener('click', () => {
  showRoutes = !showRoutes;
  document.getElementById('btn-show-routes').classList.toggle('btn-accent', showRoutes);

  Object.values(routePolylines).forEach((line) => {
    if (showRoutes) {
      line.addTo(map);
    } else {
      map.removeLayer(line);
    }
  });
});

// ============================================================
// 历史回放
// ============================================================
function updatePlaybackVehicleSelect() {
  const select = document.getElementById('playback-vehicle');
  select.innerHTML = '';
  Object.keys(vehicleNames).forEach((id) => {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = `${vehicleNames[id]} (${id})`;
    select.appendChild(opt);
  });
}

document.getElementById('playback-speed').addEventListener('input', (e) => {
  document.getElementById('playback-speed-label').textContent = `${e.target.value}x`;
});

document.getElementById('btn-playback-load').addEventListener('click', () => {
  const vehicleId = document.getElementById('playback-vehicle').value;
  const rangeMin = parseInt(document.getElementById('playback-range').value, 10);
  const endTime = Date.now();
  const startTime = endTime - rangeMin * 60 * 1000;

  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'playback',
      vehicleId,
      startTime,
      endTime,
    }));
  }
});

document.getElementById('btn-playback-play').addEventListener('click', () => {
  if (playbackData.length === 0) return;
  startPlayback();
});

document.getElementById('btn-playback-stop').addEventListener('click', () => {
  stopPlayback();
});

function startPlayback() {
  if (playbackTimer) stopPlayback();

  document.getElementById('btn-playback-play').disabled = true;
  playbackIndex = 0;

  const vehicleId = document.getElementById('playback-vehicle').value;
  const color = vehicleColors[vehicleId] || '#448aff';

  // 清除之前的回放图层
  if (playbackPolyline) map.removeLayer(playbackPolyline);
  if (playbackMarker) map.removeLayer(playbackMarker);

  playbackPolyline = L.polyline([], { color, weight: 4, opacity: 0.8 }).addTo(map);

  const markerIcon = L.divIcon({
    className: 'vehicle-marker',
    html: `
      <div class="vehicle-marker-icon" style="background:${color};">
        <span class="vehicle-speed-label">回放中</span>
        📍
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

  playbackMarker = L.marker([39.9042, 116.4074], { icon: markerIcon, zIndexOffset: 2000 }).addTo(map);

  const speed = parseInt(document.getElementById('playback-speed').value, 10);

  playbackTimer = setInterval(() => {
    if (playbackIndex >= playbackData.length) {
      stopPlayback();
      return;
    }

    const record = playbackData[playbackIndex];
    const latlng = L.latLng(record.lat, record.lng);
    playbackMarker.setLatLng(latlng);
    playbackPolyline.addLatLng(latlng);

    // 更新速度标签
    const iconEl = playbackMarker.getElement();
    if (iconEl) {
      const label = iconEl.querySelector('.vehicle-speed-label');
      if (label) label.textContent = `${record.speed} km/h`;
    }

    // 更新进度
    const progress = (playbackIndex / (playbackData.length - 1)) * 100;
    document.getElementById('playback-progress-fill').style.width = `${progress}%`;

    const t = new Date(record.timestamp);
    document.getElementById('playback-time-label').textContent = t.toLocaleTimeString('zh-CN');

    map.panTo(latlng);

    playbackIndex += speed;
  }, 50);
}

function stopPlayback() {
  if (playbackTimer) {
    clearInterval(playbackTimer);
    playbackTimer = null;
  }

  document.getElementById('btn-playback-play').disabled = playbackData.length === 0;

  setTimeout(() => {
    if (playbackMarker) { map.removeLayer(playbackMarker); playbackMarker = null; }
    if (playbackPolyline) { map.removeLayer(playbackPolyline); playbackPolyline = null; }
    document.getElementById('playback-progress-bar').style.display = 'none';
  }, 1000);
}

// ============================================================
// 时钟
// ============================================================
function updateClock() {
  document.getElementById('clock').textContent = new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
setInterval(updateClock, 1000);
updateClock();

// ============================================================
// 启动
// ============================================================
connectWS();
