const express = require('express');
const router = express.Router();
const request = require('request');
const zlib = require('zlib');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// 解析 Windsurf token
function parseWindsurfToken(token) {
    return new Promise((resolve, reject) => {
        // 在token前加上换行符
        const data = '\n+' + token;
        
        const options = {
            encoding: null,
            gzip: true,
            method: 'POST',
            url: 'https://register.windsurf.com/exa.seat_management_pb.SeatManagementService/RegisterUser',
            headers: {
                'User-Agent': 'connect-es/1.5.0',
                'Connection': 'close',
                'Accept-Encoding': 'gzip,br',
                'connect-protocol-version': '1',
                'content-type': 'application/proto',
                'Transfer-Encoding': 'chunked'
            },
            body: data,
        };

        request(options, function (error, response, body) {
            if (error) {
                reject(error);
                return;
            }
            
            if (response.statusCode !== 200) {
                reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
                return;
            }
            
            let buf = body;
            
            // 如果需要解压
            if (response.headers['content-encoding'] === 'gzip' && buf.length > 2 && buf[0] === 0x1f && buf[1] === 0x8b) {
                try {
                    buf = zlib.gunzipSync(body);
                } catch (e) {
                    reject(new Error('解压失败: ' + e.message));
                    return;
                }
            }
            
            // 提取所有可打印的 ASCII 序列
            const ascii = [];
            let current = '';
            for (const byte of buf) {
                if (byte >= 0x20 && byte <= 0x7E) {
                    current += String.fromCharCode(byte);
                } else {
                    if (current.length > 0) ascii.push(current);
                    current = '';
                }
            }
            if (current.length > 0) ascii.push(current);
            
            // 查找 API key（以 gsk-ws- 开头的序列）
            const apiKeySequence = ascii.find(s => s.startsWith('gsk-ws-'));
            if (!apiKeySequence) {
                reject(new Error('未找到有效的 API key'));
                return;
            }
            
            // 去掉开头的 'g' 得到真正的 API key
            const apiKey = apiKeySequence.substring(1);
            
            // 获取 name（通常是第二个序列）
            let name = '';
            const nameIndex = ascii.indexOf(apiKeySequence) + 1;
            if (nameIndex < ascii.length) {
                name = ascii[nameIndex];
            }
            
            resolve({
                apiKey: apiKey,
                name: name
            });
        });
    });
}

// 通过 token 添加账号
router.post('/add-with-token',
    verifyToken,
    verifyAdmin,
    [
        body('email').isEmail().withMessage('邮箱格式不正确'),
        body('token').notEmpty().withMessage('Token不能为空')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { email, token } = req.body;

        try {
            // 解析 token 获取 API key 和 name
            console.log('开始解析 token...');
            const tokenData = await parseWindsurfToken(token);
            
            console.log('解析结果:', {
                apiKey: tokenData.apiKey.substring(0, 20) + '...',
                name: tokenData.name
            });

            // 检查账号是否已存在
            const [existing] = await db.execute(
                'SELECT id FROM accounts WHERE email = ?',
                [email]
            );

            if (existing.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: '该邮箱已存在'
                });
            }

            // 插入新账号
            const [result] = await db.execute(
                'INSERT INTO accounts (email, name, api_key, status, is_assigned) VALUES (?, ?, ?, ?, ?)',
                [email, tokenData.name || email.split('@')[0], tokenData.apiKey, 'active', false]
            );

            res.json({
                success: true,
                message: '账号添加成功',
                data: {
                    id: result.insertId,
                    email: email,
                    name: tokenData.name,
                    apiKey: tokenData.apiKey.substring(0, 20) + '...'
                }
            });

        } catch (err) {
            console.error('Add account with token error:', err);
            
            // 根据错误类型返回更友好的提示
            let errorMessage = '添加账号失败';
            let statusCode = 500;
            
            if (err.message.includes('401') || err.message.includes('Unauthorized')) {
                errorMessage = 'Token 无效或已过期，请使用新的 Token';
                statusCode = 401;
            } else if (err.message.includes('未找到有效的 API key')) {
                errorMessage = 'Token 格式错误，无法解析出 API Key';
                statusCode = 400;
            } else if (err.message.includes('network') || err.message.includes('ECONNREFUSED')) {
                errorMessage = '网络连接失败，请稍后重试';
                statusCode = 503;
            }
            
            res.status(statusCode).json({
                success: false,
                message: errorMessage,
                detail: err.message
            });
        }
    }
);

module.exports = router;
