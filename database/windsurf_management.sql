/*
 Navicat Premium Data Transfer

 Source Server         : javaweb
 Source Server Type    : MySQL
 Source Server Version : 80013
 Source Host           : localhost:3306
 Source Schema         : windsurf_management

 Target Server Type    : MySQL
 Target Server Version : 80013
 File Encoding         : 65001

 Date: 01/12/2025 13:03:48
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for accounts
-- ----------------------------
DROP TABLE IF EXISTS `accounts`;
CREATE TABLE `accounts`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '账号邮箱',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '账号名称',
  `api_key` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '账号API Key',
  `status` enum('active','inactive','used') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'active' COMMENT '账号状态',
  `is_assigned` tinyint(1) NULL DEFAULT 0 COMMENT '是否已分配',
  `assigned_to` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '分配给的激活码',
  `assigned_at` datetime(0) NULL DEFAULT NULL COMMENT '分配时间',
  `last_used` datetime(0) NULL DEFAULT NULL COMMENT '最后使用时间',
  `created_at` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
  `updated_at` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `email`(`email`) USING BTREE,
  INDEX `idx_status`(`status`) USING BTREE,
  INDEX `idx_assigned`(`is_assigned`) USING BTREE,
  INDEX `idx_assigned_to`(`assigned_to`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of accounts
-- ----------------------------
INSERT INTO `accounts` VALUES (1, 'demo1@windsurf.com', 'Demo Account 1', 'demo_api_key_001', 'active', 0, NULL, NULL, NULL, '2025-12-01 11:31:30', '2025-12-01 11:31:30');
INSERT INTO `accounts` VALUES (2, 'demo2@windsurf.com', 'Demo Account 2', 'demo_api_key_002', 'active', 0, NULL, NULL, NULL, '2025-12-01 11:31:30', '2025-12-01 11:31:30');
INSERT INTO `accounts` VALUES (3, 'demo3@windsurf.com', 'Demo Account 3', 'demo_api_key_003', 'active', 0, NULL, NULL, NULL, '2025-12-01 11:31:30', '2025-12-01 11:31:30');
INSERT INTO `accounts` VALUES (4, 'zoejane777@ctaasaddf.sbs', '1', '123', 'active', 0, NULL, NULL, NULL, '2025-12-01 12:16:02', '2025-12-01 12:16:02');
INSERT INTO `accounts` VALUES (5, 'zoejane777111@ctaasaddf.sbs', '1', '12', 'active', 0, NULL, NULL, NULL, '2025-12-01 12:36:16', '2025-12-01 12:36:16');
INSERT INTO `accounts` VALUES (6, 'zoejane77711@ctaasaddf.sbs', '1', '12', 'active', 0, NULL, NULL, NULL, '2025-12-01 13:01:49', '2025-12-01 13:01:49');

-- ----------------------------
-- Table structure for activation_codes
-- ----------------------------
DROP TABLE IF EXISTS `activation_codes`;
CREATE TABLE `activation_codes`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '激活码',
  `max_accounts` int(11) NOT NULL DEFAULT 1 COMMENT '最大可提号数量',
  `used_accounts` int(11) NULL DEFAULT 0 COMMENT '已使用的提号数量',
  `valid_days` int(11) NOT NULL DEFAULT 30 COMMENT '有效天数',
  `expire_date` datetime(0) NOT NULL COMMENT '过期时间',
  `status` enum('active','expired','disabled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'active' COMMENT '状态',
  `machine_code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '机器码绑定',
  `created_by` int(11) NULL DEFAULT NULL COMMENT '创建者ID',
  `created_at` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
  `activated_at` datetime(0) NULL DEFAULT NULL COMMENT '首次激活时间',
  `last_used` datetime(0) NULL DEFAULT NULL COMMENT '最后使用时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `code`(`code`) USING BTREE,
  INDEX `idx_code`(`code`) USING BTREE,
  INDEX `idx_status`(`status`) USING BTREE,
  INDEX `idx_expire`(`expire_date`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of activation_codes
-- ----------------------------
INSERT INTO `activation_codes` VALUES (1, 'WS-DEMO-1234-5678', 5, 0, 30, '2025-12-31 11:31:30', 'active', NULL, NULL, '2025-12-01 11:31:30', NULL, NULL);
INSERT INTO `activation_codes` VALUES (2, 'WS-TEST-ABCD-EFGH', 10, 0, 7, '2025-12-08 11:31:30', 'active', NULL, NULL, '2025-12-01 11:31:30', NULL, NULL);

-- ----------------------------
-- Table structure for activation_logs
-- ----------------------------
DROP TABLE IF EXISTS `activation_logs`;
CREATE TABLE `activation_logs`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `activation_code_id` int(11) NOT NULL,
  `action_type` enum('activate','pickup','switch','expire') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '操作类型',
  `account_id` int(11) NULL DEFAULT NULL COMMENT '相关账号ID',
  `machine_code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '机器码',
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT 'IP地址',
  `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '用户代理',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '操作描述',
  `created_at` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `account_id`(`account_id`) USING BTREE,
  INDEX `idx_activation_code`(`activation_code_id`) USING BTREE,
  INDEX `idx_action_type`(`action_type`) USING BTREE,
  INDEX `idx_created_at`(`created_at`) USING BTREE,
  CONSTRAINT `activation_logs_ibfk_1` FOREIGN KEY (`activation_code_id`) REFERENCES `activation_codes` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `activation_logs_ibfk_2` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of activation_logs
-- ----------------------------

-- ----------------------------
-- Table structure for admins
-- ----------------------------
DROP TABLE IF EXISTS `admins`;
CREATE TABLE `admins`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '加密后的密码',
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `role` enum('super_admin','admin') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'admin',
  `last_login` datetime(0) NULL DEFAULT NULL,
  `status` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'active',
  `created_at` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
  `updated_at` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `username`(`username`) USING BTREE,
  INDEX `idx_username`(`username`) USING BTREE,
  INDEX `idx_status`(`status`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of admins
-- ----------------------------
INSERT INTO `admins` VALUES (3, 'test_admin', '$2b$10$PQJj.iwcZYVMnEs5xaqo1uwsbYHGZcusaHUg02NXLvwovr.VvIU/C', 'test@windsurf.com', 'admin', NULL, 'active', '2025-12-01 11:31:30', '2025-12-01 11:31:30');
INSERT INTO `admins` VALUES (5, 'admin', '$2b$10$pEtLVe8Z/HKDTU4D5m90f.Jn7QPNKVfGcMnhSA6lBCTXVP0AJvIvS', 'admin@windsurf.com', 'super_admin', '2025-12-01 11:46:35', 'active', '2025-12-01 11:44:07', '2025-12-01 11:46:35');
INSERT INTO `admins` VALUES (6, '12345678', '$2b$10$e5F4QOH7RfwvrR03TKHdAO/Majv8ypMub2Hk.uLM17XLD6NlmQH5a', '3080714093@qq.com', 'admin', NULL, 'active', '2025-12-01 12:16:16', '2025-12-01 12:16:16');

-- ----------------------------
-- Table structure for system_config
-- ----------------------------
DROP TABLE IF EXISTS `system_config`;
CREATE TABLE `system_config`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `config_key` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `config_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `created_at` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
  `updated_at` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `config_key`(`config_key`) USING BTREE,
  INDEX `idx_key`(`config_key`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 29 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of system_config
-- ----------------------------
INSERT INTO `system_config` VALUES (15, 'activation_code_prefix', 'WS', '激活码前缀', '2025-12-01 11:31:30', '2025-12-01 11:31:30');
INSERT INTO `system_config` VALUES (16, 'activation_code_length', '16', '激活码长度（不含前缀）', '2025-12-01 11:31:30', '2025-12-01 11:31:30');
INSERT INTO `system_config` VALUES (17, 'default_valid_days', '30', '默认有效天数', '2025-12-01 11:31:30', '2025-12-01 11:31:30');
INSERT INTO `system_config` VALUES (18, 'max_accounts_per_code', '10', '每个激活码默认最大账号数', '2025-12-01 11:31:30', '2025-12-01 11:31:30');
INSERT INTO `system_config` VALUES (19, 'system_name', 'WindSurf续杯工具', '系统名称', '2025-12-01 11:31:30', '2025-12-01 11:31:30');
INSERT INTO `system_config` VALUES (20, 'system_version', '1.0.0', '系统版本', '2025-12-01 11:31:30', '2025-12-01 11:31:30');
INSERT INTO `system_config` VALUES (21, 'maintenance_mode', 'false', '维护模式', '2025-12-01 11:31:30', '2025-12-01 11:31:30');
INSERT INTO `system_config` VALUES (22, 'allow_registration', 'false', '是否允许注册', '2025-12-01 11:31:30', '2025-12-01 11:31:30');
INSERT INTO `system_config` VALUES (23, 'max_login_attempts', '5', '最大登录尝试次数', '2025-12-01 11:31:30', '2025-12-01 11:31:30');
INSERT INTO `system_config` VALUES (24, 'login_lock_duration', '30', '登录锁定时长（分钟）', '2025-12-01 11:31:30', '2025-12-01 11:31:30');
INSERT INTO `system_config` VALUES (25, 'token_expire_hours', '24', 'Token有效期（小时）', '2025-12-01 11:31:30', '2025-12-01 11:31:30');
INSERT INTO `system_config` VALUES (26, 'api_rate_limit', '100', 'API速率限制（每分钟请求数）', '2025-12-01 11:31:30', '2025-12-01 11:31:30');
INSERT INTO `system_config` VALUES (27, 'backup_enabled', 'true', '是否启用自动备份', '2025-12-01 11:31:30', '2025-12-01 11:31:30');
INSERT INTO `system_config` VALUES (28, 'backup_retention_days', '7', '备份保留天数', '2025-12-01 11:31:30', '2025-12-01 11:31:30');

-- ----------------------------
-- Table structure for token_imports
-- ----------------------------
DROP TABLE IF EXISTS `token_imports`;
CREATE TABLE `token_imports`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `token` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Token内容',
  `status` enum('pending','processed','failed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'pending' COMMENT '处理状态',
  `processed_account_id` int(11) NULL DEFAULT NULL COMMENT '处理后的账号ID',
  `error_message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '错误信息',
  `created_at` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
  `processed_at` datetime(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `processed_account_id`(`processed_account_id`) USING BTREE,
  INDEX `idx_status`(`status`) USING BTREE,
  INDEX `idx_created_at`(`created_at`) USING BTREE,
  CONSTRAINT `token_imports_ibfk_1` FOREIGN KEY (`processed_account_id`) REFERENCES `accounts` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of token_imports
-- ----------------------------

-- ----------------------------
-- Table structure for user_activations
-- ----------------------------
DROP TABLE IF EXISTS `user_activations`;
CREATE TABLE `user_activations`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `activation_code_id` int(11) NOT NULL,
  `machine_code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '机器码',
  `current_account_id` int(11) NULL DEFAULT NULL COMMENT '当前使用的账号',
  `activated_at` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) COMMENT '激活时间',
  `last_check` datetime(0) NULL DEFAULT NULL COMMENT '最后检查时间',
  `status` enum('active','expired') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'active',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `unique_machine_code`(`machine_code`, `activation_code_id`) USING BTREE,
  INDEX `activation_code_id`(`activation_code_id`) USING BTREE,
  INDEX `current_account_id`(`current_account_id`) USING BTREE,
  INDEX `idx_machine_code`(`machine_code`) USING BTREE,
  INDEX `idx_status`(`status`) USING BTREE,
  CONSTRAINT `user_activations_ibfk_1` FOREIGN KEY (`activation_code_id`) REFERENCES `activation_codes` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `user_activations_ibfk_2` FOREIGN KEY (`current_account_id`) REFERENCES `accounts` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of user_activations
-- ----------------------------

-- ----------------------------
-- View structure for v_activation_details
-- ----------------------------
DROP VIEW IF EXISTS `v_activation_details`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `v_activation_details` AS select `ac`.`id` AS `id`,`ac`.`code` AS `code`,`ac`.`max_accounts` AS `max_accounts`,`ac`.`used_accounts` AS `used_accounts`,`ac`.`valid_days` AS `valid_days`,`ac`.`expire_date` AS `expire_date`,`ac`.`status` AS `status`,`ac`.`created_at` AS `created_at`,`ac`.`activated_at` AS `activated_at`,count(distinct `ua`.`id`) AS `active_users`,count(distinct `al`.`id`) AS `total_logs` from ((`activation_codes` `ac` left join `user_activations` `ua` on(((`ua`.`activation_code_id` = `ac`.`id`) and (`ua`.`status` = 'active')))) left join `activation_logs` `al` on((`al`.`activation_code_id` = `ac`.`id`))) group by `ac`.`id`;

-- ----------------------------
-- Procedure structure for check_expired_codes
-- ----------------------------
DROP PROCEDURE IF EXISTS `check_expired_codes`;
delimiter ;;
CREATE PROCEDURE `check_expired_codes`()
BEGIN
    UPDATE activation_codes 
    SET status = 'expired' 
    WHERE expire_date <= NOW() AND status = 'active';
    
    UPDATE user_activations ua
    INNER JOIN activation_codes ac ON ua.activation_code_id = ac.id
    SET ua.status = 'expired'
    WHERE ac.status = 'expired' AND ua.status = 'active';
END
;;
delimiter ;

-- ----------------------------
-- Event structure for auto_check_expired
-- ----------------------------
DROP EVENT IF EXISTS `auto_check_expired`;
delimiter ;;
CREATE EVENT `auto_check_expired`
ON SCHEDULE
EVERY '1' HOUR STARTS '2025-12-01 11:31:20'
DO CALL check_expired_codes()
;;
delimiter ;

SET FOREIGN_KEY_CHECKS = 1;
