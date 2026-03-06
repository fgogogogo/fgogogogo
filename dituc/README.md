# 地图标记点应用

一个使用高德地图API展示店铺和景点位置的交互式地图应用。

## 功能特点

- 📍 **地图标记**: 在地图上显示多个店铺和景点的位置标记
- 🎯 **分类展示**: 支持店铺和景点两种类型，用不同颜色区分
- 🔍 **信息窗口**: 点击标记显示详细地址信息
- 📋 **侧边栏列表**: 左侧滚动列表展示所有位置
- 🎨 **精美UI**: 现代化界面设计，支持响应式
- 🗺️ **自动视野**: 自动调整地图视野以包含所有标记

## 使用方法

### 1. 获取高德地图API密钥

1. 访问 [高德开放平台](https://lbs.amap.com/)
2. 注册账号并创建应用
3. 获取 Web端 (JS API) 的 Key

### 2. 配置API密钥

打开 `index.html` 文件，找到以下行：

```html
<script src="https://webapi.amap.com/maps?v=2.0&key=YOUR_AMAP_KEY"></script>
```

将 `YOUR_AMAP_KEY` 替换为你获取的实际API密钥。

### 3. 自定义位置数据

编辑 `map.js` 文件中的 `locations` 数组，添加你自己的位置数据：

```javascript
{
    id: 1,
    name: "位置名称",
    address: "详细地址",
    type: "shop", // shop: 店铺, spot: 景点
    icon: "🏪", // 图标emoji
    position: [经度, 纬度]
}
```

### 4. 运行项目

直接用浏览器打开 `index.html` 文件，或使用本地服务器：

```bash
# 使用 Python
python -m http.server 8000

# 使用 Node.js (需要安装 http-server)
npx http-server

# 使用 PHP
php -S localhost:8000
```

然后访问 `http://localhost:8000`

## 获取坐标坐标

1. 使用高德地图 [坐标拾取工具](https://lbs.amap.com/tools/picker)
2. 在地图上点击位置，复制经纬度
3. 格式为：`[经度, 纬度]`

## 自定义样式

- 修改 CSS 调整颜色、字体、布局
- 修改 `map.js` 中的 `markerContent` 自定义标记样式
- 修改地图样式：更改 `mapStyle` 参数

## 注意事项

- 需要联网加载高德地图API
- API密钥有每日调用次数限制
- 建议在生产环境配置域名白名单
