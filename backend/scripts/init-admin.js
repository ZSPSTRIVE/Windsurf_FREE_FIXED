const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function initAdmin() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'windsurf_management'
    });

    try {
        // 生成密码hash
        const password = 'admin123';
        const hash = await bcrypt.hash(password, 10);
        
        // 检查是否已存在admin用户
        const [existing] = await connection.execute(
            'SELECT id FROM admins WHERE username = ?',
            ['admin']
        );

        if (existing.length > 0) {
            // 更新密码
            await connection.execute(
                'UPDATE admins SET password = ? WHERE username = ?',
                [hash, 'admin']
            );
            console.log('Admin password updated successfully!');
        } else {
            // 创建新用户
            await connection.execute(
                'INSERT INTO admins (username, password, email, role) VALUES (?, ?, ?, ?)',
                ['admin', hash, 'admin@windsurf.com', 'super_admin']
            );
            console.log('Admin user created successfully!');
        }

        console.log('\nLogin credentials:');
        console.log('Username: admin');
        console.log('Password: admin123');
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await connection.end();
    }
}

initAdmin();
