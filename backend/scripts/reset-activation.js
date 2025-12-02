const mysql = require('mysql2/promise');
require('dotenv').config();

async function resetActivationCode() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'windsurf_management'
    });

    try {
        const code = process.argv[2] || 'WS-MGH3-J0WM-VD87';
        
        // 重置激活码的机器码绑定
        const [result] = await connection.execute(
            'UPDATE activation_codes SET machine_code = NULL WHERE code = ?',
            [code]
        );
        
        if (result.affectedRows > 0) {
            console.log(`Activation code ${code} has been reset successfully!`);
        } else {
            console.log(`Activation code ${code} not found.`);
        }
        
        // 删除相关的用户激活记录
        await connection.execute(
            'DELETE ua FROM user_activations ua JOIN activation_codes ac ON ua.activation_code_id = ac.id WHERE ac.code = ?',
            [code]
        );
        
        console.log('Related user activations cleared.');
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await connection.end();
    }
}

resetActivationCode();
