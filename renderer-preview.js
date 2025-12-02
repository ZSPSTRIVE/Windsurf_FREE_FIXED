/**
 * UI预览版本的渲染器
 * 所有功能代码已注释，仅用于查看界面效果
 * 使用 npm run dev 启动后在浏览器中查看
 */

// ==================== 模拟数据 ====================
const MOCK_DATA = {
    machineCode: 'MOCK-ABC123-DEF456-GHI789',
    activationCode: 'TEST-ACTIVATION-CODE',
    activationInfo: {
        remainingAccounts: 10,
        expireDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30天后
    },
    accounts: [
        { id: 1, email: 'user1@example.com', name: 'USER_01' },
        { id: 2, email: 'user2@example.com', name: 'USER_02' },
        { id: 3, email: 'user3@example.com', name: 'USER_03' },
        { id: 4, email: 'user4@example.com', name: 'USER_04' },
        { id: 5, email: 'user5@example.com', name: 'USER_05' },
        { id: 6, email: 'user6@example.com', name: 'USER_06' },
        { id: 7, email: 'user7@example.com', name: 'USER_07' },
        { id: 8, email: 'user8@example.com', name: 'USER_08' },
        { id: 9, email: 'user9@example.com', name: 'USER_09' },
        { id: 10, email: 'user10@example.com', name: 'USER_10' },
        { id: 11, email: 'user11@example.com', name: 'USER_11' },
        { id: 12, email: 'user12@example.com', name: 'USER_12' }
    ],
    currentAccount: { id: 1, email: 'user1@example.com', name: '用户1' }
};

// ==================== 状态变量 ====================
let currentActivationCode = null;
let currentAccount = null;
let activationInfo = null;
let allAccounts = [];

// 分页配置
let currentPage = 1;
const ITEMS_PER_PAGE = 6;

// ==================== DOM元素 ====================
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

// ==================== 初始化 ====================
async function init() {
    // 显示模拟机器码
    elements.machineCode.textContent = `机器码：${MOCK_DATA.machineCode}`;
    
    // 【原功能代码已注释】
    // const machineCode = await window.electronAPI.getMachineCode();
    // elements.machineCode.textContent = `DEVICE ID: ${machineCode}`;
    // const storedData = await window.electronAPI.getStoredData();
    // ... 其他初始化逻辑 ...
    
    console.log('[UI预览模式] 初始化完成，输入任意激活码即可预览激活后界面');
}

// ==================== 验证激活码 ====================
async function verifyActivation(showMessage = true) {
    const code = elements.activationInput.value.trim();
    
    if (!code) {
        showError('请输入激活码');
        return;
    }

    // 【模拟验证成功】
    currentActivationCode = code;
    activationInfo = MOCK_DATA.activationInfo;
    allAccounts = MOCK_DATA.accounts;
    currentAccount = MOCK_DATA.currentAccount;
    
    displayActivationInfo();
    displayAccountsList();
    displayCurrentAccount();
    
    if (showMessage) {
        Toast.success('成功', '[UI预览] 激活码验证成功');
    }

    // 【原功能代码已注释】
    // try {
    //     const result = await window.electronAPI.verifyActivation(code);
    //     if (result.success) {
    //         currentActivationCode = code;
    //         activationInfo = result.data;
    //         displayActivationInfo();
    //         await loadAccounts();
    //         if (showMessage) {
    //             Toast.success('成功', '激活码验证成功');
    //         }
    //     } else {
    //         showError(result.message || '激活码验证失败');
    //     }
    // } catch (error) {
    //     showError(error.message || '验证失败');
    // }
}

// ==================== 显示激活信息 ====================
function displayActivationInfo() {
    elements.activationSection.style.display = 'none';
    elements.infoSection.style.display = 'block';
    
    elements.activeCode.textContent = currentActivationCode;
    elements.remainingAccounts.textContent = activationInfo.remainingAccounts;
    
    if (activationInfo.remainingAccounts === 0) {
        elements.remainingAccounts.style.color = '#ef4444';
        elements.remainingAccounts.textContent = '0 (请更换激活码)';
        if (elements.pickupBtn) {
            elements.pickupBtn.disabled = true;
            elements.pickupBtn.textContent = '提号次数已用完';
        }
    } else {
        elements.remainingAccounts.style.color = 'inherit';
        if (elements.pickupBtn) {
            elements.pickupBtn.disabled = false;
            elements.pickupBtn.innerHTML = '<span class="btn-icon">+</span>提取新账号';
        }
    }
    
    const expireDate = new Date(activationInfo.expireDate);
    elements.expireDate.textContent = expireDate.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    updateRemainingTime();
    
    if (window.remainingTimeInterval) {
        clearInterval(window.remainingTimeInterval);
    }
    window.remainingTimeInterval = setInterval(updateRemainingTime, 1000);
    
    elements.emptyState.style.display = 'none';
    elements.accountsList.style.display = 'block';
}

// ==================== 更新剩余时间 ====================
function updateRemainingTime() {
    if (!activationInfo || !activationInfo.expireDate) return;
    
    const now = new Date();
    const expireDate = new Date(activationInfo.expireDate);
    const msRemaining = expireDate - now;
    
    let remainingText = '';
    
    if (msRemaining <= 0) {
        remainingText = '已过期';
        elements.daysRemaining.style.color = '#ef4444';
    } else {
        const days = Math.floor(msRemaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((msRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((msRemaining % (1000 * 60)) / 1000);
        
        const parts = [];
        if (days > 0) parts.push(`${days}天`);
        if (hours > 0) parts.push(`${hours}小时`);
        if (minutes > 0) parts.push(`${minutes}分钟`);
        if (seconds > 0 || parts.length === 0) parts.push(`${seconds}秒`);
        
        remainingText = parts.join('');
        
        if (days === 0 && hours < 1) {
            elements.daysRemaining.style.color = '#ef4444';
        } else if (days === 0 && hours < 12) {
            elements.daysRemaining.style.color = '#fca5a5';
        } else if (days < 3) {
            elements.daysRemaining.style.color = '#fcd34d';
        } else {
            elements.daysRemaining.style.color = 'inherit';
        }
    }
    
    elements.daysRemaining.textContent = remainingText;
}

// ==================== 显示账号列表（带分页） ====================
function displayAccountsList() {
    elements.accountsList.innerHTML = '';
    elements.totalAccounts.textContent = allAccounts.length;
    
    if (allAccounts.length === 0) {
        elements.accountsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">!</div>
                <div class="empty-text">暂无账号，请先提号</div>
            </div>
        `;
        hidePagination();
        return;
    }
    
    // 计算分页
    const totalPages = Math.ceil(allAccounts.length / ITEMS_PER_PAGE);
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;
    
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const pageAccounts = allAccounts.slice(startIndex, endIndex);
    
    pageAccounts.forEach(account => {
        const accountItem = document.createElement('div');
        accountItem.className = 'account-item';
        
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
    
    // 更新分页控件
    updatePagination(totalPages);
}

// 更新分页控件
function updatePagination(totalPages) {
    const paginationEl = document.getElementById('pagination');
    if (!paginationEl) return;
    
    if (totalPages <= 1) {
        paginationEl.style.display = 'none';
        return;
    }
    
    paginationEl.style.display = 'flex';
    
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    const pageInfo = document.getElementById('pageInfo');
    
    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
    if (pageInfo) pageInfo.textContent = `${currentPage} / ${totalPages}`;
}

// 隐藏分页
function hidePagination() {
    const paginationEl = document.getElementById('pagination');
    if (paginationEl) paginationEl.style.display = 'none';
}

// 上一页
function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        displayAccountsList();
    }
}

// 下一页
function nextPage() {
    const totalPages = Math.ceil(allAccounts.length / ITEMS_PER_PAGE);
    if (currentPage < totalPages) {
        currentPage++;
        displayAccountsList();
    }
}

// 全局暴露分页函数
window.prevPage = prevPage;
window.nextPage = nextPage;

// ==================== 提号（模拟） ====================
async function pickupAccount() {
    if (!currentActivationCode) {
        showError('请先激活');
        return;
    }
    
    const pickupBtn = elements.pickupBtn;
    const originalContent = pickupBtn.innerHTML;
    pickupBtn.innerHTML = '<span class="btn-icon">...</span>正在提号...';
    pickupBtn.disabled = true;
    
    // 【模拟提号】
    setTimeout(() => {
        const newId = allAccounts.length + 1;
        const newAccount = {
            id: newId,
            email: `newuser${newId}@example.com`,
            name: `新用户${newId}`
        };
        allAccounts.push(newAccount);
        
        if (activationInfo) {
            activationInfo.remainingAccounts--;
            elements.remainingAccounts.textContent = activationInfo.remainingAccounts;
        }
        
        displayAccountsList();
        Toast.success('成功', '[UI预览] 提号成功');
        
        pickupBtn.innerHTML = originalContent;
        pickupBtn.disabled = false;
    }, 1000);

    // 【原功能代码已注释】
    // try {
    //     const result = await window.electronAPI.pickupAccount(currentActivationCode);
    //     if (result.success) {
    //         activationInfo.remainingAccounts = result.data.remainingAccounts;
    //         await loadAccounts();
    //         Toast.success('成功', '提号成功');
    //     } else {
    //         showError(result.message || '提号失败');
    //     }
    // } catch (error) {
    //     showError(error.message || '网络错误');
    // }
}

// ==================== 切换账号（模拟） ====================
window.switchToAccount = async function(accountId) {
    showConfirm(
        '切换账号将执行以下操作：\n\n自动重新启动 Windsurf\n\n整个过程大约需要 5-10 秒\n\n是否继续？',
        async () => {
            // 【模拟切换】
            const account = allAccounts.find(a => a.id === accountId);
            if (account) {
                currentAccount = account;
                displayCurrentAccount();
                displayAccountsList();
                Toast.success('成功', '[UI预览] 切号成功');
            }

            // 【原功能代码已注释】
            // const result = await window.electronAPI.switchAccount(currentActivationCode, accountId);
            // if (result.success) {
            //     currentAccount = result.data;
            //     displayCurrentAccount();
            //     displayAccountsList();
            //     Toast.success('成功', '切号成功');
            // }
        }
    );
}

// ==================== 显示当前账号 ====================
function displayCurrentAccount() {
    if (!currentAccount) {
        elements.currentAccountDetail.style.display = 'none';
        return;
    }
    
    elements.currentAccountDetail.style.display = 'block';
    elements.currentEmail.textContent = currentAccount.email;
    elements.currentName.textContent = currentAccount.name;
    
    // 【原功能代码已注释】
    // window.electronAPI.saveCurrentAccount(currentAccount);
}

// ==================== 注销激活码 ====================
async function deactivate() {
    showConfirm(
        '确定要注销激活码吗？',
        async () => {
            if (window.remainingTimeInterval) {
                clearInterval(window.remainingTimeInterval);
            }
            
            // 【原功能代码已注释】
            // await window.electronAPI.clearActivationCode();
            
            resetToActivation();
            Toast.info('提示', '[UI预览] 已注销激活码');
        }
    );
}

// ==================== 重置到激活界面 ====================
function resetToActivation() {
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

// ==================== 显示错误信息 ====================
function showError(message) {
    elements.activationError.textContent = message;
    setTimeout(() => {
        elements.activationError.textContent = '';
    }, 5000);
}

// ==================== 加载账号列表（模拟） ====================
async function loadAccounts() {
    // 【模拟加载】
    allAccounts = MOCK_DATA.accounts;
    displayAccountsList();

    // 【原功能代码已注释】
    // try {
    //     const result = await window.electronAPI.getAccounts(currentActivationCode);
    //     if (result.success) {
    //         allAccounts = result.data;
    //         displayAccountsList();
    //     }
    // } catch (error) {
    //     console.error('Load accounts error:', error);
    // }
}

// ==================== 事件监听 ====================
elements.activateBtn.addEventListener('click', () => verifyActivation(true));
elements.activationInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') verifyActivation(true);
});
elements.deactivateBtn.addEventListener('click', deactivate);
elements.pickupBtn.addEventListener('click', pickupAccount);

// ==================== 初始化应用 ====================
init();

console.log('%c[UI预览模式]', 'color: #667eea; font-weight: bold;', 
    '当前为UI预览模式，所有功能均为模拟数据。\n' +
    '输入任意激活码即可预览激活后的界面效果。'
);
