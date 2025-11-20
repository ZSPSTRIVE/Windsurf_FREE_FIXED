const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDatabase() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'windsurf_management'
    });

    try {
        console.log('Checking database tables...\n');
        
        // Check if tables exist
        const tables = [
            'activation_codes',
            'user_activations',
            'activation_logs',
            'accounts',
            'admins'
        ];
        
        for (const table of tables) {
            const [result] = await connection.execute(
                `SELECT COUNT(*) as count FROM information_schema.tables 
                 WHERE table_schema = ? AND table_name = ?`,
                [process.env.DB_NAME || 'windsurf_management', table]
            );
            
            if (result[0].count > 0) {
                const [countResult] = await connection.execute(`SELECT COUNT(*) as total FROM ${table}`);
                console.log(`✓ Table '${table}' exists - ${countResult[0].total} records`);
            } else {
                console.log(`✗ Table '${table}' does NOT exist`);
            }
        }
        
        // Test the problematic query
        console.log('\nTesting activation codes query...');
        try {
            const query = `
                SELECT 
                    ac.*,
                    COUNT(DISTINCT ua.id) as active_users,
                    COUNT(DISTINCT al.id) as total_logs
                FROM activation_codes ac
                LEFT JOIN user_activations ua ON ua.activation_code_id = ac.id AND ua.status = 'active'
                LEFT JOIN activation_logs al ON al.activation_code_id = ac.id
                GROUP BY ac.id
                LIMIT 1
            `;
            
            const [result] = await connection.execute(query);
            console.log('✓ Query executed successfully');
            console.log('Results:', result);
        } catch (err) {
            console.log('✗ Query failed:', err.message);
        }
        
    } catch (error) {
        console.error('Database check error:', error.message);
    } finally {
        await connection.end();
    }
}

checkDatabase();
