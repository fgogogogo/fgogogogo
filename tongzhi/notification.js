/**
 * 交互式通知系统
 * 支持多种类型、优先级、动画效果和手动关闭
 */
class NotificationSystem {
  constructor() {
    // 默认配置
    this.config = {
      // 基础显示时长（毫秒）
      duration: {
        low: 3000,      // 低优先级：3秒
        normal: 5000,   // 普通优先级：5秒
        high: 8000,     // 高优先级：8秒
        critical: 15000 // 紧急优先级：15秒
      },
      // 位置配置
      position: 'top-right',
      // 最大显示数量
      maxNotifications: 5,
      // 是否允许重复通知
      allowDuplicates: true,
      // 动画配置
      animation: {
        enter: 'slide-in',
        exit: 'slide-out'
      }
    };

    // 存储当前活动的通知
    this.activeNotifications = [];

    // 创建通知容器
    this.container = this.createContainer();

    // 图标配置
    this.icons = {
      success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
      error: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
      warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
      info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
      close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
    };

    // 绑定方法
    this.show = this.show.bind(this);
    this.close = this.close.bind(this);
    this.closeAll = this.closeAll.bind(this);
  }

  /**
   * 创建通知容器
   */
  createContainer() {
    let container = document.querySelector('.notification-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'notification-container';
      document.body.appendChild(container);
    }
    return container;
  }

  /**
   * 生成唯一ID
   */
  generateId() {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 显示通知
   * @param {Object} options - 通知配置
   * @param {string} options.type - 通知类型: 'success' | 'error' | 'warning' | 'info'
   * @param {string} options.title - 通知标题
   * @param {string} options.message - 通知内容
   * @param {string} options.priority - 优先级: 'low' | 'normal' | 'high' | 'critical'
   * @param {number} options.duration - 自定义显示时长（毫秒）
   * @param {boolean} options.showProgress - 是否显示进度条
   * @param {Function} options.onClose - 关闭回调
   * @param {Function} options.onClick - 点击回调
   * @returns {string} 通知ID
   */
  show(options = {}) {
    const {
      type = 'info',
      title = '',
      message = '',
      priority = 'normal',
      duration,
      showProgress = true,
      onClose,
      onClick
    } = options;

    // 检查最大数量限制
    if (this.activeNotifications.length >= this.config.maxNotifications) {
      // 关闭最早的通知
      const oldest = this.activeNotifications[0];
      this.close(oldest.id);
    }

    // 创建通知元素
    const id = this.generateId();
    const notificationEl = document.createElement('div');
    notificationEl.className = `notification ${type} ${priority === 'high' || priority === 'critical' ? 'high-priority' : ''}`;
    notificationEl.id = id;

    // 计算显示时长
    const displayDuration = duration || this.config.duration[priority] || this.config.duration.normal;

    // 构建通知HTML
    notificationEl.innerHTML = `
      <div class="notification-icon">${this.icons[type]}</div>
      <div class="notification-content">
        ${title ? `<h4 class="notification-title">${this.escapeHtml(title)}</h4>` : ''}
        ${message ? `<p class="notification-message">${this.escapeHtml(message)}</p>` : ''}
      </div>
      <button class="notification-close" aria-label="关闭通知">${this.icons.close}</button>
      ${showProgress ? `<div class="notification-progress"></div>` : ''}
    `;

    // 存储通知信息
    const notification = {
      id,
      element: notificationEl,
      priority,
      duration: displayDuration,
      startTime: Date.now(),
      timer: null,
      progressAnimation: null,
      onClose,
      onClick
    };

    // 添加到活动通知列表
    this.activeNotifications.push(notification);

    // 添加到DOM
    this.container.appendChild(notificationEl);

    // 触发进入动画
    requestAnimationFrame(() => {
      notificationEl.classList.add('slide-in');
    });

    // 绑定事件
    this.bindEvents(notification);

    // 启动自动关闭计时器
    this.startTimer(notification, showProgress);

    return id;
  }

  /**
   * 绑定通知事件
   */
  bindEvents(notification) {
    const { element, onClick } = notification;

    // 点击通知本身
    element.addEventListener('click', (e) => {
      // 排除关闭按钮的点击
      if (!e.target.closest('.notification-close')) {
        if (onClick) onClick(notification);
      }
    });

    // 关闭按钮
    const closeBtn = element.querySelector('.notification-close');
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.close(notification.id);
    });

    // 鼠标悬停时暂停计时
    element.addEventListener('mouseenter', () => {
      this.pauseTimer(notification);
    });

    element.addEventListener('mouseleave', () => {
      this.resumeTimer(notification);
    });
  }

  /**
   * 启动计时器
   */
  startTimer(notification, showProgress) {
    const { element, duration } = notification;

    // 进度条动画
    if (showProgress) {
      const progressBar = element.querySelector('.notification-progress');
      if (progressBar) {
        progressBar.style.width = '100%';
        progressBar.style.transition = `width ${duration}ms linear`;

        requestAnimationFrame(() => {
          progressBar.style.width = '0%';
        });
      }
    }

    // 设置关闭定时器
    notification.timer = setTimeout(() => {
      this.close(notification.id);
    }, duration);
  }

  /**
   * 暂停计时器（鼠标悬停）
   */
  pauseTimer(notification) {
    if (notification.timer) {
      clearTimeout(notification.timer);
      notification.timer = null;

      // 暂停进度条动画
      const progressBar = notification.element.querySelector('.notification-progress');
      if (progressBar) {
        const computedStyle = window.getComputedStyle(progressBar);
        const width = computedStyle.getPropertyValue('width');
        progressBar.style.transition = 'none';
        progressBar.style.width = width;
      }

      // 记录剩余时间
      notification.remainingTime = notification.duration - (Date.now() - notification.startTime);
    }
  }

  /**
   * 恢复计时器（鼠标离开）
   */
  resumeTimer(notification) {
    if (!notification.timer && notification.remainingTime > 0) {
      // 恢复进度条动画
      const progressBar = notification.element.querySelector('.notification-progress');
      if (progressBar) {
        progressBar.style.transition = `width ${notification.remainingTime}ms linear`;
        progressBar.style.width = '0%';
      }

      // 设置新的定时器
      notification.timer = setTimeout(() => {
        this.close(notification.id);
      }, notification.remainingTime);
    }
  }

  /**
   * 关闭指定通知
   */
  close(id) {
    const index = this.activeNotifications.findIndex(n => n.id === id);
    if (index === -1) return;

    const notification = this.activeNotifications[index];
    const { element, timer, onClose } = notification;

    // 清除计时器
    if (timer) clearTimeout(timer);

    // 执行关闭回调
    if (onClose) onClose(notification);

    // 从活动列表中移除
    this.activeNotifications.splice(index, 1);

    // 执行滑出动画
    element.classList.remove('slide-in');
    element.classList.add('slide-out');

    // 动画结束后移除DOM
    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }, 400);
  }

  /**
   * 关闭所有通知
   */
  closeAll() {
    // 复制数组避免遍历时修改
    const notifications = [...this.activeNotifications];
    notifications.forEach(n => this.close(n.id));
  }

  /**
   * HTML转义防止XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ===== 便捷方法 =====

  /**
   * 显示成功通知
   */
  success(message, title = '', options = {}) {
    return this.show({
      type: 'success',
      title,
      message,
      ...options
    });
  }

  /**
   * 显示错误通知
   */
  error(message, title = '', options = {}) {
    return this.show({
      type: 'error',
      title,
      message,
      priority: 'high',
      ...options
    });
  }

  /**
   * 显示警告通知
   */
  warning(message, title = '', options = {}) {
    return this.show({
      type: 'warning',
      title,
      message,
      priority: options.priority || 'normal',
      ...options
    });
  }

  /**
   * 显示信息通知
   */
  info(message, title = '', options = {}) {
    return this.show({
      type: 'info',
      title,
      message,
      priority: options.priority || 'low',
      ...options
    });
  }

  /**
   * 更新配置
   */
  configure(options) {
    this.config = { ...this.config, ...options };
  }
}

// 创建全局通知系统实例
const notify = new NotificationSystem();

// 支持多种导出方式
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NotificationSystem, notify };
}

if (typeof window !== 'undefined') {
  window.NotificationSystem = NotificationSystem;
  window.notify = notify;
}
