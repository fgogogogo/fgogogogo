// 地图数据配置 - 店铺和景点位置
const locations = [
    {
        id: 1,
        name: "星巴克咖啡",
        address: "北京市朝阳区建国门外大街1号",
        type: "shop",
        icon: "☕",
        position: [39.909768, 116.434446]
    },
    {
        id: 2,
        name: "故宫博物院",
        address: "北京市东城区景山前街4号",
        type: "spot",
        icon: "🏛️",
        position: [39.917723, 116.397128]
    },
    {
        id: 3,
        name: "三里屯太古里",
        address: "北京市朝阳区三里屯路11号",
        type: "shop",
        icon: "🛍️",
        position: [39.938034, 116.455184]
    },
    {
        id: 4,
        name: "天坛公园",
        address: "北京市东城区天坛东里甲1号",
        type: "spot",
        icon: "⛩️",
        position: [39.882238, 116.407426]
    },
    {
        id: 5,
        name: "海底捞火锅",
        address: "北京市东城区东直门内大街5号",
        type: "shop",
        icon: "🍲",
        position: [39.937466, 116.423656]
    },
    {
        id: 6,
        name: "颐和园",
        address: "北京市海淀区新建宫门路19号",
        type: "spot",
        icon: "🏮",
        position: [39.999639, 116.273155]
    },
    {
        id: 7,
        name: "王府井书店",
        address: "北京市东城区王府井大街218号",
        type: "shop",
        icon: "📚",
        position: [39.913769, 116.410047]
    },
    {
        id: 8,
        name: "北海公园",
        address: "北京市西城区文津街1号",
        type: "spot",
        icon: "🌸",
        position: [39.928629, 116.389153]
    }
];

let map = null;
let markers = [];
let activeLocationId = null;

// 初始化地图
function initMap() {
    // 创建地图实例（注意：Leaflet 使用 [纬度, 经度]）
    map = L.map('map', {
        zoomControl: false // 禁用默认缩放控制，自定义位置
    }).setView([39.917723, 116.397128], 12);

    // 添加地图图层（使用 OpenStreetMap，免费无需密钥）
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);

    // 添加缩放控制到右上角
    L.control.zoom({
        position: 'topright'
    }).addTo(map);

    // 添加比例尺
    L.control.scale({
        position: 'bottomright'
    }).addTo(map);

    // 添加标记点
    addMarkers();

    // 渲染地点列表
    renderLocationList();

    // 自动调整视野以包含所有标记
    fitViewToMarkers();
}

// 创建自定义图标
function createCustomIcon(location) {
    return L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="custom-marker marker-${location.type}">
                <span>${location.icon}</span>
               </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
    });
}

// 添加地图标记
function addMarkers() {
    locations.forEach(location => {
        // 创建标记
        const marker = L.marker(location.position, {
            icon: createCustomIcon(location)
        });

        // 创建弹窗内容
        const popupContent = `
            <div class="popup-header">
                <span>${location.icon}</span>
                <span>${location.name}</span>
            </div>
            <div class="popup-address">${location.address}</div>
        `;

        marker.bindPopup(popupContent, {
            className: 'custom-popup',
            maxWidth: 250
        });

        // 点击标记事件
        marker.on('click', () => {
            highlightLocation(location.id);
        });

        markers.push({ marker, location });
        marker.addTo(map);
    });
}

// 渲染地点列表
function renderLocationList() {
    const listContainer = document.getElementById('locationList');
    listContainer.innerHTML = locations.map(location => `
        <div class="location-item" data-id="${location.id}" onclick="focusLocation(${location.id})">
            <div class="location-name">
                <span class="location-icon">${location.icon}</span>
                ${location.name}
            </div>
            <div class="location-address">${location.address}</div>
            <span class="location-type type-${location.type}">
                ${location.type === 'shop' ? '🏪 店铺' : '🎯 景点'}
            </span>
        </div>
    `).join('');
}

// 聚焦到指定位置
function focusLocation(id) {
    const data = markers.find(m => m.location.id === id);
    if (data) {
        // 移动地图中心
        map.flyTo(data.marker.getLatLng(), 15, {
            duration: 1.5
        });

        // 打开弹窗
        data.marker.openPopup();

        // 高亮列表项
        highlightLocation(id);
    }
}

// 高亮地点
function highlightLocation(id) {
    activeLocationId = id;

    // 更新列表高亮
    document.querySelectorAll('.location-item').forEach(item => {
        item.classList.remove('active');
        if (parseInt(item.dataset.id) === id) {
            item.classList.add('active');
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });
}

// 自动调整视野
function fitViewToMarkers() {
    if (markers.length > 0) {
        const group = new L.featureGroup(markers.map(m => m.marker));
        map.fitBounds(group.getBounds(), {
            padding: [50, 50],
            maxZoom: 12
        });
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initMap);
