const bcrypt = require('bcryptjs');

const password = 'admin123';
const rounds = 10;

bcrypt.hash(password, rounds, (err, hash) => {
    if (err) {
        console.error('Error hashing password:', err);
    } else {
        console.log('Password:', password);
        console.log('Hash:', hash);
        console.log('\nSQL Update Command:');
        console.log(`UPDATE admins SET password = '${hash}' WHERE username = 'admin';`);
    }
});
