-- WindSurf续杯工具数据库初始化脚本
-- 包含默认管理员账号和系统配置

-- 使用数据库
USE windsurf_management;

-- 清空并重置系统配置表
DELETE FROM system_config;

-- 插入系统配置
INSERT INTO system_config (config_key, config_value, description) VALUES
('activation_code_prefix', 'WS', '激活码前缀'),
('activation_code_length', '16', '激活码长度（不含前缀）'),
('default_valid_days', '30', '默认有效天数'),
('max_accounts_per_code', '10', '每个激活码默认最大账号数'),
('system_name', 'WindSurf续杯工具', '系统名称'),
('system_version', '1.0.0', '系统版本'),
('maintenance_mode', 'false', '维护模式'),
('allow_registration', 'false', '是否允许注册'),
('max_login_attempts', '5', '最大登录尝试次数'),
('login_lock_duration', '30', '登录锁定时长（分钟）'),
('token_expire_hours', '24', 'Token有效期（小时）'),
('api_rate_limit', '100', 'API速率限制（每分钟请求数）'),
('backup_enabled', 'true', '是否启用自动备份'),
('backup_retention_days', '7', '备份保留天数');

-- 清空管理员表（慎用，仅在初始化时使用）
DELETE FROM admins;

-- 插入默认超级管理员账号
-- 用户名: admin
-- 密码: Admin@123456 (使用bcryptjs加密，成本因子10)
INSERT INTO admins (username, password, email, role, status) VALUES
('admin', '$2b$10$pEtLVe8Z/HKDTU4D5m90f.Jn7QPNKVfGcMnhSA6lBCTXVP0AJvIvS', 'admin@windsurf.com', 'super_admin', 'active');

-- 插入测试管理员账号（生产环境请删除）
-- 用户名: test_admin
-- 密码: Test@123456
INSERT INTO admins (username, password, email, role, status) VALUES
('test_admin', '$2b$10$PQJj.iwcZYVMnEs5xaqo1uwsbYHGZcusaHUg02NXLvwovr.VvIU/C', 'test@windsurf.com', 'admin', 'active');

-- 插入示例激活码（生产环境请删除）
INSERT INTO activation_codes (code, max_accounts, valid_days, expire_date, status) VALUES
('WS-DEMO-1234-5678', 5, 30, DATE_ADD(NOW(), INTERVAL 30 DAY), 'active'),
('WS-TEST-ABCD-EFGH', 10, 7, DATE_ADD(NOW(), INTERVAL 7 DAY), 'active');

-- 插入示例账号（生产环境请删除）
INSERT INTO accounts (email, name, api_key, status) VALUES
('demo1@windsurf.com', 'Demo Account 1', 'demo_api_key_001', 'active'),
('demo2@windsurf.com', 'Demo Account 2', 'demo_api_key_002', 'active'),
('demo3@windsurf.com', 'Demo Account 3', 'demo_api_key_003', 'active');

-- 输出初始化信息
SELECT '========================================' AS '';
SELECT '数据库初始化完成！' AS '提示';
SELECT '========================================' AS '';
SELECT '默认超级管理员账号：' AS '信息', 'admin' AS '值' 
UNION ALL
SELECT '默认密码：' AS '信息', 'Admin@123456' AS '值'
UNION ALL  
SELECT '测试管理员账号：' AS '信息', 'test_admin' AS '值'
UNION ALL
SELECT '测试密码：' AS '信息', 'Test@123456' AS '值';
SELECT '========================================' AS '';
SELECT '请立即修改默认密码！' AS '重要提示';
SELECT '========================================' AS '';
