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
    currentName: document.getElementById('currentName'),
    currentApiKey: document.getElementById('currentApiKey'),
    toggleApiKey: document.getElementById('toggleApiKey'),
    copyApiKey: document.getElementById('copyApiKey')
};

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
    }

    if (storedData.currentAccount) {
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
                window.electronAPI.showMessage('info', '成功', '激活码验证成功');
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

// 显示激活信息
function displayActivationInfo() {
    elements.activationSection.style.display = 'none';
    elements.infoSection.style.display = 'block';
    
    elements.activeCode.textContent = currentActivationCode;
    elements.remainingAccounts.textContent = activationInfo.remainingAccounts;
    elements.expireDate.textContent = new Date(activationInfo.expireDate).toLocaleDateString('zh-CN');
    elements.daysRemaining.textContent = `${activationInfo.daysRemaining}天`;
    
    // 根据剩余天数设置颜色
    if (activationInfo.daysRemaining <= 3) {
        elements.daysRemaining.style.color = '#fca5a5';
    } else if (activationInfo.daysRemaining <= 7) {
        elements.daysRemaining.style.color = '#fcd34d';
    } else {
        elements.daysRemaining.style.color = 'inherit';
    }
    
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
    
    try {
        const result = await window.electronAPI.pickupAccount(currentActivationCode);
        
        if (result.success) {
            currentAccount = result.data;
            displayCurrentAccount();
            
            // 更新剩余次数
            if (activationInfo) {
                activationInfo.remainingAccounts = result.data.remainingAccounts;
                elements.remainingAccounts.textContent = activationInfo.remainingAccounts;
            }
            
            // 重新加载账号列表
            await loadAccounts();
            
            window.electronAPI.showMessage('info', '成功', '提号成功');
        } else {
            showError(result.message || '提号失败');
            if (result.remainingAccounts === 0) {
                window.electronAPI.showMessage('warning', '提示', '提号次数已用完');
            }
        }
    } catch (error) {
        showError(error.message || '提号失败');
    }
}

// 切换账号
window.switchToAccount = async function(accountId) {
    try {
        const result = await window.electronAPI.switchAccount(currentActivationCode, accountId);
        
        if (result.success) {
            currentAccount = result.data;
            displayCurrentAccount();
            displayAccountsList(); // 刷新列表显示
            window.electronAPI.showMessage('info', '成功', '切号成功');
        } else {
            showError(result.message || '切号失败');
        }
    } catch (error) {
        showError(error.message || '切号失败');
    }
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
    elements.currentApiKey.value = currentAccount.apiKey || currentAccount.api_key;
    
    // 保存当前账号
    window.electronAPI.saveCurrentAccount(currentAccount);
}

// 注销激活码
async function deactivate() {
    if (confirm('确定要注销激活码吗？')) {
        await window.electronAPI.clearActivationCode();
        resetToActivation();
        window.electronAPI.showMessage('info', '提示', '已注销激活码');
    }
}

// 重置到激活界面
function resetToActivation() {
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

// 切换API Key显示
let apiKeyVisible = false;
function toggleApiKeyVisibility() {
    apiKeyVisible = !apiKeyVisible;
    elements.currentApiKey.type = apiKeyVisible ? 'text' : 'password';
    elements.toggleApiKey.textContent = apiKeyVisible ? '🙈' : '👁';
}

// 复制API Key
function copyApiKey() {
    if (!currentAccount) return;
    
    const apiKey = currentAccount.apiKey || currentAccount.api_key;
    navigator.clipboard.writeText(apiKey).then(() => {
        window.electronAPI.showMessage('info', '成功', 'API Key已复制到剪贴板');
    }).catch(() => {
        showError('复制失败');
    });
}

// 事件监听
elements.activateBtn.addEventListener('click', () => verifyActivation(true));
elements.activationInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') verifyActivation(true);
});
elements.deactivateBtn.addEventListener('click', deactivate);
elements.pickupBtn.addEventListener('click', pickupAccount);
elements.toggleApiKey.addEventListener('click', toggleApiKeyVisibility);
elements.copyApiKey.addEventListener('click', copyApiKey);

// 初始化应用
init();
