const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

const router = express.Router();

// 添加账号
router.post('/add',
    verifyToken,
    verifyAdmin,
    [
        body('email').isEmail().withMessage('邮箱格式不正确'),
        body('name').notEmpty().withMessage('账号名称不能为空'),
        body('apiKey').notEmpty().withMessage('API Key不能为空')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { email, name, apiKey } = req.body;

        try {
            // 检查邮箱是否已存在
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
                'INSERT INTO accounts (email, name, api_key) VALUES (?, ?, ?)',
                [email, name, apiKey]
            );

            res.json({
                success: true,
                data: {
                    id: result.insertId,
                    email,
                    name
                },
                message: '账号添加成功'
            });
        } catch (err) {
            console.error('Add account error:', err);
            res.status(500).json({
                success: false,
                message: '添加账号失败'
            });
        }
    }
);

// 批量添加账号
router.post('/batch-add',
    verifyToken,
    verifyAdmin,
    [
        body('accounts').isArray().withMessage('accounts必须是数组'),
        body('accounts.*.email').isEmail().withMessage('邮箱格式不正确'),
        body('accounts.*.name').notEmpty().withMessage('账号名称不能为空'),
        body('accounts.*.apiKey').notEmpty().withMessage('API Key不能为空')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { accounts } = req.body;

        try {
            const successful = [];
            const failed = [];

            for (const account of accounts) {
                try {
                    // 检查邮箱是否已存在
                    const [existing] = await db.execute(
                        'SELECT id FROM accounts WHERE email = ?',
                        [account.email]
                    );

                    if (existing.length > 0) {
                        failed.push({
                            ...account,
                            reason: '邮箱已存在'
                        });
                        continue;
                    }

                    // 插入账号
                    const [result] = await db.execute(
                        'INSERT INTO accounts (email, name, api_key) VALUES (?, ?, ?)',
                        [account.email, account.name, account.apiKey]
                    );

                    successful.push({
                        id: result.insertId,
                        email: account.email,
                        name: account.name
                    });
                } catch (err) {
                    failed.push({
                        ...account,
                        reason: err.message
                    });
                }
            }

            res.json({
                success: true,
                data: {
                    successful,
                    failed,
                    summary: {
                        total: accounts.length,
                        success: successful.length,
                        fail: failed.length
                    }
                }
            });
        } catch (err) {
            console.error('Batch add accounts error:', err);
            res.status(500).json({
                success: false,
                message: '批量添加账号失败'
            });
        }
    }
);

// 获取账号列表
router.get('/list',
    verifyToken,
    verifyAdmin,
    async (req, res) => {
        const { page = 1, limit = 20, status = '', search = '', isAssigned = '' } = req.query;
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 20;
        const offset = (pageNum - 1) * limitNum;

        try {
            let query = 'SELECT * FROM accounts';
            let countQuery = 'SELECT COUNT(*) as total FROM accounts';
            const conditions = [];
            const params = [];

            if (status && status !== '') {
                conditions.push('status = ?');
                params.push(status);
            }

            if (search && search !== '') {
                conditions.push('(email LIKE ? OR name LIKE ?)');
                params.push(`%${search}%`, `%${search}%`);
            }

            if (isAssigned !== undefined && isAssigned !== '') {
                conditions.push('is_assigned = ?');
                params.push(isAssigned === 'true' ? 1 : 0);
            }

            if (conditions.length > 0) {
                const whereClause = ' WHERE ' + conditions.join(' AND ');
                query += whereClause;
                countQuery += whereClause;
            }

            query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

            // 使用query方法而不是execute
            const [accounts] = await db.query(query, [...params, limitNum, offset]);
            const [countResult] = await db.query(countQuery, params);
            const total = countResult[0]?.total || 0;

            res.json({
                success: true,
                data: {
                    accounts,
                    pagination: {
                        page: pageNum,
                        limit: limitNum,
                        total,
                        pages: Math.ceil(total / limitNum) || 1
                    }
                }
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

// 更新账号
router.put('/:id',
    verifyToken,
    verifyAdmin,
    [
        body('email').optional().isEmail().withMessage('邮箱格式不正确'),
        body('name').optional().notEmpty().withMessage('账号名称不能为空'),
        body('apiKey').optional().notEmpty().withMessage('API Key不能为空'),
        body('status').optional().isIn(['active', 'inactive', 'used']).withMessage('无效的状态')
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
        const updates = req.body;

        try {
            // 构建更新语句
            const fields = [];
            const values = [];

            if (updates.email) {
                fields.push('email = ?');
                values.push(updates.email);
            }
            if (updates.name) {
                fields.push('name = ?');
                values.push(updates.name);
            }
            if (updates.apiKey) {
                fields.push('api_key = ?');
                values.push(updates.apiKey);
            }
            if (updates.status) {
                fields.push('status = ?');
                values.push(updates.status);
            }

            if (fields.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: '没有要更新的字段'
                });
            }

            values.push(id);

            const [result] = await db.execute(
                `UPDATE accounts SET ${fields.join(', ')} WHERE id = ?`,
                values
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: '账号不存在'
                });
            }

            res.json({
                success: true,
                message: '账号更新成功'
            });
        } catch (err) {
            console.error('Update account error:', err);
            res.status(500).json({
                success: false,
                message: '更新账号失败'
            });
        }
    }
);

// 删除账号
router.delete('/:id',
    verifyToken,
    verifyAdmin,
    async (req, res) => {
        const { id } = req.params;

        try {
            const [result] = await db.execute(
                'DELETE FROM accounts WHERE id = ?',
                [id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: '账号不存在'
                });
            }

            res.json({
                success: true,
                message: '删除成功'
            });
        } catch (err) {
            console.error('Delete account error:', err);
            res.status(500).json({
                success: false,
                message: '删除账号失败'
            });
        }
    }
);

// 通过Token导入账号（页面预留功能）
router.post('/import-token',
    verifyToken,
    verifyAdmin,
    [
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

        const { token } = req.body;

        try {
            // 保存token到临时表
            const [result] = await db.execute(
                'INSERT INTO token_imports (token) VALUES (?)',
                [token]
            );

            // TODO: 实现具体的token解析逻辑
            // 这里暂时返回成功消息
            res.json({
                success: true,
                data: {
                    id: result.insertId
                },
                message: 'Token已保存，等待处理'
            });
        } catch (err) {
            console.error('Import token error:', err);
            res.status(500).json({
                success: false,
                message: 'Token导入失败'
            });
        }
    }
);

// 获取账号统计信息
router.get('/statistics',
    verifyToken,
    verifyAdmin,
    async (req, res) => {
        try {
            const [stats] = await db.query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
                    SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive,
                    SUM(CASE WHEN status = 'used' THEN 1 ELSE 0 END) as used,
                    SUM(CASE WHEN is_assigned = 1 THEN 1 ELSE 0 END) as assigned,
                    SUM(CASE WHEN is_assigned = 0 THEN 1 ELSE 0 END) as available
                FROM accounts
            `);

            res.json({
                success: true,
                data: stats[0]
            });
        } catch (err) {
            console.error('Get account statistics error:', err);
            res.status(500).json({
                success: false,
                message: '获取统计信息失败'
            });
        }
    }
);

// 重置账号分配状态
router.post('/reset-assignment/:id',
    verifyToken,
    verifyAdmin,
    async (req, res) => {
        const { id } = req.params;

        try {
            // 重置账号为未分配状态
            const [result] = await db.execute(
                'UPDATE accounts SET is_assigned = false, assigned_to = NULL, assigned_at = NULL, status = ? WHERE id = ?',
                ['active', id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: '账号不存在'
                });
            }

            res.json({
                success: true,
                message: '账号分配状态已重置'
            });
        } catch (err) {
            console.error('Reset assignment error:', err);
            res.status(500).json({
                success: false,
                message: '重置分配状态失败'
            });
        }
    }
);

// 批量重置所有账号分配状态
router.post('/reset-all-assignments',
    verifyToken,
    verifyAdmin,
    async (req, res) => {
        try {
            // 重置所有已分配账号为未分配状态
            const [result] = await db.execute(
                'UPDATE accounts SET is_assigned = false, assigned_to = NULL, assigned_at = NULL, status = ? WHERE is_assigned = true',
                ['active']
            );

            res.json({
                success: true,
                message: `成功重置 ${result.affectedRows} 个账号的分配状态`,
                data: {
                    resetCount: result.affectedRows
                }
            });
        } catch (err) {
            console.error('Reset all assignments error:', err);
            res.status(500).json({
                success: false,
                message: '批量重置分配状态失败'
            });
        }
    }
);

module.exports = router;
