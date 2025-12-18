# Docker部署指南 - 六爻排盘系统

本指南提供完整的Docker容器化部署方案，适用于生产环境和开发环境。

## 目录

- [前置要求](#前置要求)
- [快速开始](#快速开始)
- [详细配置](#详细配置)
- [部署步骤](#部署步骤)
- [管理和维护](#管理和维护)
- [故障排查](#故障排查)
- [安全建议](#安全建议)

---

## 前置要求

### 系统要求

- **操作系统**: Linux (Ubuntu 20.04+, CentOS 7+, Debian 10+), macOS, Windows 10/11 (WSL2)
- **CPU**: 2核心以上 (推荐4核)
- **内存**: 4GB以上 (推荐8GB)
- **磁盘**: 20GB可用空间
- **网络**: 稳定的互联网连接

### 软件依赖

#### 1. 安装Docker

**Ubuntu/Debian:**
```bash
# 更新软件包索引
sudo apt update

# 安装Docker
curl -fsSL https://get.docker.com | sudo sh

# 启动Docker服务
sudo systemctl start docker
sudo systemctl enable docker

# 验证安装
docker --version
```

**CentOS:**
```bash
# 安装Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io

# 启动Docker
sudo systemctl start docker
sudo systemctl enable docker

# 验证安装
docker --version
```

**Windows/macOS:**
- 下载并安装 [Docker Desktop](https://www.docker.com/products/docker-desktop)

#### 2. 安装Docker Compose

Docker Compose V2已集成在Docker Desktop中。对于Linux系统：

```bash
# 下载Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 添加执行权限
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker-compose --version
```

#### 3. 配置Docker用户组（可选但推荐）

```bash
# 创建docker用户组
sudo groupadd docker

# 将当前用户添加到docker组
sudo usermod -aG docker $USER

# 注销并重新登录，或运行：
newgrp docker

# 测试（无需sudo）
docker run hello-world
```

---

## 快速开始

### 1分钟快速部署

```bash
# 1. 克隆项目
git clone <your-repository-url>
cd liuyao-divination

# 2. 配置环境变量
cp .env.example .env
nano .env  # 修改必要的配置

# 3. 一键启动
docker-compose up -d

# 4. 查看状态
docker-compose ps

# 5. 访问应用
# 前端: http://localhost
# 后端API: http://localhost:5000
```

---

## 详细配置

### 环境变量配置

编辑 `.env` 文件：

```env
# MySQL数据库配置
MYSQL_ROOT_PASSWORD=your_strong_root_password_here
MYSQL_DATABASE=liuyao_db
MYSQL_USER=liuyao_user
MYSQL_PASSWORD=your_strong_password_here

# JWT配置（必须修改！）
JWT_SECRET=your_random_jwt_secret_key_change_in_production

# DeepSeek API配置（必须配置）
DEEPSEEK_API_KEY=sk-your-actual-deepseek-api-key-here
```

**重要提示：**

1. **JWT_SECRET**: 必须使用强随机字符串
   ```bash
   # 生成强随机密钥
   openssl rand -base64 32
   ```

2. **MYSQL密码**: 使用复杂密码，避免使用默认值

3. **DEEPSEEK_API_KEY**: 
   - 前往 [DeepSeek开放平台](https://platform.deepseek.com) 注册并获取API密钥
   - 确保账户有足够余额用于AI解卦功能

### docker-compose.yml详解

项目已包含完整的 `docker-compose.yml` 配置文件，包含三个服务：

1. **mysql**: MySQL 5.7数据库
2. **server**: Node.js后端服务
3. **client**: Nginx前端服务

主要配置项：

```yaml
services:
  mysql:
    image: mysql:5.7
    # 自动初始化数据库脚本: server/sql/*.sql
    volumes:
      - mysql-data:/var/lib/mysql  # 持久化数据
      - ./server/sql:/docker-entrypoint-initdb.d:ro  # 初始化脚本

  server:
    build: ./server
    environment:
      DB_HOST: mysql  # 使用服务名作为主机名
    depends_on:
      mysql:
        condition: service_healthy  # 等待MySQL就绪

  client:
    build: ./client
    ports:
      - "80:80"  # HTTP
      - "443:443"  # HTTPS（如果配置了SSL）
```

---

## 部署步骤

### 开发环境部署

```bash
# 1. 准备项目
git clone <repository-url>
cd liuyao-divination

# 2. 配置环境变量
cp .env.example .env
# 编辑.env，至少修改以下项：
# - DEEPSEEK_API_KEY (必须)
# - JWT_SECRET (推荐修改)
# - MySQL密码 (推荐修改)

# 3. 启动所有服务
docker-compose up -d

# 4. 查看日志确认启动成功
docker-compose logs -f

# 等待看到以下提示：
# liuyao-mysql   | ready for connections
# liuyao-server  | 服务器运行在端口 5000
# liuyao-client  | start worker processes

# 5. 初始化数据库（如果需要）
# 数据库会自动初始化，如果失败可手动执行：
docker-compose exec mysql mysql -u liuyao_user -p liuyao_db < server/sql/init_database.sql

# 6. 访问应用
# 打开浏览器访问: http://localhost
```

### 生产环境部署

#### 1. 服务器准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Docker和Docker Compose（参考前置要求）

# 配置防火墙
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

#### 2. 上传项目文件

```bash
# 创建项目目录
sudo mkdir -p /opt/liuyao
sudo chown $USER:$USER /opt/liuyao

# 方式1: 使用Git（推荐）
cd /opt/liuyao
git clone <repository-url> .

# 方式2: 使用SCP上传
# 在本地执行：
scp -r ./liuyao-divination/* user@server:/opt/liuyao/
```

#### 3. 配置生产环境变量

```bash
cd /opt/liuyao
cp .env.example .env
nano .env
```

**生产环境必须修改：**
```env
# 使用强随机密码
MYSQL_ROOT_PASSWORD=$(openssl rand -base64 32)
MYSQL_PASSWORD=$(openssl rand -base64 20)

# 使用强随机JWT密钥
JWT_SECRET=$(openssl rand -base64 32)

# 配置真实的DeepSeek API密钥
DEEPSEEK_API_KEY=sk-your-real-key
```

#### 4. 启动生产服务

```bash
# 构建并启动
docker-compose up -d --build

# 查看服务状态
docker-compose ps

# 确认所有服务都是 "Up" 状态
```

#### 5. 配置HTTPS（强烈推荐）

**方式一：使用Let's Encrypt（免费证书）**

```bash
# 1. 安装Certbot
sudo apt install certbot

# 2. 获取证书
sudo certbot certonly --standalone -d your-domain.com

# 证书位置：
# /etc/letsencrypt/live/your-domain.com/fullchain.pem
# /etc/letsencrypt/live/your-domain.com/privkey.pem

# 3. 修改docker-compose.yml，添加SSL证书挂载
# 在client服务的volumes下添加：
# - /etc/letsencrypt:/etc/letsencrypt:ro

# 4. 更新nginx.conf（参考项目中的nginx-ssl.conf示例）

# 5. 重启服务
docker-compose restart client
```

**配置自动续期：**
```bash
# 添加cron任务
sudo crontab -e

# 添加以下行（每周检查一次）
0 3 * * 1 certbot renew --quiet && docker-compose restart client
```

#### 6. 设置开机自启

```bash
# 创建systemd服务
sudo nano /etc/systemd/system/liuyao.service
```

写入以下内容：
```ini
[Unit]
Description=Liuyao Divination System
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/liuyao
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

启用服务：
```bash
sudo systemctl enable liuyao.service
sudo systemctl start liuyao.service
sudo systemctl status liuyao.service
```

---

## 管理和维护

### 日常管理命令

```bash
# 查看服务状态
docker-compose ps

# 查看实时日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f server
docker-compose logs -f mysql
docker-compose logs -f client

# 重启服务
docker-compose restart

# 重启特定服务
docker-compose restart server

# 停止所有服务
docker-compose stop

# 停止并删除容器（保留数据）
docker-compose down

# 停止并删除所有内容（包括数据卷）
docker-compose down -v
```

### 更新应用

```bash
# 1. 拉取最新代码
cd /opt/liuyao
git pull origin main

# 2. 重新构建并启动
docker-compose up -d --build

# 3. 查看日志确认更新成功
docker-compose logs -f
```

### 数据备份

#### 备份数据库

```bash
# 方式1: 导出SQL文件
docker-compose exec mysql mysqldump -u liuyao_user -p liuyao_db > backup_$(date +%Y%m%d).sql

# 方式2: 备份数据卷
docker run --rm -v liuyao_mysql-data:/data -v $(pwd):/backup alpine tar czf /backup/mysql_backup_$(date +%Y%m%d).tar.gz /data
```

#### 恢复数据库

```bash
# 从SQL文件恢复
docker-compose exec -T mysql mysql -u liuyao_user -p liuyao_db < backup_20240101.sql

# 从数据卷备份恢复
docker run --rm -v liuyao_mysql-data:/data -v $(pwd):/backup alpine tar xzf /backup/mysql_backup_20240101.tar.gz
```

#### 自动备份脚本

创建 `/opt/liuyao/backup.sh`：
```bash
#!/bin/bash
BACKUP_DIR="/opt/liuyao/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 备份数据库
docker-compose exec -T mysql mysqldump -u liuyao_user -p${MYSQL_PASSWORD} liuyao_db > $BACKUP_DIR/db_$DATE.sql

# 压缩
gzip $BACKUP_DIR/db_$DATE.sql

# 删除30天前的备份
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +30 -delete

echo "备份完成: db_$DATE.sql.gz"
```

设置定时备份：
```bash
chmod +x /opt/liuyao/backup.sh

# 每天凌晨3点备份
crontab -e
0 3 * * * /opt/liuyao/backup.sh >> /opt/liuyao/backups/backup.log 2>&1
```

### 监控

#### 查看资源使用

```bash
# 查看容器资源占用
docker stats

# 查看磁盘使用
docker system df

# 查看具体容器的资源使用
docker stats liuyao-server liuyao-mysql liuyao-client
```

#### 健康检查

```bash
# 检查服务健康状态
docker-compose ps

# 检查后端API
curl http://localhost:5000/api/health

# 检查前端
curl http://localhost/

# 查看容器详细信息
docker inspect liuyao-server
docker inspect liuyao-mysql
```

### 日志管理

```bash
# 查看日志大小
docker-compose exec server du -sh /app/logs/*

# 清理旧日志（在server容器内）
docker-compose exec server find /app/logs -name "*.log" -mtime +7 -delete

# 配置日志轮转（在宿主机）
sudo nano /etc/logrotate.d/docker-liuyao
```

添加以下内容：
```
/opt/liuyao/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
}
```

---

## 故障排查

### 常见问题

#### 1. 容器启动失败

```bash
# 查看详细错误信息
docker-compose logs

# 检查特定容器
docker-compose logs mysql
docker-compose logs server

# 查看容器状态
docker-compose ps
```

**常见原因：**
- 端口冲突：检查80、443、3306、5000端口是否被占用
- 环境变量未配置：确认.env文件存在且正确配置
- 权限问题：确保当前用户有Docker权限

#### 2. MySQL连接失败

```bash
# 检查MySQL是否就绪
docker-compose exec mysql mysqladmin ping -h localhost

# 测试数据库连接
docker-compose exec mysql mysql -u liuyao_user -p liuyao_db

# 查看MySQL日志
docker-compose logs mysql

# 重启MySQL
docker-compose restart mysql
```

**解决方案：**
- 等待MySQL完全启动（可能需要30秒到1分钟）
- 检查数据库凭据是否正确
- 确认数据卷没有损坏

#### 3. 前端无法访问后端

```bash
# 检查后端是否运行
curl http://localhost:5000/api/health

# 检查Nginx配置
docker-compose exec client nginx -t

# 查看Nginx日志
docker-compose logs client

# 重启前端服务
docker-compose restart client
```

#### 4. 数据库初始化失败

```bash
# 手动执行初始化脚本
docker-compose exec mysql mysql -u root -p

# 在MySQL中执行：
CREATE DATABASE IF NOT EXISTS liuyao_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON liuyao_db.* TO 'liuyao_user'@'%';
FLUSH PRIVILEGES;
EXIT;

# 导入SQL文件
docker-compose exec -T mysql mysql -u liuyao_user -p liuyao_db < server/sql/init_database.sql
docker-compose exec -T mysql mysql -u liuyao_user -p liuyao_db < server/sql/insert_data.sql
docker-compose exec -T mysql mysql -u liuyao_user -p liuyao_db < server/sql/auth_tables.sql
docker-compose exec -T mysql mysql -u liuyao_user -p liuyao_db < server/sql/auth_init_data.sql
docker-compose exec -T mysql mysql -u liuyao_user -p liuyao_db < server/sql/02_auth_permissions_migration.sql
```

#### 5. 磁盘空间不足

```bash
# 查看Docker磁盘使用
docker system df

# 清理未使用的镜像
docker image prune -a

# 清理未使用的容器
docker container prune

# 清理未使用的网络
docker network prune

# 清理所有未使用资源
docker system prune -a --volumes

# 保留当前项目的完整清理
docker system prune -a
# 注意：不要使用 --volumes，否则会删除数据库数据！
```

#### 6. 容器内时区不正确

```bash
# 修改docker-compose.yml，在server服务添加：
environment:
  - TZ=Asia/Shanghai

volumes:
  - /etc/localtime:/etc/localtime:ro

# 重启服务
docker-compose up -d
```

### 调试技巧

#### 进入容器调试

```bash
# 进入后端容器
docker-compose exec server sh

# 进入MySQL容器
docker-compose exec mysql bash

# 进入前端容器
docker-compose exec client sh
```

#### 查看容器配置

```bash
# 查看环境变量
docker-compose exec server env

# 查看网络配置
docker network inspect liuyao_liuyao-network

# 查看数据卷
docker volume ls
docker volume inspect liuyao_mysql-data
```

#### 重建容器

```bash
# 完全重建（不删除数据）
docker-compose down
docker-compose up -d --build

# 强制重建特定服务
docker-compose up -d --force-recreate --build server
```

---

## 安全建议

### 1. 环境变量安全

```bash
# 设置.env文件权限
chmod 600 .env

# 确保.env在.gitignore中
echo ".env" >> .gitignore
```

### 2. 数据库安全

```env
# 使用强密码
MYSQL_ROOT_PASSWORD=$(openssl rand -base64 32)
MYSQL_PASSWORD=$(openssl rand -base64 20)
```

```bash
# 限制MySQL仅容器内访问（生产环境）
# 在docker-compose.yml中删除MySQL的ports映射
```

### 3. 网络安全

```bash
# 配置防火墙
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### 4. 定期更新

```bash
# 更新基础镜像
docker-compose pull
docker-compose up -d --build

# 更新系统
sudo apt update && sudo apt upgrade -y
```

### 5. 访问控制

- 修改默认管理员密码
- 限制管理后台访问IP
- 配置Nginx访问限制

### 6. 日志安全

```bash
# 避免在日志中输出敏感信息
# 定期清理日志
find /opt/liuyao/logs -name "*.log" -mtime +30 -delete
```

---

## 性能优化

### 1. Docker配置优化

编辑 `/etc/docker/daemon.json`：
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
```

重启Docker：
```bash
sudo systemctl restart docker
```

### 2. MySQL优化

在docker-compose.yml中添加MySQL配置：
```yaml
mysql:
  command: --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci --max_connections=200 --innodb_buffer_pool_size=256M
```

### 3. Nginx优化

更新 `nginx.conf`：
```nginx
# 启用gzip压缩
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

# 缓存静态资源
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 4. Node.js服务优化

在docker-compose.yml中配置：
```yaml
server:
  environment:
    NODE_ENV: production
    NODE_OPTIONS: --max-old-space-size=512
```

---

## 默认账号信息

部署完成后，可使用以下默认账号登录：

- **管理员账号**: 
  - 用户名: `admin`
  - 密码: `admin123`

- **普通用户账号**:
  - 用户名: `testuser`
  - 密码: `test123`

- **注册邀请码**: `1663929970`

**⚠️ 重要安全提示：**
生产环境部署后，请立即：
1. 修改所有默认密码
2. 删除或禁用测试账号
3. 更换默认邀请码

---

## 扩展配置

### 多实例部署

修改 `docker-compose.yml` 启用多实例：
```yaml
server:
  deploy:
    replicas: 3
  
  # 使用负载均衡
  # ...
```

### 使用外部MySQL

```yaml
# 注释掉mysql服务，修改server环境变量
server:
  environment:
    DB_HOST: external-mysql-host
    DB_PORT: 3306
    DB_USER: your_user
    DB_PASSWORD: your_password
```

### 配置Redis缓存

```yaml
services:
  redis:
    image: redis:alpine
    container_name: liuyao-redis
    restart: always
    ports:
      - "6379:6379"
    networks:
      - liuyao-network
```

---

## 常见问题 FAQ

**Q: Docker容器占用太多磁盘空间？**
A: 定期清理：`docker system prune -a`（注意：不要加 `--volumes`）

**Q: 如何修改默认端口？**
A: 编辑 `docker-compose.yml` 中的 `ports` 映射，如 `8080:80`

**Q: 如何备份和迁移？**
A: 备份 `.env` 文件和 MySQL 数据卷即可

**Q: 容器启动后立即退出？**
A: 查看日志 `docker-compose logs`，通常是配置错误或依赖服务未就绪

**Q: 如何查看容器内的文件？**
A: `docker-compose exec server ls -la /app`

---

## 技术支持

- **项目文档**: 查看 `doc/` 目录下的其他文档
- **问题反馈**: GitHub Issues
- **更新日志**: CHANGELOG.md

---

## 附录

### 完整的生产环境部署检查清单

- [ ] Docker和Docker Compose已安装
- [ ] .env文件已配置且权限正确(600)
- [ ] 所有密码已修改为强密码
- [ ] JWT_SECRET已更新
- [ ] DEEPSEEK_API_KEY已配置
- [ ] 防火墙已配置
- [ ] HTTPS证书已配置（生产环境）
- [ ] 自动备份脚本已设置
- [ ] 开机自启已配置
- [ ] 默认账号密码已修改
- [ ] 日志轮转已配置
- [ ] 监控已设置
- [ ] 测试所有功能正常

### 推荐的监控工具

- **Portainer**: Docker可视化管理
  ```bash
  docker volume create portainer_data
  docker run -d -p 9000:9000 -p 8000:8000 \
    --name portainer --restart=always \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v portainer_data:/data \
    portainer/portainer-ce
  ```

- **cAdvisor**: 容器性能监控
  ```bash
  docker run -d --name=cadvisor \
    --volume=/:/rootfs:ro \
    --volume=/var/run:/var/run:ro \
    --volume=/sys:/sys:ro \
    --volume=/var/lib/docker/:/var/lib/docker:ro \
    --publish=8080:8080 \
    google/cadvisor:latest
  ```

---

**部署成功！** 🎉

访问 `http://your-domain-or-ip` 开始使用六爻排盘系统！
