/**
 * 历史记录管理器
 * 实现撤销/重做功能
 */

class HistoryManager {
    constructor(maxSize = 50) {
        this.history = [];
        this.currentIndex = -1;
        this.maxSize = maxSize;
        this.listeners = [];
    }

    /**
     * 添加新的状态到历史记录
     * @param {*} state - 要保存的状态
     */
    push(state) {
        // 如果当前不在历史记录的末尾，删除当前位置之后的历史
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }

        // 添加新状态
        this.history.push(JSON.parse(JSON.stringify(state)));
        this.currentIndex++;

        // 限制历史记录大小
        if (this.history.length > this.maxSize) {
            this.history.shift();
            this.currentIndex--;
        }

        this._notifyListeners();
    }

    /**
     * 撤销操作
     * @returns {*} 撤销后的状态，如果无法撤销则返回 null
     */
    undo() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this._notifyListeners();
            return JSON.parse(JSON.stringify(this.history[this.currentIndex]));
        }
        return null;
    }

    /**
     * 重做操作
     * @returns {*} 重做后的状态，如果无法重做则返回 null
     */
    redo() {
        if (this.currentIndex < this.history.length - 1) {
            this.currentIndex++;
            this._notifyListeners();
            return JSON.parse(JSON.stringify(this.history[this.currentIndex]));
        }
        return null;
    }

    /**
     * 获取当前状态
     * @returns {*} 当前状态
     */
    getCurrentState() {
        if (this.currentIndex >= 0) {
            return JSON.parse(JSON.stringify(this.history[this.currentIndex]));
        }
        return null;
    }

    /**
     * 是否可以撤销
     * @returns {boolean}
     */
    canUndo() {
        return this.currentIndex > 0;
    }

    /**
     * 是否可以重做
     * @returns {boolean}
     */
    canRedo() {
        return this.currentIndex < this.history.length - 1;
    }

    /**
     * 清空历史记录
     */
    clear() {
        this.history = [];
        this.currentIndex = -1;
        this._notifyListeners();
    }

    /**
     * 添加状态变化监听器
     * @param {Function} callback - 回调函数
     */
    addListener(callback) {
        this.listeners.push(callback);
    }

    /**
     * 移除状态变化监听器
     * @param {Function} callback - 回调函数
     */
    removeListener(callback) {
        this.listeners = this.listeners.filter(cb => cb !== callback);
    }

    /**
     * 通知所有监听器
     * @private
     */
    _notifyListeners() {
        const state = {
            canUndo: this.canUndo(),
            canRedo: this.canRedo(),
            currentState: this.getCurrentState()
        };

        this.listeners.forEach(callback => {
            try {
                callback(state);
            } catch (e) {
                console.error('History listener error:', e);
            }
        });
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HistoryManager };
}
