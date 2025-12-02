# 数据库安装和管理指南

## 文件说明

### 主要文件

1. **setup.sql** - 完整的数据库安装脚本（推荐使用）
   - 包含所有表结构、视图、存储过程、事件
   - 包含系统配置初始数据
   - 包含默认管理员账号
   - 测试数据已注释（可选启用）

2. **schema.sql** - 仅数据库结构（已整合到setup.sql）
   - 表结构定义
   - 视图、存储过程、事件定义
   - 旧版本，建议使用setup.sql

3. **init.sql** - 仅初始数据（已整合到setup.sql）
   - 系统配置数据
   - 默认管理员账号
   - 旧版本，建议使用setup.sql

## 安装方法

### 方法一：使用完整安装脚本（推荐）

```bash
mysql -u root -p < setup.sql
```

这将完成：
- 创建数据库 `windsurf_management`
- 创建所有必需的表
- 创建视图和存储过程
- 插入系统配置
- 创建默认管理员账号

### 方法二：分步安装（如需自定义）

```bash
# 1. 仅创建数据库结构
mysql -u root -p < schema.sql

# 2. 插入初始数据
mysql -u root -p < init.sql
```

## 默认账号

| 用户类型 | 用户名 | 密码 | 说明 |
|---------|--------|------|------|
| 超级管理员 | admin | Admin@123456 | 拥有所有权限 |
| 测试管理员 | test_admin | Test@123456 | 仅测试用，生产环境请删除 |

**⚠️ 重要提醒：请在首次登录后立即修改默认密码！**

## 测试数据

setup.sql 中包含已注释的测试数据：
- 测试管理员账号
- 示例激活码
- 示例账号

如需使用测试数据，取消相应行的注释即可。

## 数据库配置

在后端的 `.env` 文件中配置数据库连接：

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_DATABASE=windsurf_management
```

## 维护建议

### 1. 定期备份

```bash
# 备份整个数据库
mysqldump -u root -p windsurf_management > backup_$(date +%Y%m%d).sql

# 仅备份数据
mysqldump -u root -p windsurf_management --no-create-info > data_backup_$(date +%Y%m%d).sql
```

### 2. 清理过期数据

系统已配置自动事件 `auto_check_expired`，每小时检查并标记过期的激活码。

手动执行清理：
```sql
CALL check_expired_codes();
```

### 3. 性能优化

查看慢查询：
```sql
-- 查看激活码使用情况
SELECT * FROM v_activation_details;

-- 查看索引使用情况
SHOW INDEX FROM activation_codes;
SHOW INDEX FROM accounts;
```

## 常见问题

### 1. 字符集问题

如果遇到中文乱码，确保数据库使用 utf8mb4：
```sql
ALTER DATABASE windsurf_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. 事件调度器未启用

如果自动过期检查不工作，检查事件调度器：
```sql
-- 查看状态
SHOW VARIABLES LIKE 'event_scheduler';

-- 启用事件调度器
SET GLOBAL event_scheduler = ON;
```

### 3. 权限问题

确保MySQL用户有足够的权限：
```sql
GRANT ALL PRIVILEGES ON windsurf_management.* TO 'your_user'@'localhost';
FLUSH PRIVILEGES;
```

## 版本历史

- v1.0.0 - 初始版本
  - 基础表结构
  - 系统配置
  - 默认管理员账号
  - 自动过期检查

## 技术支持

如有问题，请查看项目文档或提交Issue。
