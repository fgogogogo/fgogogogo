# AI 对话助手

一个简洁优雅的 AI 对话界面，集成 Anthropic Claude API，支持实时流式响应。

## 功能特点

- 💬 实时流式对话 - 逐字显示 AI 回复，体验更自然
- 🎨 现代化 UI - 简洁优雅的界面设计
- 💾 本地存储 - API Key 和对话历史保存在浏览器本地
- 🔧 多模型支持 - 支持 Claude Sonnet 4.6, Claude 3.5 Sonnet, Claude 3 Haiku
- 📱 响应式设计 - 完美适配桌面和移动设备
- ⌨️ 快捷键支持 - Enter 发送，Shift + Enter 换行

## 快速开始

### 1. 获取 API Key

访问 [Anthropic Console](https://console.anthropic.com/) 创建账号并获取 API Key。

### 2. 打开应用

直接在浏览器中打开 `index.html` 文件即可使用。

### 3. 配置设置

点击右上角的设置按钮，输入你的 API Key 并选择模型，然后点击保存。

## 文件结构

```
ai_b/
├── index.html    # 主页面
├── style.css     # 样式文件
├── app.js        # 应用逻辑
└── README.md     # 说明文档
```

## 使用方法

1. **发送消息**: 在输入框中输入问题，按 Enter 键发送
2. **换行**: 按 Shift + Enter 可以输入多行文本
3. **清空对话**: 在设置中点击"清空对话"按钮
4. **切换模型**: 在设置中选择不同的 Claude 模型

## 技术栈

- 纯 HTML5 / CSS3 / JavaScript (ES6+)
- Anthropic Claude API
- 流式响应处理 (Server-Sent Events)

## 浏览器兼容性

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## 安全提示

- API Key 存储在浏览器的 localStorage 中，仅供本地使用
- 请勿将包含 API Key 的版本部署到公共网络
- 建议在生产环境中使用后端代理 API 请求

## 自定义

你可以通过修改 CSS 中的 `:root` 变量来自定义主题颜色：

```css
:root {
    --primary-color: #7c4dff;      /* 主色调 */
    --primary-hover: #6200ea;       /* 悬停颜色 */
    --bg-color: #f5f5f5;            /* 背景色 */
    --chat-bg: #ffffff;             /* 聊天背景 */
}
```

## 许可证

MIT License
