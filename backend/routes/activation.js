const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const db = require('../config/database');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

const router = express.Router();

// 生成激活码
function generateActivationCode(prefix = 'WS', length = 16) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = prefix + '-';
    const segmentLength = 4;
    
    // 计算需要生成的字符数（不包含前缀和分隔符）
    const totalChars = parseInt(length);
    const segments = Math.ceil(totalChars / segmentLength);
    
    for (let i = 0; i < segments; i++) {
        const remainingChars = totalChars - (i * segmentLength);
        const currentSegmentLength = Math.min(segmentLength, remainingChars);
        
        for (let j = 0; j < currentSegmentLength; j++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        if (i < segments - 1 && remainingChars > segmentLength) {
            code += '-';
        }
    }
    
    return code;
}

// 从系统配置获取激活码设置
async function getActivationCodeConfig() {
    try {
        const [configs] = await db.execute(
            `SELECT config_key, config_value FROM system_config 
             WHERE config_key IN ('activation_code_prefix', 'activation_code_length')`
        );
        
        const configMap = {};
        configs.forEach(config => {
            configMap[config.config_key] = config.config_value;
        });
        
        return {
            prefix: configMap.activation_code_prefix || 'WS',
            length: parseInt(configMap.activation_code_length) || 16
        };
    } catch (error) {
        console.error('Failed to get activation code config:', error);
        return { prefix: 'WS', length: 16 };
    }
}

// 创建激活码
router.post('/create',
    verifyToken,
    verifyAdmin,
    [
        body('maxAccounts').isInt({ min: 1 }).withMessage('最大账号数必须大于0'),
        body('validDays').optional().isInt({ min: 1 }).withMessage('有效天数必须大于0'),
        body('expireDateTime').optional().isString().withMessage('过期时间格式不正确'),
        body('count').optional().isInt({ min: 1, max: 100 }).withMessage('批量生成数量必须在1-100之间')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { maxAccounts, validDays, expireDateTime, count = 1 } = req.body;
        const createdBy = req.user.id;

        try {
            // 获取系统配置的激活码设置
            const codeConfig = await getActivationCodeConfig();
            
            const codes = [];
            let expireDate;
            
            // 获取默认有效天数配置
            let defaultValidDays = 30;
            try {
                const [configResult] = await db.execute(
                    "SELECT config_value FROM system_config WHERE config_key = 'default_valid_days'"
                );
                if (configResult.length > 0) {
                    defaultValidDays = parseInt(configResult[0].config_value) || 30;
                }
            } catch (error) {
                console.error('Failed to get default_valid_days:', error);
            }
            
            // 处理过期时间
            if (expireDateTime) {
                // 使用指定的时间
                expireDate = moment(expireDateTime).format('YYYY-MM-DD HH:mm:ss');
            } else if (validDays) {
                // 使用天数计算
                expireDate = moment().add(validDays, 'days').format('YYYY-MM-DD HH:mm:ss');
            } else {
                // 使用系统配置的默认天数
                expireDate = moment().add(defaultValidDays, 'days').format('YYYY-MM-DD HH:mm:ss');
            }
            
            const calculatedValidDays = validDays || Math.ceil(moment(expireDate).diff(moment(), 'days', true));

            for (let i = 0; i < count; i++) {
                let code;
                let exists = true;
                
                // 确保生成唯一的激活码，使用系统配置的前缀和长度
                while (exists) {
                    code = generateActivationCode(codeConfig.prefix, codeConfig.length);
                    const [existing] = await db.execute(
                        'SELECT id FROM activation_codes WHERE code = ?',
                        [code]
                    );
                    exists = existing.length > 0;
                }

                const [result] = await db.execute(
                    `INSERT INTO activation_codes 
                    (code, max_accounts, valid_days, expire_date, created_by) 
                    VALUES (?, ?, ?, ?, ?)`,
                    [code, maxAccounts, calculatedValidDays, expireDate, createdBy]
                );

                codes.push({
                    id: result.insertId,
                    code,
                    maxAccounts,
                    validDays: calculatedValidDays,
                    expireDate
                });
            }

            res.json({
                success: true,
                data: codes,
                message: `成功生成${count}个激活码`
            });
        } catch (err) {
            console.error('Create activation code error:', err);
            res.status(500).json({
                success: false,
                message: '创建激活码失败'
            });
        }
    }
);

// 获取激活码列表
router.get('/list',
    verifyToken,
    verifyAdmin,
    async (req, res) => {
        const { page = 1, limit = 20, status = '', search = '' } = req.query;
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 20;
        const offset = (pageNum - 1) * limitNum;

        try {
            // 简单的查询，避免复杂的参数绑定
            let query = 'SELECT * FROM activation_codes';
            let countQuery = 'SELECT COUNT(*) as total FROM activation_codes';
            let conditions = [];
            let params = [];
            
            // 添加条件
            if (status && status !== '') {
                conditions.push('status = ?');
                params.push(status);
            }
            
            if (search && search !== '') {
                conditions.push('code LIKE ?');
                params.push(`%${search}%`);
            }
            
            // 组合查询
            if (conditions.length > 0) {
                const whereClause = ' WHERE ' + conditions.join(' AND ');
                query += whereClause;
                countQuery += whereClause;
            }
            
            // 添加排序和分页
            query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
            
            // 执行查询 - 使用query而不是execute
            const [codes] = await db.query(query, [...params, limitNum, offset]);
            const [countResult] = await db.query(countQuery, params);
            const total = countResult[0]?.total || 0;
            
            // 为每个代码添加默认的统计值
            const codesWithStats = codes.map(code => ({
                ...code,
                active_users: 0,
                total_logs: 0
            }));

            res.json({
                success: true,
                data: {
                    codes: codesWithStats,
                    pagination: {
                        page: pageNum,
                        limit: limitNum,
                        total: total,
                        pages: Math.ceil(total / limitNum) || 1
                    }
                }
            });
        } catch (err) {
            console.error('Get activation codes error:', err);
            console.error('Error stack:', err.stack);
            res.status(500).json({
                success: false,
                message: '获取激活码列表失败',
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    }
);

// 更新激活码状态
router.put('/:id/status',
    verifyToken,
    verifyAdmin,
    [
        body('status').isIn(['active', 'disabled']).withMessage('无效的状态')
    ],
    async (req, res) => {
        const { id } = req.params;
        const { status } = req.body;

        try {
            const [result] = await db.execute(
                'UPDATE activation_codes SET status = ? WHERE id = ?',
                [status, id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: '激活码不存在'
                });
            }

            res.json({
                success: true,
                message: '状态更新成功'
            });
        } catch (err) {
            console.error('Update activation code status error:', err);
            res.status(500).json({
                success: false,
                message: '更新状态失败'
            });
        }
    }
);

// 删除激活码
router.delete('/:id',
    verifyToken,
    verifyAdmin,
    async (req, res) => {
        const { id } = req.params;

        try {
            const [result] = await db.execute(
                'DELETE FROM activation_codes WHERE id = ?',
                [id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: '激活码不存在'
                });
            }

            res.json({
                success: true,
                message: '删除成功'
            });
        } catch (err) {
            console.error('Delete activation code error:', err);
            res.status(500).json({
                success: false,
                message: '删除激活码失败'
            });
        }
    }
);

// 获取激活码详情及使用记录
router.get('/:id/details',
    verifyToken,
    verifyAdmin,
    async (req, res) => {
        const { id } = req.params;

        try {
            // 获取激活码信息
            const [codes] = await db.execute(
                'SELECT * FROM activation_codes WHERE id = ?',
                [id]
            );

            if (codes.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '激活码不存在'
                });
            }

            // 获取使用记录
            const [logs] = await db.execute(
                `SELECT al.*, a.email as account_email, a.name as account_name
                 FROM activation_logs al
                 LEFT JOIN accounts a ON al.account_id = a.id
                 WHERE al.activation_code_id = ?
                 ORDER BY al.created_at DESC
                 LIMIT 100`,
                [id]
            );

            // 获取关联的用户
            const [users] = await db.execute(
                `SELECT ua.*, a.email, a.name
                 FROM user_activations ua
                 LEFT JOIN accounts a ON ua.current_account_id = a.id
                 WHERE ua.activation_code_id = ?`,
                [id]
            );

            res.json({
                success: true,
                data: {
                    code: codes[0],
                    logs,
                    users
                }
            });
        } catch (err) {
            console.error('Get activation code details error:', err);
            res.status(500).json({
                success: false,
                message: '获取激活码详情失败'
            });
        }
    }
);

module.exports = router;
