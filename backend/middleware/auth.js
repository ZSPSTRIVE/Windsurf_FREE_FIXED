const jwt = require('jsonwebtoken');

// 验证JWT Token
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: '请提供认证令牌'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: '认证令牌已过期'
            });
        }
        return res.status(403).json({
            success: false,
            message: '无效的认证令牌'
        });
    }
};

// 验证管理员权限
const verifyAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin' && req.user.role !== 'super_admin') {
        return res.status(403).json({
            success: false,
            message: '需要管理员权限'
        });
    }
    next();
};

// 验证超级管理员权限
const verifySuperAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'super_admin') {
        return res.status(403).json({
            success: false,
            message: '需要超级管理员权限'
        });
    }
    next();
};

// 验证激活码（客户端使用）
const verifyActivationCode = async (req, res, next) => {
    const { activationCode, machineCode } = req.body;
    
    if (!activationCode || !machineCode) {
        return res.status(400).json({
            success: false,
            message: '请提供激活码和机器码'
        });
    }

    const db = require('../config/database');
    
    try {
        // 查询激活码信息
        const [codes] = await db.execute(
            `SELECT ac.*, ua.machine_code, ua.status as ua_status
             FROM activation_codes ac
             LEFT JOIN user_activations ua ON ua.activation_code_id = ac.id AND ua.machine_code = ?
             WHERE ac.code = ?`,
            [machineCode, activationCode]
        );

        if (codes.length === 0) {
            return res.status(404).json({
                success: false,
                message: '激活码不存在'
            });
        }

        const code = codes[0];

        // 检查激活码状态
        if (code.status === 'expired' || new Date(code.expire_date) < new Date()) {
            return res.status(403).json({
                success: false,
                message: '激活码已过期',
                needActivation: true
            });
        }

        if (code.status === 'disabled') {
            return res.status(403).json({
                success: false,
                message: '激活码已被禁用'
            });
        }

        // 检查机器码绑定
        if (code.machine_code && code.machine_code !== machineCode) {
            return res.status(403).json({
                success: false,
                message: '激活码已绑定其他设备'
            });
        }

        req.activationCode = code;
        req.machineCode = machineCode;
        next();
    } catch (err) {
        console.error('Activation code verification error:', err);
        res.status(500).json({
            success: false,
            message: '验证激活码失败'
        });
    }
};

module.exports = {
    verifyToken,
    verifyAdmin,
    verifySuperAdmin,
    verifyActivationCode
};
