const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');

const router = express.Router();

// 管理员登录
router.post('/login',
    [
        body('username').notEmpty().withMessage('用户名不能为空'),
        body('password').notEmpty().withMessage('密码不能为空')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { username, password } = req.body;

        try {
            // 查询管理员
            const [admins] = await db.execute(
                'SELECT * FROM admins WHERE username = ? AND status = ?',
                [username, 'active']
            );

            if (admins.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: '用户名或密码错误'
                });
            }

            const admin = admins[0];

            // 验证密码
            const isValidPassword = await bcrypt.compare(password, admin.password);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: '用户名或密码错误'
                });
            }

            // 更新最后登录时间
            await db.execute(
                'UPDATE admins SET last_login = NOW() WHERE id = ?',
                [admin.id]
            );

            // 生成JWT
            const token = jwt.sign(
                {
                    id: admin.id,
                    username: admin.username,
                    role: admin.role
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRE }
            );

            res.json({
                success: true,
                data: {
                    token,
                    user: {
                        id: admin.id,
                        username: admin.username,
                        email: admin.email,
                        role: admin.role
                    }
                }
            });
        } catch (err) {
            console.error('Login error:', err);
            res.status(500).json({
                success: false,
                message: '登录失败'
            });
        }
    }
);

// 修改密码
router.post('/change-password',
    [
        body('oldPassword').notEmpty().withMessage('旧密码不能为空'),
        body('newPassword').isLength({ min: 6 }).withMessage('新密码至少6个字符')
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
        const userId = req.user.id;

        try {
            // 获取当前用户
            const [users] = await db.execute(
                'SELECT * FROM admins WHERE id = ?',
                [userId]
            );

            if (users.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '用户不存在'
                });
            }

            const user = users[0];

            // 验证旧密码
            const isValidPassword = await bcrypt.compare(oldPassword, user.password);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: '旧密码错误'
                });
            }

            // 加密新密码
            const hashedPassword = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS));

            // 更新密码
            await db.execute(
                'UPDATE admins SET password = ? WHERE id = ?',
                [hashedPassword, userId]
            );

            res.json({
                success: true,
                message: '密码修改成功'
            });
        } catch (err) {
            console.error('Change password error:', err);
            res.status(500).json({
                success: false,
                message: '密码修改失败'
            });
        }
    }
);

module.exports = router;
