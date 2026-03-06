// AI 对话助手 - 主应用逻辑
class AIChatAssistant {
    constructor() {
        this.apiKey = localStorage.getItem('anthropic_api_key') || '';
        this.model = localStorage.getItem('anthropic_model') || 'claude-sonnet-4-20250514';
        this.conversationHistory = [];
        this.isLoading = false;

        this.initElements();
        this.initEventListeners();
        this.loadSettings();
    }

    initElements() {
        // 聊天相关元素
        this.chatContainer = document.getElementById('chatContainer');
        this.userInput = document.getElementById('userInput');
        this.sendBtn = document.getElementById('sendBtn');

        // 设置相关元素
        this.settingsBtn = document.getElementById('settingsBtn');
        this.settingsModal = document.getElementById('settingsModal');
        this.closeModal = document.getElementById('closeModal');
        this.apiKeyInput = document.getElementById('apiKey');
        this.modelSelect = document.getElementById('modelSelect');
        this.saveSettings = document.getElementById('saveSettings');
        this.clearChat = document.getElementById('clearChat');
    }

    initEventListeners() {
        // 发送按钮
        this.sendBtn.addEventListener('click', () => this.sendMessage());

        // 用户输入
        this.userInput.addEventListener('input', () => this.handleInput());
        this.userInput.addEventListener('keydown', (e) => this.handleKeydown(e));

        // 设置弹窗
        this.settingsBtn.addEventListener('click', () => this.openSettings());
        this.closeModal.addEventListener('click', () => this.closeSettings());
        this.saveSettings.addEventListener('click', () => this.saveSettingsData());
        this.clearChat.addEventListener('click', () => this.clearConversation());

        // 点击弹窗外部关闭
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) {
                this.closeSettings();
            }
        });

        // 自动调整输入框高度
        this.userInput.addEventListener('input', () => {
            this.userInput.style.height = 'auto';
            this.userInput.style.height = Math.min(this.userInput.scrollHeight, 150) + 'px';
        });
    }

    handleInput() {
        const hasContent = this.userInput.value.trim().length > 0;
        this.sendBtn.disabled = !hasContent || this.isLoading;
    }

    handleKeydown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!this.sendBtn.disabled) {
                this.sendMessage();
            }
        }
    }

    async sendMessage() {
        const message = this.userInput.value.trim();
        if (!message || this.isLoading) return;

        // 检查API Key
        if (!this.apiKey) {
            this.openSettings();
            alert('请先设置 Anthropic API Key');
            return;
        }

        // 清空输入框
        this.userInput.value = '';
        this.userInput.style.height = 'auto';
        this.sendBtn.disabled = true;

        // 移除欢迎消息
        const welcomeMessage = this.chatContainer.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }

        // 添加用户消息到界面
        this.appendMessage('user', message);

        // 添加到对话历史
        this.conversationHistory.push({
            role: 'user',
            content: message
        });

        // 显示加载状态
        this.isLoading = true;
        const loadingElement = this.showLoading();

        try {
            // 调用Claude API
            const response = await this.callClaudeAPI();

            // 移除加载状态
            loadingElement.remove();

            // 添加AI回复到界面
            this.appendMessage('assistant', response);

            // 添加到对话历史
            this.conversationHistory.push({
                role: 'assistant',
                content: response
            });

        } catch (error) {
            loadingElement.remove();
            this.appendMessage('assistant', `错误: ${error.message}`);
        } finally {
            this.isLoading = false;
            this.handleInput();
        }
    }

    async callClaudeAPI() {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({
                model: this.model,
                messages: this.conversationHistory,
                max_tokens: 4096,
                stream: true
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API 错误: ${response.status}`);
        }

        // 处理流式响应
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        // 创建一个临时消息元素用于显示流式内容
        const tempMessageElement = this.createMessageElement('assistant', '');
        const messageContent = tempMessageElement.querySelector('.message-content');
        this.chatContainer.appendChild(tempMessageElement);
        this.scrollToBottom();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);

                    if (data === '[DONE]') {
                        continue;
                    }

                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                            const text = parsed.delta.text;
                            fullResponse += text;
                            messageContent.innerHTML = this.formatMessage(fullResponse);
                            this.scrollToBottom();
                        }
                    } catch (e) {
                        // 忽略解析错误
                    }
                }
            }
        }

        return fullResponse;
    }

    appendMessage(role, content) {
        const messageElement = this.createMessageElement(role, content);
        this.chatContainer.appendChild(messageElement);
        this.scrollToBottom();
    }

    createMessageElement(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = role === 'user' ? '👤' : '🤖';

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.innerHTML = this.formatMessage(content);

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);

        return messageDiv;
    }

    formatMessage(content) {
        if (!content) return '';

        // 简单的Markdown格式化
        let formatted = content
            // 代码块
            .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
            // 行内代码
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            // 加粗
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            // 斜体
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            // 链接
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
            // 换行
            .replace(/\n/g, '<br>');

        return formatted;
    }

    showLoading() {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message assistant';
        loadingDiv.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        this.chatContainer.appendChild(loadingDiv);
        this.scrollToBottom();
        return loadingDiv;
    }

    scrollToBottom() {
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }

    openSettings() {
        this.settingsModal.classList.remove('hidden');
        this.apiKeyInput.value = this.apiKey;
        this.modelSelect.value = this.model;
    }

    closeSettings() {
        this.settingsModal.classList.add('hidden');
    }

    saveSettingsData() {
        const newApiKey = this.apiKeyInput.value.trim();
        const newModel = this.modelSelect.value;

        if (newApiKey) {
            this.apiKey = newApiKey;
            localStorage.setItem('anthropic_api_key', newApiKey);
        }

        this.model = newModel;
        localStorage.setItem('anthropic_model', newModel);

        this.closeSettings();
        this.showNotification('设置已保存');
    }

    loadSettings() {
        if (this.apiKey) {
            this.apiKeyInput.value = this.apiKey;
        }
        this.modelSelect.value = this.model;
    }

    clearConversation() {
        if (confirm('确定要清空所有对话吗？')) {
            this.conversationHistory = [];
            this.chatContainer.innerHTML = `
                <div class="welcome-message">
                    <div class="welcome-icon">🤖</div>
                    <h2>你好！我是 AI 助手</h2>
                    <p>有什么可以帮助你的吗？</p>
                </div>
            `;
            this.closeSettings();
        }
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4caf50;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new AIChatAssistant();
});
