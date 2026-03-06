// 地图标记应用
class MapMarkerApp {
    constructor() {
        this.markers = [];
        this.markerIdCounter = 0;
        this.pendingLatLng = null;

        this.initMap();
        this.initEventListeners();
        this.loadMarkersFromStorage();
    }

    // 初始化地图
    initMap() {
        // 默认中心点（北京）
        const defaultCenter = [39.9042, 116.4074];

        // 初始化地图
        this.map = L.map('map').setView(defaultCenter, 12);

        // 添加地图图层（使用 OpenStreetMap）
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(this.map);

        // 尝试获取用户位置
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    this.map.setView([latitude, longitude], 15);
                    this.updateCoordinates(latitude, longitude);
                },
                (error) => {
                    console.log('无法获取当前位置，使用默认位置');
                }
            );
        }

        // 地图点击事件
        this.map.on('click', (e) => {
            this.pendingLatLng = e.latlng;
            document.getElementById('markerName').focus();
            this.updateCoordinates(e.latlng.lat, e.latlng.lng);

            // 视觉反馈
            this.showClickIndicator(e.latlng);
        });

        // 鼠标移动显示坐标
        this.map.on('mousemove', (e) => {
            this.updateCoordinates(e.latlng.lat, e.latlng.lng);
        });
    }

    // 初始化事件监听器
    initEventListeners() {
        // 添加标记按钮
        document.getElementById('addMarkerBtn').addEventListener('click', () => {
            this.addMarker();
        });

        // 回车键添加标记
        document.getElementById('markerName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addMarker();
            }
        });
    }

    // 更新坐标显示
    updateCoordinates(lat, lng) {
        document.getElementById('coordinates').textContent =
            `📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }

    // 显示点击指示器
    showClickIndicator(latlng) {
        const indicator = L.circleMarker(latlng, {
            radius: 10,
            fillColor: '#667eea',
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.6
        }).addTo(this.map);

        setTimeout(() => {
            this.map.removeLayer(indicator);
        }, 1000);
    }

    // 添加标记
    addMarker() {
        const name = document.getElementById('markerName').value.trim();
        const type = document.getElementById('markerType').value.trim() || '店铺';
        const address = document.getElementById('markerAddress').value.trim();
        const phone = document.getElementById('markerPhone').value.trim();
        const desc = document.getElementById('markerDesc').value.trim();

        if (!name) {
            alert('请输入标记名称');
            document.getElementById('markerName').focus();
            return;
        }

        // 如果没有点击地图，使用地图中心
        if (!this.pendingLatLng) {
            this.pendingLatLng = this.map.getCenter();
        }

        const markerData = {
            id: ++this.markerIdCounter,
            name: name,
            type: type,
            address: address,
            phone: phone,
            description: desc,
            lat: this.pendingLatLng.lat,
            lng: this.pendingLatLng.lng,
            isScenery: this.isSceneryType(type)
        };

        // 创建地图标记
        const marker = this.createMapMarker(markerData);

        // 保存标记数据
        markerData.marker = marker;
        this.markers.push(markerData);

        // 更新UI
        this.renderMarkerList();
        this.saveMarkersToStorage();
        this.clearForm();

        // 移动到标记位置
        this.map.setView([markerData.lat, markerData.lng], 15);
    }

    // 创建地图标记
    createMapMarker(markerData) {
        const customIcon = L.divIcon({
            className: markerData.isScenery ? 'custom-marker scenery' : 'custom-marker',
            iconSize: [20, 20],
            iconAnchor: [10, 10],
            popupAnchor: [0, -10]
        });

        const marker = L.marker([markerData.lat, markerData.lng], {
            icon: customIcon
        }).addTo(this.map);

        // 创建弹出窗口内容
        const popupContent = this.createPopupContent(markerData);
        marker.bindPopup(popupContent);

        // 标记点击事件
        marker.on('click', () => {
            this.highlightListItem(markerData.id);
        });

        return marker;
    }

    // 创建弹出窗口内容
    createPopupContent(markerData) {
        let content = `<div class="popup-title">${this.escapeHtml(markerData.name)}</div>`;
        content += `<span class="popup-type ${markerData.isScenery ? 'scenery' : ''}">${this.escapeHtml(markerData.type)}</span>`;

        if (markerData.address) {
            content += `<div class="popup-info">📍 ${this.escapeHtml(markerData.address)}</div>`;
        }

        if (markerData.phone) {
            content += `<div class="popup-info">📞 ${this.escapeHtml(markerData.phone)}</div>`;
        }

        if (markerData.description) {
            content += `<div class="popup-info">📝 ${this.escapeHtml(markerData.description)}</div>`;
        }

        content += `<div class="popup-info" style="margin-top: 8px; font-size: 11px; color: #999;">`;
        content += `坐标: ${markerData.lat.toFixed(6)}, ${markerData.lng.toFixed(6)}</div>`;

        return content;
    }

    // 判断是否为景点类型
    isSceneryType(type) {
        const sceneryTypes = ['景点', '旅游', '公园', '博物馆', '景区', '名胜'];
        return sceneryTypes.some(t => type.includes(t));
    }

    // 渲染标记列表
    renderMarkerList() {
        const container = document.getElementById('markerListContainer');
        const count = document.getElementById('markerCount');

        count.textContent = this.markers.length;

        if (this.markers.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🗺️</div>
                    <div class="empty-state-text">还没有标记<br>点击地图或填写表单添加</div>
                </div>
            `;
            return;
        }

        container.innerHTML = this.markers.map(marker => `
            <div class="marker-item" data-id="${marker.id}" onclick="app.focusMarker(${marker.id})">
                <div class="marker-item-name">${this.escapeHtml(marker.name)}</div>
                <span class="marker-item-type ${marker.isScenery ? 'scenery' : ''}">${this.escapeHtml(marker.type)}</span>
                ${marker.address ? `<div class="marker-item-address">📍 ${this.escapeHtml(marker.address)}</div>` : ''}
                ${marker.description ? `<div class="marker-item-desc">${this.escapeHtml(marker.description)}</div>` : ''}
                <div class="marker-item-coords">${marker.lat.toFixed(6)}, ${marker.lng.toFixed(6)}</div>
                <div class="marker-item-actions">
                    <button class="marker-item-btn delete" onclick="event.stopPropagation(); app.deleteMarker(${marker.id})">删除</button>
                </div>
            </div>
        `).join('');
    }

    // 聚焦标记
    focusMarker(id) {
        const markerData = this.markers.find(m => m.id === id);
        if (markerData && markerData.marker) {
            this.map.setView([markerData.lat, markerData.lng], 16);
            markerData.marker.openPopup();
            this.highlightListItem(id);
        }
    }

    // 高亮列表项
    highlightListItem(id) {
        // 移除所有高亮
        document.querySelectorAll('.marker-item').forEach(item => {
            item.style.backgroundColor = '';
        });

        // 添加高亮
        const item = document.querySelector(`.marker-item[data-id="${id}"]`);
        if (item) {
            item.style.backgroundColor = '#e8eeff';
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    // 删除标记
    deleteMarker(id) {
        if (confirm('确定要删除这个标记吗？')) {
            const index = this.markers.findIndex(m => m.id === id);
            if (index > -1) {
                const markerData = this.markers[index];
                this.map.removeLayer(markerData.marker);
                this.markers.splice(index, 1);
                this.renderMarkerList();
                this.saveMarkersToStorage();
            }
        }
    }

    // 清空表单
    clearForm() {
        document.getElementById('markerName').value = '';
        document.getElementById('markerType').value = '';
        document.getElementById('markerAddress').value = '';
        document.getElementById('markerPhone').value = '';
        document.getElementById('markerDesc').value = '';
        this.pendingLatLng = null;
    }

    // 保存到本地存储
    saveMarkersToStorage() {
        const data = this.markers.map(m => ({
            id: m.id,
            name: m.name,
            type: m.type,
            address: m.address,
            phone: m.phone,
            description: m.description,
            lat: m.lat,
            lng: m.lng
        }));
        localStorage.setItem('mapMarkers', JSON.stringify(data));
    }

    // 从本地存储加载
    loadMarkersFromStorage() {
        const data = localStorage.getItem('mapMarkers');
        if (data) {
            try {
                const markers = JSON.parse(data);
                markers.forEach(m => {
                    const markerData = {
                        id: m.id,
                        name: m.name,
                        type: m.type,
                        address: m.address,
                        phone: m.phone || '',
                        description: m.description || '',
                        lat: m.lat,
                        lng: m.lng,
                        isScenery: this.isSceneryType(m.type)
                    };

                    const marker = this.createMapMarker(markerData);
                    markerData.marker = marker;
                    this.markers.push(markerData);

                    if (m.id > this.markerIdCounter) {
                        this.markerIdCounter = m.id;
                    }
                });

                this.renderMarkerList();

                // 如果有标记，调整地图视野
                if (this.markers.length > 0) {
                    const bounds = L.latLngBounds(this.markers.map(m => [m.lat, m.lng]));
                    this.map.fitBounds(bounds, { padding: [50, 50] });
                }
            } catch (e) {
                console.error('加载标记数据失败', e);
            }
        }
    }

    // HTML 转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 启动应用
const app = new MapMarkerApp();
