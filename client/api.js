const axios = require('axios');

const API_URL = process.env.API_URL || 'http://210.16.178.35:33001/api';

const request = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 响应拦截器
request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      throw new Error(error.response.data.message || '请求失败');
    } else if (error.request) {
      throw new Error('网络错误，请检查网络连接');
    } else {
      throw new Error('请求失败');
    }
  }
);

module.exports = {
  // 验证激活码
  verifyActivation: async (activationCode, machineCode) => {
    return request.post('/client/verify', {
      activationCode,
      machineCode
    });
  },

  // 提号
  pickupAccount: async (activationCode, machineCode) => {
    return request.post('/client/pickup', {
      activationCode,
      machineCode
    });
  },

  // 获取账号列表
  getAccounts: async (activationCode, machineCode) => {
    return request.post('/client/accounts', {
      activationCode,
      machineCode
    });
  },

  // 切号
  switchAccount: async (activationCode, machineCode, accountId) => {
    return request.post('/client/switch', {
      activationCode,
      machineCode,
      accountId
    });
  },

  // 获取当前账号
  getCurrentAccount: async (activationCode, machineCode) => {
    return request.post('/client/current', {
      activationCode,
      machineCode
    });
  }
};
