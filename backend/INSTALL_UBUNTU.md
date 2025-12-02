# Ubuntu 系统安装指南

## 依赖安装

### 方式一：使用 bcryptjs（推荐，已配置）

项目已配置为使用 `bcryptjs`，这是一个纯 JavaScript 实现的 bcrypt 库，不需要编译，可以直接安装：

```bash
cd /home/backend
npm install
```

### 方式二：如果想使用原生 bcrypt（需要编译）

如果您想使用原生的 bcrypt（性能更好），需要先安装编译工具：

```bash
# 1. 安装编译工具
apt-get update
apt-get install -y build-essential python3 make g++

# 2. 切换到 bcrypt
npm uninstall bcryptjs
npm install bcrypt

# 3. 修改代码中的引用（将所有 require('bcryptjs') 改回 require('bcrypt')）
# 需要修改的文件：
# - routes/admin.js
# - routes/auth.js  
# - scripts/generate-password.js
# - scripts/init-admin.js
# - scripts/hash-password.js
```

## 数据库初始化

```bash
# 1. 创建数据库结构
mysql -u root -p < /path/to/database/schema.sql

# 2. 初始化数据（包含默认管理员账号）
mysql -u root -p < /path/to/database/init.sql
```

## 环境配置

创建 `.env` 文件：

```bash
# 数据库配置
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_DATABASE=windsurf_management

# JWT配置
JWT_SECRET=your-secret-key-here

# 加密配置
BCRYPT_ROUNDS=10

# 端口配置
PORT=3001
```

## 启动服务

### 开发模式
```bash
npm run dev
```

### 生产模式
```bash
npm start
```

### 使用 PM2 管理
```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs
```

## 默认账号

- 超级管理员：`admin` / `Admin@123456`
- 测试管理员：`test_admin` / `Test@123456`

**注意：请在首次登录后立即修改默认密码！**

## 常见问题

### 1. npm install 失败

如果遇到网络问题，可以使用国内镜像：

```bash
npm config set registry https://registry.npmmirror.com
npm install
```

### 2. 数据库连接失败

检查 MySQL 服务是否运行：

```bash
systemctl status mysql
```

确保 `.env` 文件中的数据库配置正确。

### 3. 端口被占用

修改 `.env` 文件中的 `PORT` 配置为其他端口。

## 技术支持

如有问题，请查看项目文档或提交 Issue。
