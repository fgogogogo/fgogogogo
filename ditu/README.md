# 地图标记点应用

一个用于标记店铺和景点位置的交互式地图应用。

## 功能特点

- ✅ 在地图上添加自定义标记点
- ✅ 支持标记店铺和景点
- ✅ 为每个标记添加详细信息（名称、类型、地址、电话、描述）
- ✅ 点击地图任意位置快速添加标记
- ✅ 标记列表侧边栏，方便管理所有标记
- ✅ 点击列表项快速定位到对应标记
- ✅ 自动保存到浏览器本地存储
- ✅ 响应式设计，支持移动设备

## 使用方法

### 方式一：直接打开

1. 直接用浏览器打开 `index.html` 文件即可使用

### 方式二：本地服务器

```bash
# 使用 Python 启动本地服务器
python -m http.server 8000

# 或使用 Node.js 的 http-server
npx http-server
```

然后在浏览器访问 `http://localhost:8000`

## 操作说明

### 添加标记

1. **点击地图添加**
   - 点击地图上任意位置
   - 在左侧表单填写标记信息
   - 点击"添加标记"按钮

2. **使用表单添加**
   - 先填写标记信息
   - 点击"添加标记"按钮
   - 标记会添加到地图当前中心位置

### 标记信息

- **标记名称**：必填，如"星巴克咖啡"
- **类型**：如"店铺"、"景点"、"餐厅"等
- **地址**：可选
- **电话**：可选
- **描述**：可选

### 管理标记

- 点击左侧列表中的标记可定位到地图位置
- 点击"删除"按钮可删除标记
- 点击地图上的标记可查看详情

## 技术栈

- **HTML5** - 页面结构
- **CSS3** - 样式设计
- **JavaScript (ES6+)** - 交互逻辑
- **Leaflet.js** - 地图库
- **OpenStreetMap** - 地图数据

## 浏览器支持

- Chrome/Edge (推荐)
- Firefox
- Safari
- Opera

## 数据存储

所有标记数据保存在浏览器的 LocalStorage 中，刷新页面数据不会丢失。

如需清除所有数据，在浏览器控制台运行：
```javascript
localStorage.removeItem('mapMarkers');
location.reload();
```

## 自定义

### 更改默认中心位置

编辑 `app.js` 文件中的默认坐标：
```javascript
const defaultCenter = [39.9042, 116.4074]; // [纬度, 经度]
```

### 更换地图图层

可以使用其他地图服务代替 OpenStreetMap，如高德地图：
```javascript
L.tileLayer('https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
    attribution: '&copy; 高德地图'
}).addTo(this.map);
```

## 许可证

MIT License
