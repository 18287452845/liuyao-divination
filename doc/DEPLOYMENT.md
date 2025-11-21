# 六爻排盘系统 - 服务器部署指南

## 目录
- [系统要求](#系统要求)
- [部署方式选择](#部署方式选择)
- [方式一：传统部署（推荐）](#方式一传统部署推荐)
- [方式二：Docker部署](#方式二docker部署)
- [方式三：宝塔面板部署](#方式三宝塔面板部署)
- [SSL证书配置](#ssl证书配置)
- [性能优化](#性能优化)
- [监控和维护](#监控和维护)

---

## 系统要求

### 最低配置
- **CPU**: 1核
- **内存**: 1GB
- **硬盘**: 10GB
- **带宽**: 1Mbps

### 推荐配置
- **CPU**: 2核+
- **内存**: 2GB+
- **硬盘**: 20GB+ SSD
- **带宽**: 5Mbps+

### 软件要求
- **操作系统**: Ubuntu 20.04+ / CentOS 7+ / Debian 10+
- **Node.js**: v18.0.0+
- **MySQL**: 5.7+ 或 8.0+
- **Nginx**: 1.18+（可选，用于反向代理）
- **PM2**: 全局安装（用于进程管理）

---

## 部署方式选择

| 方式 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| 传统部署 | 灵活、可控 | 需要手动配置 | 生产环境 |
| Docker部署 | 快速、一致 | 资源占用稍高 | 开发/测试 |
| 宝塔面板 | 简单、可视化 | 依赖面板 | 小型项目 |

---

## 方式一：传统部署（推荐）

### 1. 服务器准备

#### 1.1 更新系统
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS
sudo yum update -y
```

#### 1.2 安装Node.js
```bash
# 使用 NodeSource 仓库安装 Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 验证安装
node -v  # 应该显示 v18.x.x
npm -v
```

#### 1.3 安装MySQL
```bash
# Ubuntu/Debian
sudo apt install -y mysql-server

# 启动MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# 安全配置
sudo mysql_secure_installation
```

#### 1.4 安装Nginx
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### 1.5 安装PM2
```bash
sudo npm install -g pm2
```

---

### 2. 项目部署

#### 2.1 创建部署目录
```bash
# 创建项目目录
sudo mkdir -p /var/www/liuyao
sudo chown -R $USER:$USER /var/www/liuyao
cd /var/www/liuyao
```

#### 2.2 上传项目文件
```bash
# 方式1: 使用Git（推荐）
git clone <your-repository-url> .

# 方式2: 使用SCP上传
# 在本地执行：
scp -r ./lt/* user@your-server:/var/www/liuyao/

# 方式3: 使用FTP工具（如FileZilla）上传
```

#### 2.3 安装依赖
```bash
# 根目录依赖
npm install

# 服务端依赖
cd server
npm install
cd ..

# 客户端依赖
cd client
npm install
cd ..
```

---

### 3. 数据库配置

#### 3.1 创建数据库
```bash
# 登录MySQL
sudo mysql -u root -p

# 创建数据库和用户
CREATE DATABASE liuyao_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'liuyao_user'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON liuyao_db.* TO 'liuyao_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### 3.2 导入数据库结构
```bash
cd /var/www/liuyao/server

# 导入基础结构
mysql -u liuyao_user -p liuyao_db < sql/init_database.sql

# 导入基础数据
mysql -u liuyao_user -p liuyao_db < sql/insert_data.sql

# 导入认证表
mysql -u liuyao_user -p liuyao_db < sql/auth_tables.sql

# 导入初始用户（可选）
mysql -u liuyao_user -p liuyao_db < sql/auth_init_data.sql
```

#### 3.3 修复用户密码
```bash
# 如果需要，运行密码修复脚本
cd /var/www/liuyao/server
node fix-passwords.js
```

---

### 4. 环境配置

#### 4.1 配置服务端环境变量
```bash
cd /var/www/liuyao/server
cp .env.example .env
nano .env
```

编辑 `.env` 文件：
```env
# Server Configuration
PORT=5000
NODE_ENV=production

# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=liuyao_user
DB_PASSWORD=your_strong_password
DB_NAME=liuyao_db

# JWT Configuration
JWT_SECRET=your_random_jwt_secret_key_here_change_this
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# DeepSeek API Configuration
DEEPSEEK_API_KEY=sk-your-actual-key-here
DEEPSEEK_API_URL=https://api.deepseek.com
```

**重要安全提示：**
- `JWT_SECRET` 必须使用强随机字符串
- 生成方法：`openssl rand -base64 32`
- 不要使用默认值！

---

### 5. 构建项目

#### 5.1 构建前端
```bash
cd /var/www/liuyao/client
npm run build
```

构建完成后，生成的静态文件在 `client/dist` 目录。

#### 5.2 构建后端
```bash
cd /var/www/liuyao/server
npm run build
```

---

### 6. 配置Nginx反向代理

#### 6.1 创建Nginx配置文件
```bash
sudo nano /etc/nginx/sites-available/liuyao
```

写入以下配置：
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # 日志配置
    access_log /var/log/nginx/liuyao-access.log;
    error_log /var/log/nginx/liuyao-error.log;

    # 静态文件（前端）
    location / {
        root /var/www/liuyao/client/dist;
        try_files $uri $uri/ /index.html;

        # 缓存静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API代理（后端）
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 超时设置（AI解卦可能需要较长时间）
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript
               application/x-javascript application/xml+rss
               application/json application/javascript;
}
```

#### 6.2 启用配置
```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/liuyao /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
```

---

### 7. 使用PM2管理Node.js进程

#### 7.1 创建PM2配置文件
在项目根目录创建 `ecosystem.config.js`：
```bash
cd /var/www/liuyao
nano ecosystem.config.js
```

写入以下内容：
```javascript
module.exports = {
  apps: [{
    name: 'liuyao-server',
    cwd: '/var/www/liuyao/server',
    script: 'dist/index.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/www/liuyao/logs/server-error.log',
    out_file: '/var/www/liuyao/logs/server-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    min_uptime: '10s',
    max_restarts: 10
  }]
};
```

#### 7.2 创建日志目录
```bash
mkdir -p /var/www/liuyao/logs
```

#### 7.3 启动应用
```bash
cd /var/www/liuyao
pm2 start ecosystem.config.js

# 查看进程状态
pm2 status

# 查看日志
pm2 logs liuyao-server

# 设置开机自启
pm2 startup
pm2 save
```

---

### 8. 防火墙配置

```bash
# Ubuntu/Debian (UFW)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# CentOS (firewalld)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

---

## 方式二：Docker部署

### 1. 创建Dockerfile

#### 后端Dockerfile
创建 `server/Dockerfile`：
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["node", "dist/index.js"]
```

#### 前端Dockerfile
创建 `client/Dockerfile`：
```dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 2. 创建docker-compose.yml
在项目根目录创建：
```yaml
version: '3.8'

services:
  mysql:
    image: mysql:5.7
    container_name: liuyao-mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: liuyao_db
      MYSQL_USER: liuyao_user
      MYSQL_PASSWORD: liuyao_pass
    volumes:
      - mysql-data:/var/lib/mysql
      - ./server/sql:/docker-entrypoint-initdb.d
    ports:
      - "3306:3306"
    networks:
      - liuyao-network

  server:
    build: ./server
    container_name: liuyao-server
    restart: always
    environment:
      NODE_ENV: production
      PORT: 5000
      DB_HOST: mysql
      DB_PORT: 3306
      DB_USER: liuyao_user
      DB_PASSWORD: liuyao_pass
      DB_NAME: liuyao_db
      JWT_SECRET: your_jwt_secret_here
      DEEPSEEK_API_KEY: your_api_key_here
    depends_on:
      - mysql
    ports:
      - "5000:5000"
    networks:
      - liuyao-network

  client:
    build: ./client
    container_name: liuyao-client
    restart: always
    ports:
      - "80:80"
    depends_on:
      - server
    networks:
      - liuyao-network

volumes:
  mysql-data:

networks:
  liuyao-network:
    driver: bridge
```

### 3. 部署命令
```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止
docker-compose down

# 重启
docker-compose restart
```

---

## 方式三：宝塔面板部署

### 1. 安装宝塔面板
```bash
# Ubuntu/Debian
wget -O install.sh http://download.bt.cn/install/install-ubuntu_6.0.sh && sudo bash install.sh

# CentOS
yum install -y wget && wget -O install.sh http://download.bt.cn/install/install_6.0.sh && sh install.sh
```

### 2. 通过宝塔面板配置

1. **安装软件**
   - 在面板中安装：Nginx、MySQL 5.7、PM2管理器

2. **创建网站**
   - 添加站点，域名填写你的域名
   - 根目录设置为 `/var/www/liuyao/client/dist`

3. **配置反向代理**
   - 网站设置 → 反向代理 → 添加反向代理
   - 目标URL: `http://127.0.0.1:5000`
   - 发送域名: `$host`
   - 代理目录: `/api`

4. **配置PM2**
   - PM2管理器 → 添加项目
   - 项目路径: `/var/www/liuyao/server`
   - 启动文件: `dist/index.js`
   - 项目名称: `liuyao-server`

---

## SSL证书配置

### 方式1：使用Let's Encrypt（免费）
```bash
# 安装certbot
sudo apt install certbot python3-certbot-nginx

# 自动配置SSL
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 测试自动续期
sudo certbot renew --dry-run
```

### 方式2：宝塔面板一键SSL
1. 网站设置 → SSL → Let's Encrypt
2. 勾选域名
3. 点击申请
4. 开启强制HTTPS

---

## 性能优化

### 1. 数据库优化
```sql
-- MySQL配置优化 (/etc/mysql/mysql.conf.d/mysqld.cnf)
[mysqld]
innodb_buffer_pool_size = 256M
innodb_log_file_size = 64M
max_connections = 200
query_cache_size = 32M
```

### 2. Node.js优化
```javascript
// server/src/index.ts
// 启用集群模式
const cluster = require('cluster');
const os = require('os');

if (cluster.isMaster) {
  const cpus = os.cpus().length;
  for (let i = 0; i < cpus; i++) {
    cluster.fork();
  }
} else {
  // 启动服务器
  startServer();
}
```

### 3. Nginx优化
```nginx
# worker进程数
worker_processes auto;

# 连接数
events {
    worker_connections 2048;
}

# 开启文件缓存
open_file_cache max=1000 inactive=20s;
```

---

## 监控和维护

### 1. PM2监控
```bash
# 实时监控
pm2 monit

# Web监控界面
pm2 web
```

### 2. 日志查看
```bash
# 应用日志
pm2 logs liuyao-server

# Nginx访问日志
sudo tail -f /var/log/nginx/liuyao-access.log

# Nginx错误日志
sudo tail -f /var/log/nginx/liuyao-error.log

# MySQL错误日志
sudo tail -f /var/log/mysql/error.log
```

### 3. 定期备份
```bash
# 创建备份脚本
sudo nano /root/backup-liuyao.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/liuyao"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
mysqldump -u liuyao_user -p'your_password' liuyao_db > $BACKUP_DIR/db_$DATE.sql

# 备份代码
tar -czf $BACKUP_DIR/code_$DATE.tar.gz /var/www/liuyao

# 删除7天前的备份
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

设置定时任务：
```bash
# 编辑crontab
sudo crontab -e

# 每天凌晨2点备份
0 2 * * * /root/backup-liuyao.sh
```

### 4. 更新部署
```bash
# 拉取最新代码
cd /var/www/liuyao
git pull

# 安装依赖
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..

# 构建前端
cd client && npm run build && cd ..

# 构建后端
cd server && npm run build && cd ..

# 重启应用
pm2 restart liuyao-server
```

---

## 常见问题

### 1. 端口占用
```bash
# 查看端口占用
sudo lsof -i :5000

# 杀死进程
sudo kill -9 <PID>
```

### 2. 权限问题
```bash
# 修改文件所有者
sudo chown -R $USER:$USER /var/www/liuyao

# 修改文件权限
chmod -R 755 /var/www/liuyao
```

### 3. 内存不足
```bash
# 创建swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## 安全检查清单

- [ ] 修改MySQL root密码
- [ ] 创建独立的数据库用户
- [ ] 修改JWT_SECRET为强随机值
- [ ] 配置防火墙规则
- [ ] 启用HTTPS（SSL证书）
- [ ] 定期更新系统和依赖
- [ ] 配置自动备份
- [ ] 限制SSH登录（禁用root登录，使用密钥认证）
- [ ] 安装fail2ban防止暴力破解
- [ ] 配置日志监控

---

## 联系支持

如有部署问题，请检查：
1. 服务器日志：`pm2 logs`
2. Nginx日志：`/var/log/nginx/`
3. MySQL日志：`/var/log/mysql/`

祝部署顺利！🚀
