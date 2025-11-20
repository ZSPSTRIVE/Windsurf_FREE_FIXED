let currentActivationCode = null;
let currentAccount = null;
let activationInfo = null;
let allAccounts = [];

// DOM元素
const elements = {
    machineCode: document.getElementById('machineCode'),
    activationInput: document.getElementById('activationInput'),
    activateBtn: document.getElementById('activateBtn'),
    activationError: document.getElementById('activationError'),
    activationSection: document.getElementById('activationSection'),
    infoSection: document.getElementById('infoSection'),
    activeCode: document.getElementById('activeCode'),
    remainingAccounts: document.getElementById('remainingAccounts'),
    expireDate: document.getElementById('expireDate'),
    daysRemaining: document.getElementById('daysRemaining'),
    deactivateBtn: document.getElementById('deactivateBtn'),
    pickupBtn: document.getElementById('pickupBtn'),
    emptyState: document.getElementById('emptyState'),
    accountsList: document.getElementById('accountsList'),
    totalAccounts: document.getElementById('totalAccounts'),
    currentAccountDetail: document.getElementById('currentAccountDetail'),
    currentEmail: document.getElementById('currentEmail'),
    currentName: document.getElementById('currentName')
};

// 监听来自主进程的 toast 消息
window.addEventListener('show-toast', (event) => {
    const { type, title, message } = event.detail;
    Toast.show(type, title, message);
});

// 初始化
async function init() {
    // 获取机器码
    const machineCode = await window.electronAPI.getMachineCode();
    elements.machineCode.textContent = `机器码：${machineCode}`;

    // 获取存储的数据
    const storedData = await window.electronAPI.getStoredData();
    
    if (storedData.activationCode) {
        currentActivationCode = storedData.activationCode;
        elements.activationInput.value = currentActivationCode;
        await verifyActivation(false);
        
        // 自动获取当前账号信息（优先从 vscdb 数据库读取）
        try {
            const accountResult = await window.electronAPI.getCurrentAccount(currentActivationCode);
            if (accountResult.success && accountResult.data) {
                currentAccount = accountResult.data;
                displayCurrentAccount();
                
                // 如果是从数据库读取的，显示提示
                if (accountResult.data.fromDatabase) {
                    console.log('当前账号信息从 Windsurf 数据库读取');
                }
            }
        } catch (error) {
            console.log('获取当前账号信息失败:', error);
            // 如果获取失败，尝试使用存储的账号
            if (storedData.currentAccount) {
                currentAccount = storedData.currentAccount;
                displayCurrentAccount();
            }
        }
    } else if (storedData.currentAccount) {
        currentAccount = storedData.currentAccount;
        displayCurrentAccount();
    }
}

// 验证激活码
async function verifyActivation(showMessage = true) {
    const code = elements.activationInput.value.trim();
    
    if (!code) {
        showError('请输入激活码');
        return;
    }

    try {
        const result = await window.electronAPI.verifyActivation(code);
        
        if (result.success) {
            currentActivationCode = code;
            activationInfo = result.data;
            
            // 显示激活信息
            displayActivationInfo();
            
            // 加载账号列表
            await loadAccounts();
            
            if (showMessage) {
                Toast.success('成功', '激活码验证成功');
            }
        } else {
            showError(result.message || '激活码验证失败');
            if (result.needActivation) {
                resetToActivation();
            }
        }
    } catch (error) {
        showError(error.message || '验证失败');
    }
}

// 更新剩余时间显示
function updateRemainingTime() {
    if (!activationInfo || !activationInfo.expireDate) return;
    
    const now = new Date();
    const expireDate = new Date(activationInfo.expireDate);
    const msRemaining = expireDate - now;
    
    let remainingText = '';
    
    if (msRemaining <= 0) {
        remainingText = '已过期';
        elements.daysRemaining.style.color = '#ef4444';
        
        // 如果过期了，停止定时器并提示
        if (window.remainingTimeInterval) {
            clearInterval(window.remainingTimeInterval);
        }
        
        // 自动返回激活界面
        setTimeout(() => {
            Toast.error('激活码已过期', '当前激活码已过期，请更换新的激活码');
            resetToActivation();
        }, 1000);
    } else {
        // 计算剩余时间
        const days = Math.floor(msRemaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((msRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((msRemaining % (1000 * 60)) / 1000);
        
        // 构建显示文本
        const parts = [];
        if (days > 0) parts.push(`${days}天`);
        if (hours > 0) parts.push(`${hours}小时`);
        if (minutes > 0) parts.push(`${minutes}分钟`);
        if (seconds > 0 || parts.length === 0) parts.push(`${seconds}秒`);
        
        remainingText = parts.join('');
        
        // 根据剩余时间设置颜色
        if (days === 0 && hours < 1) {
            elements.daysRemaining.style.color = '#ef4444'; // 红色：少于1小时
        } else if (days === 0 && hours < 12) {
            elements.daysRemaining.style.color = '#fca5a5'; // 浅红：少于12小时
        } else if (days < 3) {
            elements.daysRemaining.style.color = '#fcd34d'; // 黄色：少于3天
        } else {
            elements.daysRemaining.style.color = 'inherit'; // 正常颜色
        }
    }
    
    elements.daysRemaining.textContent = remainingText;
}

// 显示激活信息
function displayActivationInfo() {
    elements.activationSection.style.display = 'none';
    elements.infoSection.style.display = 'block';
    
    elements.activeCode.textContent = currentActivationCode;
    elements.remainingAccounts.textContent = activationInfo.remainingAccounts;
    
    // 如果剩余次数为0，显示警告颜色
    if (activationInfo.remainingAccounts === 0) {
        elements.remainingAccounts.style.color = '#ef4444';
        elements.remainingAccounts.textContent = '0 (请更换激活码)';
        // 禁用提号按钮
        if (elements.pickupBtn) {
            elements.pickupBtn.disabled = true;
            elements.pickupBtn.textContent = '提号次数已用完';
        }
    } else {
        elements.remainingAccounts.style.color = 'inherit';
        if (elements.pickupBtn) {
            elements.pickupBtn.disabled = false;
            elements.pickupBtn.innerHTML = '<span class="btn-icon">➕</span>提取新账号';
        }
    }
    
    // 显示完整的过期时间
    const expireDate = new Date(activationInfo.expireDate);
    elements.expireDate.textContent = expireDate.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    // 更新剩余时间显示
    updateRemainingTime();
    
    // 启动定时器实时更新剩余时间
    if (window.remainingTimeInterval) {
        clearInterval(window.remainingTimeInterval);
    }
    window.remainingTimeInterval = setInterval(updateRemainingTime, 1000);
    
    // 显示账号列表区域
    elements.emptyState.style.display = 'none';
    elements.accountsList.style.display = 'block';
}

// 加载账号列表
async function loadAccounts() {
    try {
        const result = await window.electronAPI.getAccounts(currentActivationCode);
        if (result.success) {
            allAccounts = result.data;
            displayAccountsList();
        }
    } catch (error) {
        console.error('Load accounts error:', error);
    }
}

// 显示账号列表
function displayAccountsList() {
    elements.accountsList.innerHTML = '';
    elements.totalAccounts.textContent = allAccounts.length;
    
    if (allAccounts.length === 0) {
        elements.accountsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <div class="empty-text">暂无账号，请先提号</div>
            </div>
        `;
        return;
    }
    
    allAccounts.forEach(account => {
        const accountItem = document.createElement('div');
        accountItem.className = 'account-item';
        
        // 如果是当前账号，添加active类
        if (currentAccount && currentAccount.email === account.email) {
            accountItem.classList.add('active');
        }
        
        accountItem.innerHTML = `
            <div class="account-info">
                <div class="account-email">${account.email}</div>
                <div class="account-name">${account.name}</div>
            </div>
            <div class="account-actions">
                ${currentAccount && currentAccount.email === account.email 
                    ? '<span class="account-status">当前使用</span>'
                    : `<button class="btn btn-switch btn-sm" onclick="switchToAccount(${account.id})">切换</button>`
                }
            </div>
        `;
        
        elements.accountsList.appendChild(accountItem);
    });
}

// 提号
async function pickupAccount() {
    if (!currentActivationCode) {
        showError('请先激活');
        return;
    }
    
    // 显示加载状态
    const pickupBtn = elements.pickupBtn;
    const originalContent = pickupBtn.innerHTML;
    const originalDisabled = pickupBtn.disabled;
    pickupBtn.innerHTML = '<span class="btn-icon">⏳</span>正在提号...';
    pickupBtn.disabled = true;
    
    try {
        const result = await window.electronAPI.pickupAccount(currentActivationCode);
        
        if (result.success) {
            // 不自动设置为当前账号，只是添加到列表
            // currentAccount = result.data;
            // displayCurrentAccount();
            
            // 更新剩余次数
            if (activationInfo) {
                activationInfo.remainingAccounts = result.data.remainingAccounts;
                elements.remainingAccounts.textContent = activationInfo.remainingAccounts;
                
                // 如果次数用完了，更新显示
                if (activationInfo.remainingAccounts === 0) {
                    elements.remainingAccounts.style.color = '#ef4444';
                    elements.remainingAccounts.textContent = '0 (请更换激活码)';
                    if (elements.pickupBtn) {
                        elements.pickupBtn.disabled = true;
                        elements.pickupBtn.textContent = '提号次数已用完';
                    }
                }
            }
            
            // 重新加载账号列表
            await loadAccounts();
            
            Toast.success('成功', '提号成功，请在账号列表中选择使用');
        } else {
            // 根据不同的错误类型显示不同的提示
            if (result.message && result.message.includes('暂无可用账号')) {
                // 账号池为空或已分配完
                let detailMsg = result.message;
                if (result.accountStatus) {
                    detailMsg += `\n账号池状态: 总计${result.accountStatus.total}个, 已分配${result.accountStatus.assigned}个`;
                }
                Toast.warning('暂无可用账号', detailMsg);
                showError('暂无可用账号，请等待管理员添加');
            } else if (result.message && result.message.includes('账号池已空')) {
                // 账号池为空的另一种消息
                Toast.warning('账号池已空', '所有账号已被分配完毕，请联系管理员补充账号');
                showError('账号池已空，请联系管理员');
            } else if (result.message && result.message.includes('已过期')) {
                // 激活码过期
                Toast.error('激活码已过期', '请更换新的激活码');
                showError('激活码已过期');
                setTimeout(() => {
                    resetToActivation();
                }, 2000);
            } else if (result.message && result.message.includes('提号次数已用完')) {
                // 提号次数用完
                Toast.warning('提号次数已用完', '当前激活码的提号次数已用完，请更换新的激活码');
                showError('提号次数已用完');
                if (result.needActivation) {
                    setTimeout(() => {
                        resetToActivation();
                    }, 3000);
                }
            } else if (result.message && result.message.includes('分配冲突')) {
                // 并发冲突，建议重试
                Toast.warning('账号分配冲突', '请重新点击提号按钮');
                showError('账号分配冲突，请重试');
            } else {
                // 其他错误
                showError(result.message || '提号失败');
                Toast.error('提号失败', result.message || '未知错误，请稍后重试');
            }
        }
    } catch (error) {
        showError(error.message || '网络错误');
        Toast.error('网络错误', '无法连接到服务器，请检查网络连接');
    } finally {
        // 恢复按钮状态
        pickupBtn.innerHTML = originalContent;
        pickupBtn.disabled = originalDisabled;
    }
}

// 切换账号
window.switchToAccount = async function(accountId) {
    // 使用非阻塞确认框
    showConfirm(
        '切换账号将执行以下操作：\n\n自动重新启动 Windsurf\n\n整个过程大约需要 5-10 秒\n\n是否继续？',
        async () => {
            // 用户点击确定，执行切换
            try {
        // 显示加载状态
        const switchBtn = document.querySelector(`[onclick="switchToAccount('${accountId}')"]`);
        let originalText = '';
        if (switchBtn) {
            originalText = switchBtn.textContent;
            switchBtn.textContent = '切换中...';
            switchBtn.disabled = true;
        }
        
        const result = await window.electronAPI.switchAccount(currentActivationCode, accountId);
        
        if (result.success) {
            currentAccount = result.data;
            displayCurrentAccount();
            displayAccountsList(); // 刷新列表显示
            
            let successMessage = '✅ 切号成功！\n';
            if (result.machineIdReset) {
                successMessage += '\n✓ 所有机器标识已重置';
            }
            if (result.accountSwitched) {
                successMessage += '\n✓ 账号认证信息已更新';
            }
            if (result.windsurfRestarted) {
                successMessage += '\n✓ Windsurf 正在重新启动';
            }
            successMessage += '\n\n请等待 Windsurf 启动完成';
            
            Toast.success('成功', successMessage);
        } else {
            showError(result.message || '切号失败');
        }
        
        // 恢复按钮状态
        if (switchBtn) {
            switchBtn.textContent = originalText;
            switchBtn.disabled = false;
        }
            } catch (error) {
                showError(error.message || '切号失败');
                // 恢复按钮状态
                const switchBtn = document.querySelector(`[onclick="switchToAccount('${accountId}')"]`);
                if (switchBtn) {
                    switchBtn.textContent = '切换';
                    switchBtn.disabled = false;
                }
            }
        }
    );
}

// 显示当前账号
function displayCurrentAccount() {
    if (!currentAccount) {
        elements.currentAccountDetail.style.display = 'none';
        return;
    }
    
    elements.currentAccountDetail.style.display = 'block';
    elements.currentEmail.textContent = currentAccount.email;
    elements.currentName.textContent = currentAccount.name;
    
    // 保存当前账号
    window.electronAPI.saveCurrentAccount(currentAccount);
}

// 注销激活码
async function deactivate() {
    showConfirm(
        '确定要注销激活码吗？',
        async () => {
            // 清除定时器
            if (window.remainingTimeInterval) {
                clearInterval(window.remainingTimeInterval);
            }
            
            await window.electronAPI.clearActivationCode();
            resetToActivation();
            Toast.info('提示', '已注销激活码');
        }
    );
}

// 重置到激活界面
function resetToActivation() {
    // 清除定时器
    if (window.remainingTimeInterval) {
        clearInterval(window.remainingTimeInterval);
    }
    
    currentActivationCode = null;
    currentAccount = null;
    activationInfo = null;
    allAccounts = [];
    
    elements.activationSection.style.display = 'block';
    elements.infoSection.style.display = 'none';
    elements.activationInput.value = '';
    elements.activationError.textContent = '';
    elements.emptyState.style.display = 'flex';
    elements.accountsList.style.display = 'none';
    elements.currentAccountDetail.style.display = 'none';
    elements.totalAccounts.textContent = '0';
}

// 显示错误信息
function showError(message) {
    elements.activationError.textContent = message;
    setTimeout(() => {
        elements.activationError.textContent = '';
    }, 5000);
}

// 事件监听
elements.activateBtn.addEventListener('click', () => verifyActivation(true));
elements.activationInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') verifyActivation(true);
});
elements.deactivateBtn.addEventListener('click', deactivate);
elements.pickupBtn.addEventListener('click', pickupAccount);

// 初始化应用
init();
