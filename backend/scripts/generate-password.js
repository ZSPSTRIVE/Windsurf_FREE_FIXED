// 生成密码hash的脚本
const bcrypt = require('bcryptjs');

const passwords = [
    { username: 'admin', password: 'Admin@123456' },
    { username: 'test_admin', password: 'Test@123456' }
];

async function generateHashes() {
    console.log('生成密码Hash...\n');
    
    for (const user of passwords) {
        const hash = await bcrypt.hash(user.password, 10);
        console.log(`用户名: ${user.username}`);
        console.log(`密码: ${user.password}`);
        console.log(`Hash: ${hash}`);
        console.log('---');
    }
    
    console.log('\n请将生成的Hash更新到init.sql文件中！');
}

generateHashes().catch(console.error);
