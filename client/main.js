const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const Store = require('electron-store');
const crypto = require('crypto');
const os = require('os');
const api = require('./api');
const fs = require('fs').promises;
const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);
const initSqlJs = require('sql.js');
let SQL = null;

// 初始化 sql.js
async function getSqlJs() {
  if (!SQL) {
    SQL = await initSqlJs();
  }
  return SQL;
}

const store = new Store();
let mainWindow;
let machineCode;

// 获取机器码 - 使用系统信息生成
async function getMachineCode() {
  try {
    // 使用系统信息生成唯一机器码
    const cpus = os.cpus();
    const networkInterfaces = os.networkInterfaces();
    const hostname = os.hostname();
    const platform = os.platform();
    
    // 获取第一个非本地MAC地址
    let macAddress = '';
    for (const name of Object.keys(networkInterfaces)) {
      for (const net of networkInterfaces[name]) {
        if (!net.internal && net.mac && net.mac !== '00:00:00:00:00:00') {
          macAddress = net.mac;
          break;
        }
      }
      if (macAddress) break;
    }
    
    // 组合信息生成机器码
    const machineInfo = `${hostname}-${platform}-${macAddress || 'no-mac'}-${cpus[0]?.model || 'unknown'}`;
    machineCode = crypto.createHash('md5').update(machineInfo).digest('hex').toUpperCase().substring(0, 16);
    
    console.log('Generated machine code:', machineCode);
    return machineCode;
  } catch (error) {
    console.error('Failed to get machine code:', error);
    // 生成一个随机的机器码作为后备
    machineCode = crypto.randomBytes(8).toString('hex').toUpperCase();
    return machineCode;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    title: 'WindSurf续杯工具'
  });

  mainWindow.loadFile('index.html');

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 禁用 Windsurf 自动更新
async function disableWindsurfAutoUpdate() {
  try {
    // 动态获取 Windsurf 用户配置路径
    const windsurfUserPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Windsurf', 'User');
    const settingsPath = path.join(windsurfUserPath, 'settings.json');
    
    // 确保目录存在
    await fs.mkdir(windsurfUserPath, { recursive: true });
    
    let settings = {};
    
    // 尝试读取现有设置
    try {
      const settingsContent = await fs.readFile(settingsPath, 'utf8');
      settings = JSON.parse(settingsContent);
    } catch (error) {
      // 文件不存在或解析失败，使用空对象
      console.log('Settings file not found or invalid, creating new one');
    }
    
    // 添加/更新禁用更新的设置
    const updateSettings = {
      ...settings,
      "update.mode": "none",
      "extensions.autoUpdate": false,
      "extensions.autoCheckUpdates": false,
      "update.enableWindowsBackgroundUpdates": false,
      "telemetry.enableTelemetry": false,
      "telemetry.enableCrashReporter": false
    };
    
    // 写入更新后的设置
    await fs.writeFile(settingsPath, JSON.stringify(updateSettings, null, 2));
    console.log('✓ Windsurf auto-update disabled successfully');
    console.log(`Settings saved to: ${settingsPath}`);
    
    return true;
  } catch (error) {
    console.error('Failed to disable Windsurf auto-update:', error);
    return false;
  }
}

app.whenReady().then(async () => {
  await getMachineCode();
  // 在应用启动时自动禁用 Windsurf 更新
  await disableWindsurfAutoUpdate();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC通信处理
ipcMain.handle('get-machine-code', async () => {
  return machineCode;
});

ipcMain.handle('get-stored-data', () => {
  return {
    activationCode: store.get('activationCode'),
    currentAccount: store.get('currentAccount')
  };
});

ipcMain.handle('save-activation-code', (event, code) => {
  store.set('activationCode', code);
  return true;
});

ipcMain.handle('clear-activation-code', () => {
  store.delete('activationCode');
  store.delete('currentAccount');
  return true;
});

ipcMain.handle('save-current-account', (event, account) => {
  store.set('currentAccount', account);
  return true;
});

// API调用
ipcMain.handle('verify-activation', async (event, activationCode) => {
  try {
    const result = await api.verifyActivation(activationCode, machineCode);
    if (result.success) {
      store.set('activationCode', activationCode);
    }
    return result;
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('pickup-account', async (event, activationCode) => {
  try {
    const result = await api.pickupAccount(activationCode, machineCode);
    if (result.success) {
      store.set('currentAccount', result.data);
    }
    return result;
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('get-accounts', async (event, activationCode) => {
  try {
    const result = await api.getAccounts(activationCode, machineCode);
    return result;
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('switch-account', async (event, activationCode, accountId) => {
  try {
    // 先检查并关闭 Windsurf（提前关闭，避免文件占用）
    console.log('准备切换账号，检查 Windsurf 状态...');
    await closeWindsurf();
    
    // 从后端获取账号信息进行切换
    const result = await api.switchAccount(activationCode, machineCode, accountId);
    if (!result.success) {
      return result;
    }
    
    // 获取账号详细信息
    const accountData = result.data;
    
    // 重置 Windsurf 机器码并更新账号信息（此时 Windsurf 已关闭）
    const resetResult = await resetWindsurfAndSwitchAccount(accountData);
    if (!resetResult.success) {
      return { success: false, message: '重置机器码和切换账号失败: ' + resetResult.message };
    }
    
    // 保存当前账号
    store.set('currentAccount', accountData);
    
    return {
      success: true,
      data: accountData,
      message: '切号成功',
      machineIdReset: true,
      accountSwitched: true,
      windsurfRestarted: true
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('get-current-account', async (event, activationCode) => {
  try {
    // 先尝试从 vscdb 数据库读取当前账号信息
    const windsurfPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Windsurf');
    const vscdbPath = path.join(windsurfPath, 'User', 'globalStorage', 'state.vscdb');
    
    try {
      const SQL = await getSqlJs();
      const fsSync = require('fs');
      const dbBuffer = fsSync.readFileSync(vscdbPath);
      const db = new SQL.Database(dbBuffer);
      
      try {
        // 查询 windsurfAuthStatus 字段
        const result = db.exec("SELECT value FROM ItemTable WHERE key = 'windsurfAuthStatus'");
        
        if (result.length > 0 && result[0].values.length > 0) {
          const row = result[0].values[0];
          // 解析 JSON 数据
          const authStatus = JSON.parse(row[0]);
          
          if (authStatus.email && authStatus.name) {
            // 返回从数据库读取的账号信息
            const accountFromDb = {
              email: authStatus.email,
              name: authStatus.name,
              api_key: authStatus.apiKey || '',
              fromDatabase: true
            };
            
            console.log('从 vscdb 读取到账号:', accountFromDb.email);
            db.close();
            return { success: true, data: accountFromDb };
          }
        }
      } finally {
        db.close();
      }
    } catch (dbError) {
      console.log('读取 vscdb 失败，尝试从后端获取:', dbError.message);
    }
    
    // 如果数据库读取失败，则从后端获取
    const result = await api.getCurrentAccount(activationCode, machineCode);
    if (result.success && result.data) {
      store.set('currentAccount', result.data);
    }
    return result;
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('show-message', (event, type, title, message) => {
  // 发送消息到渲染进程显示悬浮提示
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('show-toast', type, title, message);
  }
});

// 生成UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 生成 output.json 格式的数据
function generateAccountData(apiKey, name, email = null) {
  return [{
    id: generateUUID(),
    accessToken: apiKey,
    account: {
      label: name ,
      id: name
    },
    scopes: []
  }];
}

// 获取加密密钥
function getEncryptedKey() {
  try {
    const windsurfDir = path.join(os.homedir(), 'AppData', 'Roaming', 'Windsurf');
    const localStatePath = path.join(windsurfDir, 'Local State');
    const localState = JSON.parse(require('fs').readFileSync(localStatePath, 'utf8'));
    return localState.os_crypt?.encrypted_key;
  } catch (error) {
    return null;
  }
}

// DPAPI 解密（用于解密主密钥）
async function decryptDPAPI(encryptedData) {
  try {
    const base64Data = Buffer.from(encryptedData).toString('base64');
    
    const tempScript = path.join(os.tmpdir(), `dpapi-decrypt-${Date.now()}.ps1`);
    const psScript = `
[System.Reflection.Assembly]::LoadWithPartialName("System.Security") | Out-Null
$encryptedBytes = [System.Convert]::FromBase64String("${base64Data}")
$decryptedBytes = [System.Security.Cryptography.ProtectedData]::Unprotect(
    $encryptedBytes, 
    $null, 
    [System.Security.Cryptography.DataProtectionScope]::CurrentUser
)
[System.Convert]::ToBase64String($decryptedBytes)
`.trim();
    
    try {
      await fs.writeFile(tempScript, psScript, 'utf8');
      
      const { stdout } = await execPromise(
        `powershell -ExecutionPolicy Bypass -File "${tempScript}"`
      );
      const result = stdout;
      
      return Buffer.from(result.trim(), 'base64');
    } finally {
      try {
        if (require('fs').existsSync(tempScript)) {
          require('fs').unlinkSync(tempScript);
        }
      } catch (e) {}
    }
  } catch (error) {
    return null;
  }
}

// 加密 sessions 数据（v10 格式）
async function encryptSessions(data, encryptedKey) {
  try {
    const jsonData = JSON.stringify(data);
    const dataBuffer = Buffer.from(jsonData, 'utf8');

    // 解密主密钥
    const keyData = Buffer.from(encryptedKey, 'base64').slice(5); // 跳过 'DPAPI' 前缀
    const decryptedKey = await decryptDPAPI(keyData);
    if (!decryptedKey) {
      throw new Error('无法解密主密钥');
    }
    
    if (decryptedKey.length !== 32) {
      throw new Error(`主密钥长度不正确: 期望32字节，实际${decryptedKey.length}字节`);
    }

    // 生成随机 nonce (12字节)
    const nonce = crypto.randomBytes(12);

    // 使用 AES-256-GCM 加密
    const cipher = crypto.createCipheriv('aes-256-gcm', decryptedKey, nonce);
    const encrypted = Buffer.concat([
      cipher.update(dataBuffer),
      cipher.final()
    ]);
    const authTag = cipher.getAuthTag();

    // 组合：版本标识 (3字节) + nonce (12字节) + 加密数据 + authTag (16字节)
    const version = Buffer.from('v10');
    const result = Buffer.concat([
      version,      // 3 字节: 'v10'
      nonce,       // 12 字节: 随机 nonce
      encrypted,   // N 字节: AES-256-GCM 加密的数据
      authTag      // 16 字节: GCM 认证标签
    ]);

    return result;
  } catch (error) {
    throw new Error(`加密失败: ${error.message}`);
  }
}

// 更新数据库中的加密sessions和codeium.windsurf
async function updateWindsurfDatabase(apiKey, name, email = null) {
  const windsurfDir = path.join(os.homedir(), 'AppData', 'Roaming', 'Windsurf');
  const dbPath = path.join(windsurfDir, 'User', 'globalStorage', 'state.vscdb');
  
  const SQL = await getSqlJs();
  const fsSync = require('fs');
  
  let dbBuffer;
  try {
    dbBuffer = fsSync.readFileSync(dbPath);
  } catch (e) {
    // 如果文件不存在，创建空数据库
    dbBuffer = null;
  }
  
  const db = dbBuffer ? new SQL.Database(dbBuffer) : new SQL.Database();

  try {
    // 1. 生成并加密 sessions 数据
    const sessionsData = generateAccountData(apiKey, name, email);

    // 获取加密密钥
    const encryptedKey = getEncryptedKey();
    if (!encryptedKey) {
      db.close();
      throw new Error('无法获取加密密钥');
    }

    // 加密数据
    const encryptedSessions = await encryptSessions(sessionsData, encryptedKey);
    
    // 2. 准备 codeium.windsurf 的数据
    const windsurfData = {
      "codeium.installationId": generateUUID(),
      "apiServerUrl": "https://server.self-serve.windsurf.com"
    };

    // 3. 批量更新数据库
    // 将 Buffer 转换为 JSON 序列化格式
    const encryptedSessionsJSON = JSON.stringify(encryptedSessions);
    
    const updates = [
      {
        key: 'secret://{"extensionId":"codeium.windsurf","key":"windsurf_auth.sessions"}',
        value: encryptedSessionsJSON
      },
      {
        key: 'codeium.windsurf',
        value: JSON.stringify(windsurfData)
      }
    ];

    // 确保 ItemTable 表存在
    db.run(`
      CREATE TABLE IF NOT EXISTS ItemTable (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);

    // 批量更新
    for (const update of updates) {
      db.run("INSERT OR REPLACE INTO ItemTable (key, value) VALUES (?, ?)", [update.key, update.value]);
    }

    // 保存数据库到文件
    const data = db.export();
    const buffer = Buffer.from(data);
    fsSync.writeFileSync(dbPath, buffer);
    
    db.close();

    return {
      success: true,
      sessionsData: sessionsData,
      windsurfData: windsurfData
    };
  } catch (error) {
    db.close();
    throw error;
  }
}

// 全盘搜索 Windsurf.exe
async function findWindsurfExecutable() {
  console.log('开始搜索 Windsurf.exe...');
  
  // 获取所有盘符
  const drives = [];
  for (let i = 65; i <= 90; i++) { // A-Z
    const drive = String.fromCharCode(i) + ':';
    try {
      await fs.access(drive + '\\');
      drives.push(drive);
    } catch (e) {
      // 驱动器不存在，忽略
    }
  }
  
  console.log(`发现驱动器: ${drives.join(', ')}`);
  
  // 常见的安装路径模式
  const searchPatterns = [
    '\\Program Files\\Windsurf\\Windsurf.exe',
    '\\Program Files (x86)\\Windsurf\\Windsurf.exe',
    '\\Users\\*\\AppData\\Local\\Programs\\Windsurf\\Windsurf.exe',
    '\\Users\\*\\AppData\\Local\\Windsurf\\Windsurf.exe',
    '\\Windsurf\\Windsurf.exe',
    '\\Tools\\Windsurf\\Windsurf.exe',
    '\\Software\\Windsurf\\Windsurf.exe'
  ];
  
  // 先检查用户目录
  const userPath = path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Windsurf', 'Windsurf.exe');
  try {
    await fs.access(userPath);
    console.log(`找到 Windsurf: ${userPath}`);
    return userPath;
  } catch (e) {}
  
  // 搜索所有驱动器
  for (const drive of drives) {
    for (const pattern of searchPatterns) {
      let searchPath = drive + pattern;
      
      // 处理通配符
      if (searchPath.includes('*')) {
        // 使用 Users 目录的特殊处理
        if (searchPath.includes('\\Users\\*\\')) {
          try {
            const usersDir = path.join(drive, 'Users');
            const users = await fs.readdir(usersDir);
            
            for (const user of users) {
              const testPath = searchPath.replace('\\Users\\*\\', `\\Users\\${user}\\`);
              try {
                await fs.access(testPath);
                console.log(`找到 Windsurf: ${testPath}`);
                return testPath;
              } catch (e) {}
            }
          } catch (e) {}
        }
      } else {
        try {
          await fs.access(searchPath);
          console.log(`找到 Windsurf: ${searchPath}`);
          return searchPath;
        } catch (e) {}
      }
    }
  }
  
  // 如果还没找到，尝试使用 wmic 命令查找
  try {
    const { stdout } = await execPromise('wmic process where name="Windsurf.exe" get ExecutablePath /value');
    const match = stdout.match(/ExecutablePath=(.*)/);
    if (match && match[1]) {
      const exePath = match[1].trim();
      console.log(`通过进程找到 Windsurf: ${exePath}`);
      return exePath;
    }
  } catch (e) {}
  
  console.log('未找到 Windsurf.exe');
  return null;
}

// 关闭 Windsurf 进程
async function closeWindsurf() {
  try {
    // 检查进程是否存在
    const { stdout } = await execPromise('tasklist /FI "IMAGENAME eq Windsurf.exe" /NH');
    if (stdout.toLowerCase().includes('windsurf.exe')) {
      console.log('检测到 Windsurf 正在运行，正在关闭...');
      
      // 尝试正常关闭
      await execPromise('taskkill /IM Windsurf.exe').catch(() => {});
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 再次检查，如果还在运行则强制关闭
      const { stdout: stdout2 } = await execPromise('tasklist /FI "IMAGENAME eq Windsurf.exe" /NH');
      if (stdout2.toLowerCase().includes('windsurf.exe')) {
        console.log('正常关闭失败，强制关闭 Windsurf...');
        await execPromise('taskkill /IM Windsurf.exe /F').catch(() => {});
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      console.log('✓ Windsurf 已关闭');
      return true;
    } else {
      console.log('Windsurf 未运行');
      return false;
    }
  } catch (error) {
    console.error('关闭 Windsurf 失败:', error);
    return false;
  }
}

// Windsurf 机器码重置和账号切换功能
async function resetWindsurfAndSwitchAccount(accountData) {
  try {
    // 先关闭 Windsurf（如果正在运行）
    await closeWindsurf();
    
    // 查找 Windsurf 可执行文件路径（供后续启动使用）
    const windsurfExePath = await findWindsurfExecutable();
    
    // 获取 Windsurf 配置路径
    const windsurfPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Windsurf');
    const storageJsonPath = path.join(windsurfPath, 'User', 'globalStorage', 'storage.json');
    const vscdbPath = path.join(windsurfPath, 'User', 'globalStorage', 'state.vscdb');
    const machineIdPath = path.join(windsurfPath, 'machineid');
    
    // 生成新的ID
    const generateMachineId = () => crypto.randomBytes(32).toString('hex');
    const generateMacMachineId = () => crypto.randomBytes(16).toString('hex');
    const generateServiceMachineId = () => crypto.randomBytes(16).toString('hex');
    const generateSqmId = () => '{' + generateUUID() + '}';
    
    const newMachineId = generateMachineId();
    const newMacMachineId = generateMacMachineId();
    const newServiceMachineId = generateServiceMachineId();
    const newSqmId = generateSqmId();
    const newDeviceId = generateUUID();
    const newMachineid = generateUUID();
    
    console.log('正在重置 Windsurf 机器码...');
    console.log(`新 machineId: ${newMachineId}`);
    console.log(`新 devDeviceId: ${newDeviceId}`);
    
    // 修改 storage.json
    try {
      let storageData = {};
      try {
        const content = await fs.readFile(storageJsonPath, 'utf-8');
        storageData = JSON.parse(content);
      } catch (e) {
        // 文件不存在或解析失败，创建新的
      }
      
      // 更新所有机器标识
      storageData['telemetry.machineId'] = newMachineId;
      storageData['telemetry.macMachineId'] = newMacMachineId;
      storageData['telemetry.sqmId'] = newSqmId;
      storageData['telemetry.devDeviceId'] = newDeviceId;
      storageData['storage.serviceMachineId'] = newServiceMachineId;
      storageData['deviceId'] = newDeviceId;
      
      // 确保目录存在
      await fs.mkdir(path.dirname(storageJsonPath), { recursive: true });
      await fs.writeFile(storageJsonPath, JSON.stringify(storageData, null, 4));
      console.log('✓ 已更新 storage.json');
    } catch (error) {
      console.error('更新 storage.json 失败:', error);
      throw error;
    }
    
    // 使用集成的数据库更新功能处理账号数据
    if (accountData) {
      try {
        const apiKey = accountData.api_key || accountData.apiKey;
        const name = accountData.name || accountData.email;
        const email = accountData.email;
        
        // 使用集成的函数更新数据库（包括加密的sessions和codeium.windsurf）
        const result = await updateWindsurfDatabase(apiKey, name, email);
        console.log('✓ 已更新账号信息到 vscdb');
      } catch (error) {
        console.error('处理 vscdb 数据库失败:', error);
        // 不抛出错误，允许继续执行
      }
    }
    
    // 修改 machineid 文件
    try {
      await fs.writeFile(machineIdPath, newMachineid);
      console.log('✓ 已更新 machineid 文件');
    } catch (error) {
      console.error('更新 machineid 失败:', error);
      throw error;
    }
    
    // 在启动 Windsurf 之前，确保禁用自动更新设置
    await disableWindsurfAutoUpdate();
    
    // 启动 Windsurf
    if (windsurfExePath) {
      try {
        // 使用 start 命令在新窗口启动，避免阻塞
        exec(`start "" "${windsurfExePath}"`);
        console.log(`✓ 已启动 Windsurf: ${windsurfExePath}`);
      } catch (error) {
        console.error('启动 Windsurf 失败:', error);
      }
    } else {
      console.log('警告：未找到 Windsurf.exe，请手动启动');
    }
    
    return {
      success: true,
      message: '机器码重置和账号切换成功',
      newIds: {
        machineId: newMachineId,
        macMachineId: newMacMachineId,
        serviceMachineId: newServiceMachineId,
        devDeviceId: newDeviceId,
        deviceId: newDeviceId,
        sqmId: newSqmId,
        machineid: newMachineid
      },
      accountSwitched: !!accountData
    };
  } catch (error) {
    console.error('重置失败:', error);
    return {
      success: false,
      message: '操作失败: ' + error.message
    };
  }
}

// 保持旧函数名的兼容性
async function resetWindsurfMachineId() {
  return resetWindsurfAndSwitchAccount(null);
}
