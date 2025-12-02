const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '../.env') });

// 数据库配置
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'windsurf_management',
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    connectTimeout: 60000,
    timezone: '+08:00'
};

// 打印配置信息（隐藏密码）
console.log('Database Config:', {
    ...dbConfig,
    password: dbConfig.password ? '***' : 'not set'
});

const pool = mysql.createPool(dbConfig);

// 测试数据库连接
pool.getConnection()
    .then(connection => {
        console.log('Database connected successfully');
        connection.release();
    })
    .catch(err => {
        console.error('Database connection failed:', err.message);
        process.exit(1);
    });

module.exports = pool;
