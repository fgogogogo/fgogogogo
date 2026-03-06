# 电商商品详情页

一个使用React开发的电商商品详情页，包含图片轮播、规格选择、加入购物车等功能。

## 功能特性

✨ **图片轮播** - 支持主图预览和缩略图切换
🎨 **规格选择** - 支持多种商品规格（颜色、尺码等）
🛒 **购物车** - 商品数量选择和添加购物车功能
💴 **价格展示** - 原价、现价、折扣信息
📱 **响应式设计** - 适配移动端和桌面端

## 项目结构

```
dianshang_b/
├── index.html          # 主HTML文件
├── App.jsx            # 应用主组件
├── ProductDetail.jsx  # 商品详情页组件
├── ImageCarousel.jsx  # 图片轮播组件
├── SpecSelector.jsx   # 规格选择组件
├── CartButton.jsx     # 购物车按钮组件
├── mockData.js        # 模拟商品数据
├── styles.css         # 样式文件
└── README.md          # 项目说明
```

## 使用方法

### 方式一：直接打开
双击 `index.html` 文件在浏览器中打开即可。

### 方式二：本地服务器（推荐）
使用任意本地服务器运行项目，例如：

```bash
# 使用 Python
python -m http.server 8000

# 使用 Node.js http-server
npx http-server
```

然后在浏览器访问 `http://localhost:8000`

## 组件说明

### ProductDetail（商品详情页主组件）
- 整合了所有子组件
- 管理商品规格选择状态
- 协调各组件间的数据传递

### ImageCarousel（图片轮播组件）
- 支持左右箭头切换
- 缩略图快速定位
- 响应式图片展示

### SpecSelector（规格选择组件）
- 支持多种规格类型
- 图片规格预览（如颜色）
- 单选规格逻辑

### CartButton（购物车按钮组件）
- 数量增减器
- 表单验证
- 添加成功提示

## 数据格式

商品数据格式示例（`mockData.js`）：

```javascript
{
    id: 1,
    name: '商品名称',
    price: 299,
    originalPrice: 599,
    description: '商品描述',
    images: ['图片URL数组'],
    specs: [
        {
            name: '颜色',
            options: [
                { id: '...', name: '黑色', image: '...' }
            ]
        }
    ]
}
```

## 技术栈

- **React 18** - UI框架
- **原生CSS** - 样式系统
- **Babel Standalone** - 浏览器端JSX编译

## 扩展建议

- [ ] 接入真实API
- [ ] 添加购物车页面
- [ ] 实现商品搜索
- [ ] 添加收藏功能
- [ ] 支付集成
- [ ] 用户评价系统

## 注意事项

⚠️ 当前使用CDN引入React和Babel，仅供学习和演示使用。

生产环境建议：
- 使用构建工具（Vite、Webpack等）
- 安装React和ReactDOM依赖
- 代码分割和懒加载
- 图片CDN优化
