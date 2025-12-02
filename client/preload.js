const { contextBridge, ipcRenderer } = require('electron');

// 监听主进程发送的 toast 消息
ipcRenderer.on('show-toast', (event, type, title, message) => {
  // 触发一个自定义事件，让渲染进程处理
  window.dispatchEvent(new CustomEvent('show-toast', {
    detail: { type, title, message }
  }));
});

contextBridge.exposeInMainWorld('electronAPI', {
  getMachineCode: () => ipcRenderer.invoke('get-machine-code'),
  getStoredData: () => ipcRenderer.invoke('get-stored-data'),
  saveActivationCode: (code) => ipcRenderer.invoke('save-activation-code', code),
  clearActivationCode: () => ipcRenderer.invoke('clear-activation-code'),
  saveCurrentAccount: (account) => ipcRenderer.invoke('save-current-account', account),
  verifyActivation: (code) => ipcRenderer.invoke('verify-activation', code),
  pickupAccount: (code) => ipcRenderer.invoke('pickup-account', code),
  getAccounts: (code) => ipcRenderer.invoke('get-accounts', code),
  switchAccount: (code, accountId) => ipcRenderer.invoke('switch-account', code, accountId),
  getCurrentAccount: (code) => ipcRenderer.invoke('get-current-account', code),
  showMessage: (type, title, message) => ipcRenderer.invoke('show-message', type, title, message)
});
