# 数据库迁移指南

## 🚀 迁移脚本选择

根据您的操作系统和环境，选择合适的迁移方式：

### Windows 环境

#### PowerShell (推荐)
- **文件**: `migrate-database.ps1`
- **要求**: PowerShell 5.1+
- **优点**: 彩色输出、详细验证、错误处理完善
- **使用**: 
  ```powershell
  cd server
  .\migrate-database.ps1
  ```

#### 命令提示符
- **文件**: `migrate-database.bat`
- **要求**: Windows 命令提示符
- **优点**: 兼容性好、无需额外配置
- **使用**:
  ```cmd
  cd server
  migrate-database.bat
  ```

### Linux/macOS 环境

#### Bash 脚本
- **文件**: 直接使用MySQL命令
- **要求**: MySQL客户端
- **使用**:
  ```bash
  cd server
  mysql -u root -p123456 < sql/02_auth_permissions_migration.sql
  ```

#### Node.js 验证
- **文件**: `test-migration.js`
- **用途**: 验证迁移脚本语法和功能
- **使用**:
  ```bash
  cd server
  node test-migration.js
  ```

## ⚙️ 环境配置

在执行迁移前，请确保环境变量正确配置：

### Windows PowerShell
```powershell
$env:DB_HOST = "localhost"
$env:DB_PORT = "3306"
$env:DB_USER = "root"
$env:DB_PASSWORD = "123456"
$env:DB_NAME = "liuyao_db"
```

### Windows CMD
```cmd
set DB_HOST=localhost
set DB_PORT=3306
set DB_USER=root
set DB_PASSWORD=123456
set DB_NAME=liuyao_db
```

### Linux/macOS
```bash
export DB_HOST=localhost
export DB_PORT=3306
export DB_USER=root
export DB_PASSWORD=123456
export DB_NAME=liuyao_db
```

### 或使用 .env 文件
创建 `server/.env` 文件：
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=123456
DB_NAME=liuyao_db
```

## 🔧 迁移内容

### 新增表结构
1. **audit_logs** - 审计日志表
2. **invite_codes** - 邀请码管理表
3. **token_blacklist** - Token黑名单表

### 扩展现有表
1. **users表** 新增字段：
   - `login_fail_count` - 登录失败次数
   - `locked_until` - 账号锁定时间
   - `password_reset_token` - 密码重置令牌
   - `password_reset_expires` - 密码重置过期时间
   - `last_password_change` - 最后密码修改时间
   - `email_verified` - 邮箱验证状态
   - `email_verification_token` - 邮箱验证令牌

### 新增权限数据
- 审计管理权限 (3个)
- 邀请码管理权限 (4个)
- 系统管理权限 (2个)
- 数据管理权限 (3个)

### 自动化功能
- 存储过程：`CleanupExpiredData`
- 定时事件：`event_cleanup_expired_data`

## 📋 迁移验证

### 自动验证
PowerShell和批处理脚本包含自动验证功能：
- 检查表是否创建成功
- 检查字段是否添加成功
- 检查权限数据是否插入
- 检查邀请码数据是否插入

### 手动验证
```bash
# 验证表结构
mysql -u root -p123456 -e "SHOW TABLES FROM liuyao_db;"

# 验证新字段
mysql -u root -p123456 -e "DESCRIBE liuyao_db.users;"

# 验证权限数据
mysql -u root -p123456 -e "SELECT COUNT(*) FROM liuyao_db.permissions WHERE permission_code LIKE 'audit:%' OR permission_code LIKE 'invite:%';"
```

## 🚨 故障排除

### 常见问题

**Q: PowerShell执行策略限制**
```powershell
# 临时允许脚本执行
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 或绕过执行策略
powershell -ExecutionPolicy Bypass -File .\migrate-database.ps1
```

**Q: MySQL命令不可用**
- 确保MySQL已安装
- 检查PATH环境变量
- Windows可能需要使用完整路径：`"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"`

**Q: 权限不足错误**
```sql
-- 授予必要权限
GRANT ALL PRIVILEGES ON liuyao_db.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

**Q: 字符集问题**
```sql
-- 检查字符集设置
SHOW VARIABLES LIKE 'character_set%';
SHOW VARIABLES LIKE 'collation%';
```

### 错误代码说明
- **Exit Code 1**: 一般错误，检查错误信息
- **Exit Code 2**: MySQL不可用或连接失败
- **Exit Code 3**: 迁移脚本文件不存在

## 📞 技术支持

如果遇到迁移问题：

1. **检查日志**: 查看控制台输出的错误信息
2. **验证环境**: 确认MySQL服务和配置正确
3. **手动执行**: 使用直接MySQL命令尝试
4. **查看文档**: 参考 `USAGE_GUIDE.md` 详细说明
5. **提交问题**: 在项目仓库提交Issue

---

**选择合适的迁移方式，确保数据库成功升级到最新版本！** 🎯