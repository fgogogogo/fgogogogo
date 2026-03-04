class VirtualClassroom {
    constructor() {
        this.canvas = document.getElementById('whiteboard');
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.currentTool = 'pen';
        this.currentColor = '#000000';
        this.brushSize = 3;
        this.lastX = 0;
        this.lastY = 0;
        this.isRecording = false;
        this.isSharing = false;
        this.selectionBox = document.getElementById('selectionBox');
        this.isSelecting = false;
        this.selectionStart = { x: 0, y: 0 };
        
        this.initCanvas();
        this.initEventListeners();
        this.initChat();
        this.initRecording();
        this.initScreenShare();
    }

    initCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
    }

    resizeCanvas() {
        const container = document.getElementById('whiteboardContainer');
        const rect = container.getBoundingClientRect();
        
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        this.ctx.putImageData(imageData, 0, 0);
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
    }

    initEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());

        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', () => this.stopDrawing());

        document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectTool(e));
        });

        document.getElementById('colorPicker').addEventListener('change', (e) => {
            this.currentColor = e.target.value;
        });

        document.getElementById('brushSize').addEventListener('input', (e) => {
            this.brushSize = parseInt(e.target.value);
        });

        document.getElementById('clearBtn').addEventListener('click', () => this.clearCanvas());
    }

    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.startDrawing(mouseEvent);
    }

    handleTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.draw(mouseEvent);
    }

    startDrawing(e) {
        if (this.isSharing) {
            this.startSelection(e);
            return;
        }
        
        this.isDrawing = true;
        const rect = this.canvas.getBoundingClientRect();
        this.lastX = e.clientX - rect.left;
        this.lastY = e.clientY - rect.top;
    }

    draw(e) {
        if (!this.isDrawing) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(x, y);
        
        if (this.currentTool === 'eraser') {
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = this.brushSize * 3;
        } else {
            this.ctx.strokeStyle = this.currentColor;
            this.ctx.lineWidth = this.brushSize;
        }
        
        this.ctx.stroke();
        
        this.lastX = x;
        this.lastY = y;
    }

    stopDrawing() {
        this.isDrawing = false;
    }

    selectTool(e) {
        const tool = e.target.dataset.tool;
        this.currentTool = tool;
        
        document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
            btn.classList.remove('active');
        });
        e.target.classList.add('active');
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    initChat() {
        const chatInput = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendBtn');
        const emojiButtons = document.querySelectorAll('.emoji-btn');

        sendBtn.addEventListener('click', () => this.sendMessage());
        
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        emojiButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                chatInput.value += btn.textContent;
                chatInput.focus();
            });
        });
    }

    sendMessage() {
        const chatInput = document.getElementById('chatInput');
        const message = chatInput.value.trim();
        
        if (!message) return;
        
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user';
        messageDiv.innerHTML = `
            <div class="message-sender">我</div>
            <div class="message-content">${this.escapeHtml(message)}</div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        chatInput.value = '';
        
        this.saveMessage(message);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    saveMessage(message) {
        const messages = JSON.parse(localStorage.getItem('chatMessages') || '[]');
        messages.push({
            content: message,
            sender: '我',
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('chatMessages', JSON.stringify(messages));
    }

    loadMessages() {
        const messages = JSON.parse(localStorage.getItem('chatMessages') || '[]');
        const chatMessages = document.getElementById('chatMessages');
        
        messages.forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message user';
            messageDiv.innerHTML = `
                <div class="message-sender">${msg.sender}</div>
                <div class="message-content">${this.escapeHtml(msg.content)}</div>
            `;
            chatMessages.appendChild(messageDiv);
        });
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    initRecording() {
        const recordBtn = document.getElementById('recordBtn');
        
        recordBtn.addEventListener('click', () => {
            this.isRecording = !this.isRecording;
            
            if (this.isRecording) {
                recordBtn.classList.add('recording');
                recordBtn.querySelector('.record-text').textContent = '停止录制';
                this.showNotification('开始录制');
            } else {
                recordBtn.classList.remove('recording');
                recordBtn.querySelector('.record-text').textContent = '录制';
                this.showNotification('录制已停止');
            }
        });
    }

    initScreenShare() {
        const shareBtn = document.getElementById('shareBtn');
        
        shareBtn.addEventListener('click', () => {
            this.isSharing = !this.isSharing;
            
            if (this.isSharing) {
                document.body.classList.add('sharing-active');
                shareBtn.textContent = '停止共享';
                shareBtn.style.background = '#e74c3c';
                this.canvas.style.cursor = 'crosshair';
                this.showNotification('请选择要共享的区域');
            } else {
                document.body.classList.remove('sharing-active');
                shareBtn.textContent = '共享屏幕';
                shareBtn.style.background = '#3498db';
                this.canvas.style.cursor = 'crosshair';
                this.selectionBox.style.display = 'none';
                this.showNotification('屏幕共享已停止');
            }
        });
    }

    startSelection(e) {
        this.isSelecting = true;
        const rect = this.canvas.getBoundingClientRect();
        this.selectionStart = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        
        this.selectionBox.style.display = 'block';
        this.selectionBox.style.left = this.selectionStart.x + 'px';
        this.selectionBox.style.top = this.selectionStart.y + 'px';
        this.selectionBox.style.width = '0px';
        this.selectionBox.style.height = '0px';
        
        this.canvas.addEventListener('mousemove', this.handleSelectionMove);
        this.canvas.addEventListener('mouseup', this.handleSelectionEnd);
    }

    handleSelectionMove = (e) => {
        if (!this.isSelecting) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        
        const width = Math.abs(currentX - this.selectionStart.x);
        const height = Math.abs(currentY - this.selectionStart.y);
        const left = Math.min(currentX, this.selectionStart.x);
        const top = Math.min(currentY, this.selectionStart.y);
        
        this.selectionBox.style.left = left + 'px';
        this.selectionBox.style.top = top + 'px';
        this.selectionBox.style.width = width + 'px';
        this.selectionBox.style.height = height + 'px';
    }

    handleSelectionEnd = () => {
        this.isSelecting = false;
        this.canvas.removeEventListener('mousemove', this.handleSelectionMove);
        this.canvas.removeEventListener('mouseup', this.handleSelectionEnd);
        
        const width = parseInt(this.selectionBox.style.width);
        const height = parseInt(this.selectionBox.style.height);
        
        if (width > 20 && height > 20) {
            this.showNotification(`已选择区域: ${width}x${height}`);
        }
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 24px;
            border-radius: 5px;
            z-index: 1000;
            animation: fadeInOut 3s forwards;
        `;
        notification.textContent = message;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                10% { opacity: 1; transform: translateX(-50%) translateY(0); }
                90% { opacity: 1; transform: translateX(-50%) translateY(0); }
                100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
            style.remove();
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new VirtualClassroom();
});