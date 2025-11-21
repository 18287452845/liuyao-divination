# 快速部署指南

## 方式一：传统部署（5分钟）

### 1. 服务器准备
```bash
# 安装必要软件
sudo apt update
sudo apt install -y nodejs npm mysql-server nginx

# 安装PM2
sudo npm install -g pm2
```

### 2. 上传项目
```bash
# 克隆项目
git clone <your-repo-url> /var/www/liuyao
cd /var/www/liuyao
```

### 3. 配置环境
```bash
# 配置服务端环境变量
cp server/.env.example server/.env
nano server/.env
# 修改数据库密码、JWT密钥、DeepSeek API密钥
```

### 4. 初始化数据库
```bash
# 创建数据库
mysql -u root -p
CREATE DATABASE liuyao_db CHARACTER SET utf8mb4;
EXIT;

# 导入数据
mysql -u root -p liuyao_db < server/sql/init_database.sql
mysql -u root -p liuyao_db < server/sql/insert_data.sql
mysql -u root -p liuyao_db < server/sql/auth_tables.sql
mysql -u root -p liuyao_db < server/sql/auth_init_data.sql
```

### 5. 一键部署
```bash
# Linux/Mac
chmod +x deploy.sh
./deploy.sh

# Windows
deploy.bat
```

### 6. 配置Nginx
```bash
# 复制Nginx配置
sudo cp nginx.conf /etc/nginx/sites-available/liuyao
sudo ln -s /etc/nginx/sites-available/liuyao /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. 完成！
访问 `http://your-domain.com` 即可使用

---

## 方式二：Docker部署（3分钟）

### 1. 安装Docker
```bash
curl -fsSL https://get.docker.com | sudo sh
sudo systemctl start docker
sudo systemctl enable docker
```

### 2. 配置环境
```bash
cd /var/www/liuyao
cp .env.example .env
nano .env
# 修改环境变量
```

### 3. 一键启动
```bash
docker-compose up -d
```

### 4. 完成！
访问 `http://your-server-ip` 即可使用

---

## 常用命令

### PM2管理
```bash
pm2 start ecosystem.config.js    # 启动
pm2 restart liuyao-server         # 重启
pm2 stop liuyao-server            # 停止
pm2 logs liuyao-server            # 查看日志
pm2 monit                         # 监控
```

### Docker管理
```bash
docker-compose up -d              # 启动
docker-compose restart            # 重启
docker-compose stop               # 停止
docker-compose logs -f            # 查看日志
```

### Nginx管理
```bash
sudo nginx -t                     # 测试配置
sudo systemctl restart nginx      # 重启
sudo systemctl status nginx       # 状态
```

---

## 默认账号

- **管理员**: admin / admin123
- **普通用户**: testuser / test123
- **注册邀请码**: 1663929970

**⚠️ 部署后请立即修改默认密码！**

---

## 故障排查

### 后端无法启动
```bash
# 查看日志
pm2 logs liuyao-server
# 或
tail -f logs/server-error.log
```

### 数据库连接失败
```bash
# 检查MySQL状态
sudo systemctl status mysql

# 测试连接
mysql -u liuyao_user -p liuyao_db
```

### Nginx 502错误
```bash
# 检查后端是否运行
pm2 status

# 检查端口占用
sudo lsof -i :5000
```

---

## 安全提示

部署后请务必：
1. 修改所有默认密码
2. 配置防火墙
3. 启用HTTPS
4. 定期备份数据库
5. 及时更新依赖

---

需要帮助？查看完整文档：`doc/DEPLOYMENT.md`
