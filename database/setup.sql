-- WindSurf续杯工具 - 完整数据库安装脚本
-- 包含数据库架构创建和初始数据
-- ============================================

-- 第一部分：创建数据库和表结构
-- ============================================

CREATE DATABASE IF NOT EXISTS windsurf_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE windsurf_management;

-- 账号信息表
CREATE TABLE IF NOT EXISTS accounts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE COMMENT '账号邮箱',
    name VARCHAR(100) NOT NULL COMMENT '账号名称',
    api_key VARCHAR(500) NOT NULL COMMENT '账号API Key',
    status ENUM('active', 'inactive', 'used') DEFAULT 'active' COMMENT '账号状态',
    is_assigned BOOLEAN DEFAULT FALSE COMMENT '是否已分配',
    assigned_to VARCHAR(100) DEFAULT NULL COMMENT '分配给的激活码',
    assigned_at DATETIME DEFAULT NULL COMMENT '分配时间',
    last_used DATETIME DEFAULT NULL COMMENT '最后使用时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_assigned (is_assigned),
    INDEX idx_assigned_to (assigned_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 激活码表
CREATE TABLE IF NOT EXISTS activation_codes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(100) NOT NULL UNIQUE COMMENT '激活码',
    max_accounts INT NOT NULL DEFAULT 1 COMMENT '最大可提号数量',
    used_accounts INT DEFAULT 0 COMMENT '已使用的提号数量',
    valid_days INT NOT NULL DEFAULT 30 COMMENT '有效天数',
    expire_date DATETIME NOT NULL COMMENT '过期时间',
    status ENUM('active', 'expired', 'disabled') DEFAULT 'active' COMMENT '状态',
    machine_code VARCHAR(255) DEFAULT NULL COMMENT '机器码绑定',
    created_by INT DEFAULT NULL COMMENT '创建者ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activated_at DATETIME DEFAULT NULL COMMENT '首次激活时间',
    last_used DATETIME DEFAULT NULL COMMENT '最后使用时间',
    INDEX idx_code (code),
    INDEX idx_status (status),
    INDEX idx_expire (expire_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 激活码使用记录表
CREATE TABLE IF NOT EXISTS activation_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    activation_code_id INT NOT NULL,
    action_type ENUM('activate', 'pickup', 'switch', 'expire') NOT NULL COMMENT '操作类型',
    account_id INT DEFAULT NULL COMMENT '相关账号ID',
    machine_code VARCHAR(255) DEFAULT NULL COMMENT '机器码',
    ip_address VARCHAR(45) DEFAULT NULL COMMENT 'IP地址',
    user_agent TEXT DEFAULT NULL COMMENT '用户代理',
    description TEXT DEFAULT NULL COMMENT '操作描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (activation_code_id) REFERENCES activation_codes(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL,
    INDEX idx_activation_code (activation_code_id),
    INDEX idx_action_type (action_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 用户激活码关联表
CREATE TABLE IF NOT EXISTS user_activations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    activation_code_id INT NOT NULL,
    machine_code VARCHAR(255) NOT NULL COMMENT '机器码',
    current_account_id INT DEFAULT NULL COMMENT '当前使用的账号',
    activated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '激活时间',
    last_check DATETIME DEFAULT NULL COMMENT '最后检查时间',
    status ENUM('active', 'expired') DEFAULT 'active',
    FOREIGN KEY (activation_code_id) REFERENCES activation_codes(id) ON DELETE CASCADE,
    FOREIGN KEY (current_account_id) REFERENCES accounts(id) ON DELETE SET NULL,
    UNIQUE KEY unique_machine_code (machine_code, activation_code_id),
    INDEX idx_machine_code (machine_code),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 管理员表
CREATE TABLE IF NOT EXISTS admins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL COMMENT '加密后的密码',
    email VARCHAR(255) DEFAULT NULL,
    role ENUM('super_admin', 'admin') DEFAULT 'admin',
    last_login DATETIME DEFAULT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Token存储表（用于临时存储待处理的token）
CREATE TABLE IF NOT EXISTS token_imports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    token TEXT NOT NULL COMMENT 'Token内容',
    status ENUM('pending', 'processed', 'failed') DEFAULT 'pending' COMMENT '处理状态',
    processed_account_id INT DEFAULT NULL COMMENT '处理后的账号ID',
    error_message TEXT DEFAULT NULL COMMENT '错误信息',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME DEFAULT NULL,
    FOREIGN KEY (processed_account_id) REFERENCES accounts(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 系统配置表
CREATE TABLE IF NOT EXISTS system_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT,
    description VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 第二部分：创建视图、存储过程和事件
-- ============================================

-- 创建视图：激活码详细信息
CREATE OR REPLACE VIEW v_activation_details AS
SELECT 
    ac.id,
    ac.code,
    ac.max_accounts,
    ac.used_accounts,
    ac.valid_days,
    ac.expire_date,
    ac.status,
    ac.created_at,
    ac.activated_at,
    COUNT(DISTINCT ua.id) as active_users,
    COUNT(DISTINCT al.id) as total_logs
FROM activation_codes ac
LEFT JOIN user_activations ua ON ua.activation_code_id = ac.id AND ua.status = 'active'
LEFT JOIN activation_logs al ON al.activation_code_id = ac.id
GROUP BY ac.id;

-- 删除已存在的存储过程（如果有）
DROP PROCEDURE IF EXISTS check_expired_codes;

-- 创建存储过程：检查并更新过期的激活码
DELIMITER $$
CREATE PROCEDURE check_expired_codes()
BEGIN
    UPDATE activation_codes 
    SET status = 'expired' 
    WHERE expire_date <= NOW() AND status = 'active';
    
    UPDATE user_activations ua
    INNER JOIN activation_codes ac ON ua.activation_code_id = ac.id
    SET ua.status = 'expired'
    WHERE ac.status = 'expired' AND ua.status = 'active';
END$$
DELIMITER ;

-- 删除已存在的事件（如果有）
DROP EVENT IF EXISTS auto_check_expired;

-- 创建事件：每小时自动检查过期的激活码
CREATE EVENT IF NOT EXISTS auto_check_expired
ON SCHEDULE EVERY 1 HOUR
DO CALL check_expired_codes();

-- ============================================
-- 第三部分：插入初始数据
-- ============================================

-- 清空并插入系统配置（使用INSERT IGNORE避免重复）
DELETE FROM system_config;
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

-- 插入默认管理员账号（如果不存在）
-- 注意：生产环境部署时，请修改默认密码！
INSERT IGNORE INTO admins (username, password, email, role, status) VALUES
-- 超级管理员 - 用户名: admin, 密码: Admin@123456
('admin', '$2b$10$pEtLVe8Z/HKDTU4D5m90f.Jn7QPNKVfGcMnhSA6lBCTXVP0AJvIvS', 'admin@windsurf.com', 'super_admin', 'active');

-- ============================================
-- 第四部分：可选的测试数据（生产环境请注释或删除）
-- ============================================

-- 测试管理员账号 - 用户名: test_admin, 密码: Test@123456
-- INSERT IGNORE INTO admins (username, password, email, role, status) VALUES
-- ('test_admin', '$2b$10$PQJj.iwcZYVMnEs5xaqo1uwsbYHGZcusaHUg02NXLvwovr.VvIU/C', 'test@windsurf.com', 'admin', 'active');

-- 示例激活码
-- INSERT INTO activation_codes (code, max_accounts, valid_days, expire_date, status) VALUES
-- ('WS-DEMO-1234-5678', 5, 30, DATE_ADD(NOW(), INTERVAL 30 DAY), 'active'),
-- ('WS-TEST-ABCD-EFGH', 10, 7, DATE_ADD(NOW(), INTERVAL 7 DAY), 'active');

-- 示例账号
-- INSERT INTO accounts (email, name, api_key, status) VALUES
-- ('demo1@windsurf.com', 'Demo Account 1', 'demo_api_key_001', 'active'),
-- ('demo2@windsurf.com', 'Demo Account 2', 'demo_api_key_002', 'active'),
-- ('demo3@windsurf.com', 'Demo Account 3', 'demo_api_key_003', 'active');

-- ============================================
-- 第五部分：安装完成提示
-- ============================================

SELECT '========================================' AS '';
SELECT 'WindSurf续杯工具 数据库安装完成！' AS '提示';
SELECT '========================================' AS '';
SELECT '默认超级管理员账号信息：' AS '';
SELECT '用户名: admin' AS '';
SELECT '密码: Admin@123456' AS '';
SELECT '========================================' AS '';
SELECT '重要提醒：' AS '';
SELECT '1. 请立即登录系统修改默认密码' AS '';
SELECT '2. 生产环境部署前请删除测试数据' AS '';
SELECT '3. 建议定期备份数据库' AS '';
SELECT '========================================' AS '';
