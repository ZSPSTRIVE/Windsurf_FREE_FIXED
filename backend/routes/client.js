const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { verifyActivationCode } = require('../middleware/auth');

const router = express.Router();

// 验证激活码
router.post('/verify',
    [
        body('activationCode').notEmpty().withMessage('激活码不能为空'),
        body('machineCode').notEmpty().withMessage('机器码不能为空')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { activationCode, machineCode } = req.body;

        try {
            // 查询激活码
            const [codes] = await db.execute(
                'SELECT * FROM activation_codes WHERE code = ?',
                [activationCode]
            );

            if (codes.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '激活码不存在',
                    needActivation: true
                });
            }

            const code = codes[0];

            // 检查过期 - 精确到秒
            const now = new Date();
            const expireDate = new Date(code.expire_date);
            
            if (code.status === 'expired' || expireDate <= now) {
                // 更新状态为过期
                if (code.status !== 'expired') {
                    await db.execute(
                        'UPDATE activation_codes SET status = ? WHERE id = ?',
                        ['expired', code.id]
                    );
                }
                
                return res.status(403).json({
                    success: false,
                    message: '激活码已过期',
                    needActivation: true,
                    expireDate: code.expire_date,
                    currentTime: now.toISOString()
                });
            }

            // 检查是否被禁用
            if (code.status === 'disabled') {
                return res.status(403).json({
                    success: false,
                    message: '激活码已被禁用',
                    needActivation: true
                });
            }

            // 检查是否已绑定其他机器
            if (code.machine_code && code.machine_code !== machineCode) {
                return res.status(403).json({
                    success: false,
                    message: '激活码已绑定其他设备',
                    needActivation: true
                });
            }

            // 如果未绑定，绑定机器码
            if (!code.machine_code) {
                await db.execute(
                    'UPDATE activation_codes SET machine_code = ?, activated_at = NOW() WHERE id = ?',
                    [machineCode, code.id]
                );

                // 创建用户激活记录
                await db.execute(
                    'INSERT INTO user_activations (activation_code_id, machine_code, activated_at) VALUES (?, ?, NOW())',
                    [code.id, machineCode]
                );
            }

            // 更新最后使用时间
            await db.execute(
                'UPDATE activation_codes SET last_used = NOW() WHERE id = ?',
                [code.id]
            );

            // 记录日志
            await db.execute(
                'INSERT INTO activation_logs (activation_code_id, action_type, machine_code, description) VALUES (?, ?, ?, ?)',
                [code.id, 'activate', machineCode, '验证激活码']
            );

            // 计算剩余时间
            const currentTime = new Date();
            const expireTime = new Date(code.expire_date);
            const msRemaining = expireTime - currentTime;
            const daysRemaining = Math.floor(msRemaining / (1000 * 60 * 60 * 24));
            const hoursRemaining = Math.floor((msRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutesRemaining = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));
            
            res.json({
                success: true,
                data: {
                    valid: true,
                    maxAccounts: code.max_accounts,
                    usedAccounts: code.used_accounts,
                    remainingAccounts: code.max_accounts - code.used_accounts,
                    expireDate: code.expire_date,
                    daysRemaining: daysRemaining,
                    hoursRemaining: hoursRemaining,
                    minutesRemaining: minutesRemaining,
                    totalSecondsRemaining: Math.floor(msRemaining / 1000)
                }
            });
        } catch (err) {
            console.error('Verify activation code error:', err);
            res.status(500).json({
                success: false,
                message: '验证失败'
            });
        }
    }
);

// 提号（获取新账号）
router.post('/pickup',
    verifyActivationCode,
    async (req, res) => {
        const code = req.activationCode;
        const machineCode = req.machineCode;

        try {
            // 再次检查是否过期
            const pickupTime = new Date();
            const pickupExpireDate = new Date(code.expire_date);
            
            if (code.status === 'expired' || pickupExpireDate <= pickupTime) {
                return res.status(403).json({
                    success: false,
                    message: '激活码已过期，无法提号',
                    needActivation: true
                });
            }
            
            // 检查是否还有剩余次数
            if (code.used_accounts >= code.max_accounts) {
                return res.status(403).json({
                    success: false,
                    message: '提号次数已用完，请更换激活码',
                    remainingAccounts: 0,
                    needActivation: true
                });
            }

            // 开始事务，确保账号不会被重复分配
            const connection = await db.getConnection();
            await connection.beginTransaction();

            try {
                // 使用 FOR UPDATE 锁定查询，防止并发分配同一账号
                const [accounts] = await connection.execute(
                    'SELECT * FROM accounts WHERE is_assigned = false AND status = ? ORDER BY RAND() LIMIT 1 FOR UPDATE',
                    ['active']
                );

                if (accounts.length === 0) {
                    await connection.rollback();
                    connection.release();
                    
                    // 查询账号池的状态
                    const [accountStats] = await db.execute(
                        'SELECT COUNT(*) as total, SUM(CASE WHEN is_assigned = 1 THEN 1 ELSE 0 END) as assigned FROM accounts'
                    );
                    
                    let message = '暂无可用账号';
                    if (accountStats[0].total === 0) {
                        message = '暂无可用账号，账号池为空，请联系管理员添加账号';
                    } else if (accountStats[0].assigned === accountStats[0].total) {
                        message = `暂无可用账号，所有${accountStats[0].total}个账号已被分配，请联系管理员补充账号`;
                    } else {
                        message = '暂无可用账号，请稍后重试或联系管理员';
                    }
                    
                    return res.status(404).json({
                        success: false,
                        message: message,
                        accountStatus: {
                            total: accountStats[0].total,
                            assigned: accountStats[0].assigned,
                            available: accountStats[0].total - accountStats[0].assigned
                        }
                    });
                }

                const account = accounts[0];
                
                // 再次检查账号是否已被分配（双重保险）
                const [checkAccount] = await connection.execute(
                    'SELECT is_assigned FROM accounts WHERE id = ? FOR UPDATE',
                    [account.id]
                );
                
                if (checkAccount[0].is_assigned) {
                    await connection.rollback();
                    connection.release();
                    return res.status(409).json({
                        success: false,
                        message: '账号分配冲突，请重试'
                    });
                }

                // 更新账号状态，标记为已分配
                await connection.execute(
                    'UPDATE accounts SET is_assigned = true, assigned_to = ?, assigned_at = NOW(), status = ? WHERE id = ? AND is_assigned = false',
                    [code.code, 'used', account.id]
                );

                // 更新激活码使用次数
                await connection.execute(
                    'UPDATE activation_codes SET used_accounts = used_accounts + 1, last_used = NOW() WHERE id = ?',
                    [code.id]
                );

                // 更新用户激活记录的当前账号
                await connection.execute(
                    'UPDATE user_activations SET current_account_id = ?, last_check = NOW() WHERE activation_code_id = ? AND machine_code = ?',
                    [account.id, code.id, machineCode]
                );

                // 记录日志
                await connection.execute(
                    'INSERT INTO activation_logs (activation_code_id, action_type, account_id, machine_code, description) VALUES (?, ?, ?, ?, ?)',
                    [code.id, 'pickup', account.id, machineCode, `提取账号: ${account.email}`]
                );

                await connection.commit();

                res.json({
                    success: true,
                    data: {
                        email: account.email,
                        name: account.name,
                        apiKey: account.api_key,
                        remainingAccounts: code.max_accounts - code.used_accounts - 1
                    },
                    message: '提号成功'
                });
            } catch (err) {
                await connection.rollback();
                throw err;
            } finally {
                connection.release();
            }
        } catch (err) {
            console.error('Pickup account error:', err);
            res.status(500).json({
                success: false,
                message: '提号失败'
            });
        }
    }
);

// 获取账号列表（用于切号）
router.post('/accounts',
    verifyActivationCode,
    async (req, res) => {
        const code = req.activationCode;

        try {
            // 获取该激活码分配的所有账号
            const [accounts] = await db.execute(
                'SELECT id, email, name FROM accounts WHERE assigned_to = ?',
                [code.code]
            );

            res.json({
                success: true,
                data: accounts
            });
        } catch (err) {
            console.error('Get accounts error:', err);
            res.status(500).json({
                success: false,
                message: '获取账号列表失败'
            });
        }
    }
);

// 切号（切换账号）
router.post('/switch',
    verifyActivationCode,
    [
        body('accountId').notEmpty().withMessage('账号ID不能为空')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const code = req.activationCode;
        const machineCode = req.machineCode;
        const { accountId } = req.body;

        try {
            // 再次检查是否过期
            const switchTime = new Date();
            const switchExpireDate = new Date(code.expire_date);
            
            if (code.status === 'expired' || switchExpireDate <= switchTime) {
                return res.status(403).json({
                    success: false,
                    message: '激活码已过期，无法切号',
                    needActivation: true
                });
            }
            // 验证账号是否属于该激活码
            const [accounts] = await db.execute(
                'SELECT * FROM accounts WHERE id = ? AND assigned_to = ?',
                [accountId, code.code]
            );

            if (accounts.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: '无权访问该账号'
                });
            }

            const account = accounts[0];

            // 更新用户激活记录的当前账号
            await db.execute(
                'UPDATE user_activations SET current_account_id = ?, last_check = NOW() WHERE activation_code_id = ? AND machine_code = ?',
                [accountId, code.id, machineCode]
            );

            // 更新账号最后使用时间
            await db.execute(
                'UPDATE accounts SET last_used = NOW() WHERE id = ?',
                [accountId]
            );

            // 记录日志
            await db.execute(
                'INSERT INTO activation_logs (activation_code_id, action_type, account_id, machine_code, description) VALUES (?, ?, ?, ?, ?)',
                [code.id, 'switch', accountId, machineCode, `切换到账号: ${account.email}`]
            );

            res.json({
                success: true,
                data: {
                    email: account.email,
                    name: account.name,
                    apiKey: account.api_key
                },
                message: '切号成功'
            });
        } catch (err) {
            console.error('Switch account error:', err);
            res.status(500).json({
                success: false,
                message: '切号失败'
            });
        }
    }
);

// 获取当前账号信息
router.post('/current',
    verifyActivationCode,
    async (req, res) => {
        const code = req.activationCode;
        const machineCode = req.machineCode;

        try {
            // 获取当前账号
            const [users] = await db.execute(
                `SELECT ua.*, a.email, a.name, a.api_key
                 FROM user_activations ua
                 LEFT JOIN accounts a ON ua.current_account_id = a.id
                 WHERE ua.activation_code_id = ? AND ua.machine_code = ?`,
                [code.id, machineCode]
            );

            if (users.length === 0 || !users[0].current_account_id) {
                return res.json({
                    success: true,
                    data: null,
                    message: '暂无当前账号'
                });
            }

            const user = users[0];

            res.json({
                success: true,
                data: {
                    email: user.email,
                    name: user.name,
                    apiKey: user.api_key
                }
            });
        } catch (err) {
            console.error('Get current account error:', err);
            res.status(500).json({
                success: false,
                message: '获取当前账号失败'
            });
        }
    }
);

module.exports = router;
