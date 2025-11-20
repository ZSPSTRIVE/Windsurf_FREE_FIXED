# Backend Scripts 使用说明

## 脚本列表

### 1. init-admin.js - 初始化管理员账号

**功能**：创建或重置管理员账号

**使用方法**：
```bash
cd backend/scripts
node init-admin.js
```

**说明**：
- 默认创建用户名：`admin`
- 默认密码：`admin123`
- 如果管理员已存在，会重置密码
- 用于首次部署或忘记密码时使用

---

### 2. hash-password.js - 密码哈希生成器

**功能**：生成 bcrypt 密码哈希值

**使用方法**：
```bash
cd backend/scripts
node hash-password.js <your-password>
```

**示例**：
```bash
node hash-password.js mySecurePass123
```

---

### 3. check-db.js - 数据库连接检查

**功能**：测试数据库连接和查看表信息

**使用方法**：
```bash
cd backend/scripts
node check-db.js
```

**输出内容**：
- 数据库连接状态
- 所有表的列表
- 各表的记录数量

---

### 4. reset-activation.js - 重置激活码

**功能**：重置特定激活码的使用状态

**使用方法**：
```bash
cd backend/scripts
node reset-activation.js <activation-code>
```

**示例**：
```bash
node reset-activation.js TEST-CODE-001
```

---

## 注意事项

1. **环境配置**：
   - 所有脚本都依赖 `backend/.env` 文件
   - 确保数据库配置正确

2. **运行前准备**：
   ```bash
   # 进入 backend 目录
   cd D:\AllDemo\test16\backend
   
   # 确保依赖已安装
   npm install
   
   # 配置 .env 文件
   cp .env.example .env
   # 编辑 .env 文件，设置数据库连接信息
   ```

3. **权限要求**：
   - 需要数据库写入权限
   - 生产环境谨慎使用

## 常见问题

### Q: 数据库连接失败
A: 检查 `.env` 文件中的数据库配置：
   - DB_HOST
   - DB_PORT
   - DB_USER
   - DB_PASSWORD
   - DB_NAME

### Q: 找不到 bcrypt 模块
A: 安装依赖：
   ```bash
   cd backend
   npm install bcrypt
   ```

### Q: 管理员无法登录
A: 运行 `init-admin.js` 重置密码：
   ```bash
   node scripts/init-admin.js
   ```
