const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();

// 从环境变量读取配置
const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 3001;

// CORS配置 - 支持多个源
const corsOrigin = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : [process.env.CLIENT_URL, process.env.ADMIN_URL];

// 中间件
app.use(helmet());
app.use(cors({
    origin: corsOrigin,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 限流配置
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
});
app.use('/api/', limiter);

// 路由
const authRoutes = require('./routes/auth');
const activationRoutes = require('./routes/activation');
const accountRoutes = require('./routes/account');
const accountTokenRoutes = require('./routes/accountToken');
const adminRoutes = require('./routes/admin');
const clientRoutes = require('./routes/client');

app.use('/api/auth', authRoutes);
app.use('/api/activation', activationRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/account-token', accountTokenRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/client', clientRoutes);

// 健康检查
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || '服务器内部错误',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// 404处理
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: '接口不存在'
    });
});

app.listen(PORT, HOST, () => {
    console.log(`WindSurf Backend Server running on http://${HOST}:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`CORS Origins: ${corsOrigin}`);
});
