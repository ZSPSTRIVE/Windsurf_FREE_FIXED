// 悬浮提示系统
const Toast = {
    // 显示悬浮提示
    show: function(type, title, message, duration = 5000) {
        const container = document.getElementById('toast-container');
        if (!container) {
            console.error('Toast container not found');
            return;
        }

        // 创建提示元素
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        // 图标映射
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        
        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || icons.info}</div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <div class="toast-progress"></div>
        `;
        
        // 添加到容器
        container.appendChild(toast);
        
        // 点击关闭
        toast.addEventListener('click', () => {
            toast.classList.add('hiding');
            setTimeout(() => {
                toast.remove();
            }, 300);
        });
        
        // 自动关闭
        setTimeout(() => {
            if (toast.parentNode) {
                toast.classList.add('hiding');
                setTimeout(() => {
                    toast.remove();
                }, 300);
            }
        }, duration);
    },

    // 快捷方法
    success: function(title, message, duration) {
        this.show('success', title, message, duration);
    },
    
    error: function(title, message, duration) {
        this.show('error', title, message, duration);
    },
    
    warning: function(title, message, duration) {
        this.show('warning', title, message, duration);
    },
    
    info: function(title, message, duration) {
        this.show('info', title, message, duration);
    }
};

// 替换 confirm 函数
function showConfirm(message, onConfirm, onCancel) {
    // 创建一个模态确认框（非阻塞）
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
    `;
    
    const dialog = document.createElement('div');
    dialog.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        max-width: 400px;
        animation: fadeIn 0.2s ease;
    `;
    
    dialog.innerHTML = `
        <div style="margin-bottom: 20px; font-size: 14px; color: #333; white-space: pre-line;">${message}</div>
        <div style="text-align: right; gap: 10px; display: flex; justify-content: flex-end;">
            <button id="cancelBtn" style="padding: 8px 16px; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer;">取消</button>
            <button id="confirmBtn" style="padding: 8px 16px; border: none; border-radius: 4px; background: #667eea; color: white; cursor: pointer;">确定</button>
        </div>
    `;
    
    modal.appendChild(dialog);
    document.body.appendChild(modal);
    
    // 绑定事件
    dialog.querySelector('#confirmBtn').onclick = () => {
        modal.remove();
        if (onConfirm) onConfirm();
    };
    
    dialog.querySelector('#cancelBtn').onclick = () => {
        modal.remove();
        if (onCancel) onCancel();
    };
    
    // 点击背景关闭
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
            if (onCancel) onCancel();
        }
    };
}

// 导出给其他文件使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Toast, showConfirm };
}
