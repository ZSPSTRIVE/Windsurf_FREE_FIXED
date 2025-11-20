const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { verifyToken, verifySuperAdmin } = require('../middleware/auth');

const router = express.Router();

// 获取管理员列表
router.get('/list',
    verifyToken,
    verifySuperAdmin,
    async (req, res) => {
        try {
            const [admins] = await db.execute(
                'SELECT id, username, email, role, last_login, status, created_at FROM admins ORDER BY created_at DESC'
            );

            res.json({
                success: true,
                data: admins
            });
        } catch (err) {
            console.error('Get admins error:', err);
            res.status(500).json({
                success: false,
                message: '获取管理员列表失败'
            });
        }
    }
);

// 添加管理员
router.post('/add',
    verifyToken,
    verifySuperAdmin,
    [
        body('username').notEmpty().withMessage('用户名不能为空'),
        body('password').isLength({ min: 6 }).withMessage('密码至少6个字符'),
        body('email').optional().isEmail().withMessage('邮箱格式不正确'),
        body('role').isIn(['admin', 'super_admin']).withMessage('无效的角色')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { username, password, email, role } = req.body;

        try {
            // 检查用户名是否存在
            const [existing] = await db.execute(
                'SELECT id FROM admins WHERE username = ?',
                [username]
            );

            if (existing.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: '用户名已存在'
                });
            }

            // 加密密码
            const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || 10));

            // 创建管理员
            const [result] = await db.execute(
                'INSERT INTO admins (username, password, email, role) VALUES (?, ?, ?, ?)',
                [username, hashedPassword, email, role]
            );

            res.json({
                success: true,
                data: {
                    id: result.insertId,
                    username,
                    email,
                    role
                },
                message: '管理员创建成功'
            });
        } catch (err) {
            console.error('Add admin error:', err);
            res.status(500).json({
                success: false,
                message: '创建管理员失败'
            });
        }
    }
);

// 修改密码
router.put('/change-password',
    verifyToken,
    [
        body('oldPassword').notEmpty().withMessage('原密码不能为空'),
        body('newPassword').isLength({ min: 6 }).withMessage('新密码至少6个字符'),
        body('confirmPassword').custom((value, { req }) => value === req.body.newPassword)
            .withMessage('两次输入的密码不一致')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { oldPassword, newPassword } = req.body;
        const adminId = req.user.id;

        try {
            // 获取当前用户信息
            const [admins] = await db.execute(
                'SELECT password FROM admins WHERE id = ?',
                [adminId]
            );

            if (admins.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '用户不存在'
                });
            }

            // 验证原密码
            const validPassword = await bcrypt.compare(oldPassword, admins[0].password);
            if (!validPassword) {
                return res.status(400).json({
                    success: false,
                    message: '原密码错误'
                });
            }

            // 加密新密码
            const hashedPassword = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS || 10));

            // 更新密码
            await db.execute(
                'UPDATE admins SET password = ?, updated_at = NOW() WHERE id = ?',
                [hashedPassword, adminId]
            );

            res.json({
                success: true,
                message: '密码修改成功'
            });
        } catch (err) {
            console.error('Change password error:', err);
            res.status(500).json({
                success: false,
                message: '修改密码失败'
            });
        }
    }
);

// 重置密码（仅超级管理员可用）
router.put('/:id/reset-password',
    verifyToken,
    verifySuperAdmin,
    [
        body('newPassword').isLength({ min: 6 }).withMessage('密码至少6个字符')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { id } = req.params;
        const { newPassword } = req.body;

        try {
            // 检查用户是否存在
            const [admins] = await db.execute(
                'SELECT username FROM admins WHERE id = ?',
                [id]
            );

            if (admins.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '管理员不存在'
                });
            }

            // 加密新密码
            const hashedPassword = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS || 10));

            // 更新密码
            await db.execute(
                'UPDATE admins SET password = ?, updated_at = NOW() WHERE id = ?',
                [hashedPassword, id]
            );

            res.json({
                success: true,
                message: `管理员 ${admins[0].username} 的密码已重置`
            });
        } catch (err) {
            console.error('Reset password error:', err);
            res.status(500).json({
                success: false,
                message: '重置密码失败'
            });
        }
    }
);

// 更新管理员状态
router.put('/:id/status',
    verifyToken,
    verifySuperAdmin,
    [
        body('status').isIn(['active', 'inactive']).withMessage('无效的状态')
    ],
    async (req, res) => {
        const { id } = req.params;
        const { status } = req.body;

        try {
            const [result] = await db.execute(
                'UPDATE admins SET status = ? WHERE id = ? AND role != ?',
                [status, id, 'super_admin']
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: '管理员不存在或无法修改超级管理员状态'
                });
            }

            res.json({
                success: true,
                message: '状态更新成功'
            });
        } catch (err) {
            console.error('Update admin status error:', err);
            res.status(500).json({
                success: false,
                message: '更新状态失败'
            });
        }
    }
);

// 删除管理员
router.delete('/:id',
    verifyToken,
    verifySuperAdmin,
    async (req, res) => {
        const { id } = req.params;

        try {
            // 不能删除超级管理员
            const [admins] = await db.execute(
                'SELECT role FROM admins WHERE id = ?',
                [id]
            );

            if (admins.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '管理员不存在'
                });
            }

            if (admins[0].role === 'super_admin') {
                return res.status(403).json({
                    success: false,
                    message: '无法删除超级管理员'
                });
            }

            await db.execute('DELETE FROM admins WHERE id = ?', [id]);

            res.json({
                success: true,
                message: '删除成功'
            });
        } catch (err) {
            console.error('Delete admin error:', err);
            res.status(500).json({
                success: false,
                message: '删除管理员失败'
            });
        }
    }
);

// 获取系统统计信息
router.get('/statistics',
    verifyToken,
    async (req, res) => {
        try {
            // 获取各种统计数据 - 使用query方法
            const [activationStats] = await db.query(`
                SELECT 
                    COUNT(*) as total_codes,
                    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_codes,
                    SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired_codes,
                    SUM(used_accounts) as total_used_accounts
                FROM activation_codes
            `);

            const [accountStats] = await db.query(`
                SELECT 
                    COUNT(*) as total_accounts,
                    SUM(CASE WHEN is_assigned = 1 THEN 1 ELSE 0 END) as assigned_accounts,
                    SUM(CASE WHEN is_assigned = 0 THEN 1 ELSE 0 END) as available_accounts
                FROM accounts
            `);

            const [userStats] = await db.query(`
                SELECT COUNT(DISTINCT machine_code) as total_users
                FROM user_activations
                WHERE status = 'active'
            `);

            const [recentLogs] = await db.query(`
                SELECT al.*, ac.code
                FROM activation_logs al
                JOIN activation_codes ac ON al.activation_code_id = ac.id
                ORDER BY al.created_at DESC
                LIMIT 10
            `);

            res.json({
                success: true,
                data: {
                    activation: activationStats[0],
                    accounts: accountStats[0],
                    users: userStats[0],
                    recentLogs
                }
            });
        } catch (err) {
            console.error('Get statistics error:', err);
            res.status(500).json({
                success: false,
                message: '获取统计信息失败'
            });
        }
    }
);

// 获取系统配置
router.get('/config',
    verifyToken,
    async (req, res) => {
        try {
            const [configs] = await db.execute(
                'SELECT * FROM system_config'
            );

            const configMap = {};
            configs.forEach(c => {
                configMap[c.config_key] = c.config_value;
            });

            res.json({
                success: true,
                data: configMap
            });
        } catch (err) {
            console.error('Get config error:', err);
            res.status(500).json({
                success: false,
                message: '获取配置失败'
            });
        }
    }
);

// 更新系统配置
router.put('/config',
    verifyToken,
    verifySuperAdmin,
    async (req, res) => {
        const configs = req.body;

        try {
            for (const [key, value] of Object.entries(configs)) {
                await db.execute(
                    'UPDATE system_config SET config_value = ? WHERE config_key = ?',
                    [value, key]
                );
            }

            res.json({
                success: true,
                message: '配置更新成功'
            });
        } catch (err) {
            console.error('Update config error:', err);
            res.status(500).json({
                success: false,
                message: '更新配置失败'
            });
        }
    }
);

module.exports = router;
