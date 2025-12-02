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
            success: '+',
            error: 'x',
            warning: '!',
            info: 'i'
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
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(5px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
    `;
    
    const dialog = document.createElement('div');
    dialog.style.cssText = `
        background: #FFFFFF;
        padding: 32px;
        border: 3px solid #000;
        box-shadow: 8px 8px 0 #000;
        max-width: 400px;
        animation: fadeIn 0.2s ease-out;
        color: #000;
        position: relative;
    `;
    
    dialog.innerHTML = `
        <div style="margin-bottom: 24px; font-size: 18px; color: #000; white-space: pre-line; line-height: 1.5; font-weight: 800; text-transform: uppercase;">${message}</div>
        <div style="text-align: right; gap: 16px; display: flex; justify-content: flex-end;">
            <button id="cancelBtn" style="padding: 12px 24px; border: 3px solid #000; background: #FFF; color: #000; cursor: pointer; font-size: 16px; font-weight: 800; transition: all 0.1s; box-shadow: 4px 4px 0 #000;">\u53d6 \u6d88</button>\n            <button id="confirmBtn" style="padding: 12px 32px; border: 3px solid #000; background: #FFD600; color: #000; cursor: pointer; font-size: 16px; font-weight: 800; transition: all 0.1s; box-shadow: 4px 4px 0 #000;">\u786e \u5b9a</button>
        </div>
    `;
    
    // 添加按钮交互效果
    setTimeout(() => {
        const btns = dialog.querySelectorAll('button');
        btns.forEach(btn => {
            btn.onmousedown = () => {
                btn.style.transform = 'translate(2px, 2px)';
                btn.style.boxShadow = '2px 2px 0 #000';
            };
            btn.onmouseup = () => {
                btn.style.transform = 'none';
                btn.style.boxShadow = '4px 4px 0 #000';
            };
        });
    }, 0);
    
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
