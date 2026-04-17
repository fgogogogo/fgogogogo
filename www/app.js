// 主要城市数据（包含经纬度和时区）
const majorCities = [
    { name: "北京", nameEn: "Beijing", lat: 39.9042, lng: 116.4074, timezone: "Asia/Shanghai" },
    { name: "上海", nameEn: "Shanghai", lat: 31.2304, lng: 121.4737, timezone: "Asia/Shanghai" },
    { name: "东京", nameEn: "Tokyo", lat: 35.6762, lng: 139.6503, timezone: "Asia/Tokyo" },
    { name: "首尔", nameEn: "Seoul", lat: 37.5665, lng: 126.9780, timezone: "Asia/Seoul" },
    { name: "新加坡", nameEn: "Singapore", lat: 1.3521, lng: 103.8198, timezone: "Asia/Singapore" },
    { name: "香港", nameEn: "Hong Kong", lat: 22.3193, lng: 114.1694, timezone: "Asia/Hong_Kong" },
    { name: "台北", nameEn: "Taipei", lat: 25.0330, lng: 121.5654, timezone: "Asia/Taipei" },
    { name: "曼谷", nameEn: "Bangkok", lat: 13.7563, lng: 100.5018, timezone: "Asia/Bangkok" },
    { name: "悉尼", nameEn: "Sydney", lat: -33.8688, lng: 151.2093, timezone: "Australia/Sydney" },
    { name: "墨尔本", nameEn: "Melbourne", lat: -37.8136, lng: 144.9631, timezone: "Australia/Melbourne" },
    { name: "伦敦", nameEn: "London", lat: 51.5074, lng: -0.1278, timezone: "Europe/London" },
    { name: "巴黎", nameEn: "Paris", lat: 48.8566, lng: 2.3522, timezone: "Europe/Paris" },
    { name: "柏林", nameEn: "Berlin", lat: 52.5200, lng: 13.4050, timezone: "Europe/Berlin" },
    { name: "罗马", nameEn: "Rome", lat: 41.9028, lng: 12.4964, timezone: "Europe/Rome" },
    { name: "马德里", nameEn: "Madrid", lat: 40.4168, lng: -3.7038, timezone: "Europe/Madrid" },
    { name: "阿姆斯特丹", nameEn: "Amsterdam", lat: 52.3676, lng: 4.9041, timezone: "Europe/Amsterdam" },
    { name: "莫斯科", nameEn: "Moscow", lat: 55.7558, lng: 37.6173, timezone: "Europe/Moscow" },
    { name: "纽约", nameEn: "New York", lat: 40.7128, lng: -74.0060, timezone: "America/New_York" },
    { name: "洛杉矶", nameEn: "Los Angeles", lat: 34.0522, lng: -118.2437, timezone: "America/Los_Angeles" },
    { name: "芝加哥", nameEn: "Chicago", lat: 41.8781, lng: -87.6298, timezone: "America/Chicago" },
    { name: "旧金山", nameEn: "San Francisco", lat: 37.7749, lng: -122.4194, timezone: "America/Los_Angeles" },
    { name: "多伦多", nameEn: "Toronto", lat: 43.6532, lng: -79.3832, timezone: "America/Toronto" },
    { name: "温哥华", nameEn: "Vancouver", lat: 49.2827, lng: -123.1207, timezone: "America/Vancouver" },
    { name: "墨西哥城", nameEn: "Mexico City", lat: 19.4326, lng: -99.1332, timezone: "America/Mexico_City" },
    { name: "圣保罗", nameEn: "São Paulo", lat: -23.5505, lng: -46.6333, timezone: "America/Sao_Paulo" },
    { name: "布宜诺斯艾利斯", nameEn: "Buenos Aires", lat: -34.6037, lng: -58.3816, timezone: "America/Argentina/Buenos_Aires" },
    { name: "迪拜", nameEn: "Dubai", lat: 25.2048, lng: 55.2708, timezone: "Asia/Dubai" },
    { name: "孟买", nameEn: "Mumbai", lat: 19.0760, lng: 72.8777, timezone: "Asia/Kolkata" },
    { name: "德里", nameEn: "Delhi", lat: 28.7041, lng: 77.1025, timezone: "Asia/Kolkata" },
    { name: "伊斯兰堡", nameEn: "Islamabad", lat: 33.6844, lng: 73.0479, timezone: "Asia/Karachi" },
    { name: "开罗", nameEn: "Cairo", lat: 30.0444, lng: 31.2357, timezone: "Africa/Cairo" },
    { name: "约翰内斯堡", nameEn: "Johannesburg", lat: -26.2041, lng: 28.0473, timezone: "Africa/Johannesburg" },
    { name: "拉各斯", nameEn: "Lagos", lat: 6.5244, lng: 3.3792, timezone: "Africa/Lagos" },
    { name: "温哥华", nameEn: "Vancouver", lat: 49.2827, lng: -123.1207, timezone: "America/Vancouver" },
    { name: "苏黎世", nameEn: "Zurich", lat: 47.3769, lng: 8.5417, timezone: "Europe/Zurich" },
    { name: "斯德哥尔摩", nameEn: "Stockholm", lat: 59.3293, lng: 18.0686, timezone: "Europe/Stockholm" },
    { name: "维也纳", nameEn: "Vienna", lat: 48.2082, lng: 16.3738, timezone: "Europe/Vienna" },
    { name: "布拉格", nameEn: "Prague", lat: 50.0755, lng: 14.4378, timezone: "Europe/Prague" },
    { name: "华沙", nameEn: "Warsaw", lat: 52.2297, lng: 21.0122, timezone: "Europe/Warsaw" },
    { name: "雅典", nameEn: "Athens", lat: 37.9838, lng: 23.7275, timezone: "Europe/Athens" },
    { name: "伊斯坦布尔", nameEn: "Istanbul", lat: 41.0082, lng: 28.9784, timezone: "Europe/Istanbul" },
    { name: "里斯本", nameEn: "Lisbon", lat: 38.7223, lng: -9.1393, timezone: "Europe/Lisbon" },
    { name: "雷克雅未克", nameEn: "Reykjavik", lat: 64.1466, lng: -21.9426, timezone: "Atlantic/Reykjavik" },
    { name: "奥克兰", nameEn: "Auckland", lat: -36.8509, lng: 174.7645, timezone: "Pacific/Auckland" },
    { name: "惠灵顿", nameEn: "Wellington", lat: -41.2924, lng: 174.7787, timezone: "Pacific/Auckland" },
    { name: "火奴鲁鲁", nameEn: "Honolulu", lat: 21.3069, lng: -157.8583, timezone: "Pacific/Honolulu" },
    { name: "安克雷奇", nameEn: "Anchorage", lat: 61.2181, lng: -149.9003, timezone: "America/Anchorage" },
    { name: "莫斯科", nameEn: "Moscow", lat: 55.7558, lng: 37.6173, timezone: "Europe/Moscow" },
    { name: "雅加达", nameEn: "Jakarta", lat: -6.2088, lng: 106.8456, timezone: "Asia/Jakarta" },
    { name: "马尼拉", nameEn: "Manila", lat: 14.5995, lng: 120.9842, timezone: "Asia/Manila" },
    { name: "吉隆坡", nameEn: "Kuala Lumpur", lat: 3.1390, lng: 101.6869, timezone: "Asia/Kuala_Lumpur" }
];

// 状态管理
let selectedCities = [];
let currentMarker = null;
let markers = [];

// 初始化地图
const map = L.map('map', {
    center: [20, 0],
    zoom: 2,
    minZoom: 2,
    maxZoom: 6,
    zoomControl: false
});

// 使用深色地图瓦片
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
}).addTo(map);

// 移动缩放控件到右下角
L.control.zoom({
    position: 'bottomright'
}).addTo(map);

// 添加主要城市标记
const cityIcon = L.divIcon({
    className: 'city-marker',
    html: '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); width: 10px; height: 10px; border-radius: 50%; box-shadow: 0 0 10px #667eea;"></div>',
    iconSize: [10, 10],
    iconAnchor: [5, 5]
});

majorCities.forEach(city => {
    const marker = L.marker([city.lat, city.lng], { icon: cityIcon }).addTo(map);
    marker.on('click', () => handleCityClick(city));
    markers.push(marker);
});

// 地图点击事件
map.on('click', async (e) => {
    const { lat, lng } = e.latlng;

    try {
        // 使用免费的时区API
        const response = await axios.get(`https://api.geonames.org/timezoneJSON?lat=${lat}&lng=${lng}&username=demo`);

        if (response.data.timezoneId) {
            const cityData = {
                name: "当前位置",
                lat: lat,
                lng: lng,
                timezone: response.data.timezoneId,
                countryName: response.data.countryName || ""
            };

            showCurrentInfo(cityData);
            addMarker(lat, lng, cityData.name);
        } else {
            alert("无法获取该位置的时区信息");
        }
    } catch (error) {
        console.error("获取时区失败:", error);
        alert("获取时区信息失败，请重试");
    }
});

// 城市点击处理
function handleCityClick(city) {
    showCurrentInfo(city);
    addMarker(city.lat, city.lng, city.name);
}

// 显示当前位置信息
function showCurrentInfo(city) {
    const container = document.getElementById('current-info');
    const now = DateTime.now().setZone(city.timezone);
    const localNow = DateTime.now();

    const diffHours = now.offset - localNow.offset;
    const diffSign = diffHours >= 0 ? '+' : '';
    const diffText = diffHours === 0 ? '与本地时间相同' : `${diffSign}${diffHours} 小时`;

    container.innerHTML = `
        <div class="info-row">
            <span class="info-label">位置</span>
            <span class="info-value">${city.name}</span>
        </div>
        <div class="info-row">
            <span class="info-label">时区</span>
            <span class="timezone-badge">${city.timezone}</span>
        </div>
        <div class="info-row">
            <span class="info-label">时差</span>
            <span class="diff-badge ${diffHours >= 0 ? 'positive' : 'negative'}">${diffText}</span>
        </div>
        <div class="time-display">${now.toFormat('HH:mm:ss')}</div>
        <div class="info-row">
            <span class="info-label">日期</span>
            <span class="info-value">${now.toFormat('yyyy年MM月dd日 EEEE')}</span>
        </div>
        <button class="add-btn" onclick="addCity('${encodeURIComponent(JSON.stringify(city))}')">
            + 添加到对比列表
        </button>
    `;
}

// 添加标记
function addMarker(lat, lng, name) {
    if (currentMarker) {
        map.removeLayer(currentMarker);
    }

    currentMarker = L.marker([lat, lng], {
        icon: L.divIcon({
            className: 'current-marker',
            html: '<div style="background: #ff6b6b; width: 15px; height: 15px; border-radius: 50%; box-shadow: 0 0 15px #ff6b6b; animation: pulse 1s infinite;"></div>',
            iconSize: [15, 15],
            iconAnchor: [7.5, 7.5]
        })
    }).addTo(map);

    currentMarker.bindPopup(`<strong>${name}</strong>`).openPopup();
}

// 添加城市到对比列表
function addCity(cityEncoded) {
    const city = JSON.parse(decodeURIComponent(cityEncoded));

    // 检查是否已存在
    const exists = selectedCities.some(c =>
        c.lat === city.lat && c.lng === city.lng
    );

    if (exists) {
        alert("该城市已在列表中");
        return;
    }

    selectedCities.push(city);
    updateCityList();
}

// 从对比列表中移除城市
function removeCity(index) {
    selectedCities.splice(index, 1);
    updateCityList();
}

// 更新城市列表
function updateCityList() {
    const container = document.getElementById('selected-cities');

    if (selectedCities.length === 0) {
        container.innerHTML = '<p class="placeholder">添加城市进行对比</p>';
        return;
    }

    container.innerHTML = selectedCities.map((city, index) => {
        const now = DateTime.now().setZone(city.timezone);
        const localNow = DateTime.now();
        const diffHours = now.offset - localNow.offset;

        return `
            <div class="city-item" data-timezone="${city.timezone}">
                <button class="remove-btn" onclick="removeCity(${index})">×</button>
                <div class="city-header">
                    <span class="city-name">${city.name}</span>
                    <span class="city-timezone">${city.timezone}</span>
                </div>
                <div class="city-time">${now.toFormat('HH:mm')}</div>
                <div class="city-date">${now.toFormat('MM月dd日 EEEE')}</div>
                ${diffHours !== 0 ? `<div class="diff-badge ${diffHours >= 0 ? 'positive' : 'negative'}">${diffHours >= 0 ? '+' : ''}${diffHours}h</div>` : ''}
            </div>
        `;
    }).join('');
}

// 清空所有城市
document.getElementById('clear-all').addEventListener('click', () => {
    if (selectedCities.length > 0 && confirm('确定要清空所有已选城市吗？')) {
        selectedCities = [];
        updateCityList();
    }
});

// 搜索功能
const searchInput = document.getElementById('city-search');
const searchResults = document.getElementById('search-results');

searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();

    if (query.length < 1) {
        searchResults.innerHTML = '';
        return;
    }

    const results = majorCities.filter(city =>
        city.name.toLowerCase().includes(query) ||
        city.nameEn.toLowerCase().includes(query)
    ).slice(0, 10);

    if (results.length === 0) {
        searchResults.innerHTML = '<p class="placeholder" style="text-align:center;padding:15px;">未找到匹配的城市</p>';
        return;
    }

    searchResults.innerHTML = results.map(city => {
        const now = DateTime.now().setZone(city.timezone);
        return `
            <div class="search-result-item" onclick="selectSearchResult(${city.lat}, ${city.lng}, '${city.timezone}', '${city.name}')">
                <div class="result-city">${city.name} (${city.nameEn})</div>
                <div class="result-details">${now.toFormat('HH:mm')} · ${city.timezone}</div>
            </div>
        `;
    }).join('');
});

// 选择搜索结果
function selectSearchResult(lat, lng, timezone, name) {
    const city = {
        name: name,
        lat: lat,
        lng: lng,
        timezone: timezone
    };

    // 显示当前位置信息
    showCurrentInfo(city);

    // 移动地图到该位置
    map.setView([lat, lng], 4);
    addMarker(lat, lng, name);

    // 添加到列表
    selectedCities.push(city);
    updateCityList();

    // 清空搜索
    searchInput.value = '';
    searchResults.innerHTML = '';
}

// 每秒更新时间显示
setInterval(() => {
    // 更新当前位置时间
    const currentInfo = document.getElementById('current-info');
    const timeDisplay = currentInfo.querySelector('.time-display');
    if (timeDisplay) {
        // 从DOM获取时区信息（简单方式）
        const timezoneBadge = currentInfo.querySelector('.timezone-badge');
        if (timezoneBadge) {
            const timezone = timezoneBadge.textContent;
            const now = DateTime.now().setZone(timezone);
            timeDisplay.textContent = now.toFormat('HH:mm:ss');

            // 更新日期
            const dateRow = currentInfo.querySelectorAll('.info-row')[2];
            if (dateRow) {
                dateRow.querySelector('.info-value').textContent = now.toFormat('yyyy年MM月dd日 EEEE');
            }
        }
    }

    // 更新已选城市时间
    document.querySelectorAll('.city-item').forEach((item, index) => {
        if (selectedCities[index]) {
            const now = DateTime.now().setZone(selectedCities[index].timezone);
            const timeEl = item.querySelector('.city-time');
            const dateEl = item.querySelector('.city-date');
            if (timeEl) timeEl.textContent = now.toFormat('HH:mm');
            if (dateEl) dateEl.textContent = now.toFormat('MM月dd日 EEEE');
        }
    });

    // 更新搜索结果时间
    document.querySelectorAll('.search-result-item').forEach((item, index) => {
        const query = searchInput.value.toLowerCase().trim();
        if (query.length >= 1) {
            const results = majorCities.filter(city =>
                city.name.toLowerCase().includes(query) ||
                city.nameEn.toLowerCase().includes(query)
            ).slice(0, 10);
            if (results[index]) {
                const now = DateTime.now().setZone(results[index].timezone);
                const detailsEl = item.querySelector('.result-details');
                if (detailsEl) {
                    detailsEl.textContent = `${now.toFormat('HH:mm')} · ${results[index].timezone}`;
                }
            }
        }
    });
}, 1000);

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.2); opacity: 0.7; }
        100% { transform: scale(1); opacity: 1; }
    }
`;
document.head.appendChild(style);
