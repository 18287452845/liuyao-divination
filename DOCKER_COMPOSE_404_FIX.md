# Docker Compose 404错误修复

## 问题描述

使用 `docker-compose up` 部署后，访问项目返回 404 错误。

## 根本原因分析

有三个主要问题导致了 404 错误：

### 1. **前端静态文件路径不匹配**
- **问题**：`nginx.conf` 中配置的根路径是 `/var/www/liuyao/client/dist`
- **实际**：client Dockerfile 将前端构建产物放在 `/usr/share/nginx/html`
- **结果**：nginx 找不到静态文件，返回 404

### 2. **后端 API 代理地址错误**
- **问题**：`nginx.conf` 中使用 `proxy_pass http://localhost:5000` 代理后端
- **实际**：Docker Compose 使用独立的容器网络，容器内无法访问 `localhost:5000`
- **正确方式**：应使用服务名 `http://server:5000`（服务名由 docker-compose.yml 定义）

### 3. **server_name 配置不合适**
- **问题**：`server_name your-domain.com www.your-domain.com` 指定了具体域名
- **实际**：Docker 部署时通常通过 IP 或 localhost 访问，不是具体域名
- **解决**：改为 `server_name _` 接受所有主机名

## 修复方案

### 修改的文件：`nginx.conf`

#### 修改内容：

1. **改变 server_name 为通配符**
   ```nginx
   server_name _;  # 接受所有请求
   ```

2. **修改前端根路径**
   ```nginx
   # 旧配置
   location / {
       root /var/www/liuyao/client/dist;
   }

   # 新配置
   root /usr/share/nginx/html;
   
   location / {
       try_files $uri $uri/ /index.html;
   }
   ```

3. **修改后端 API 代理地址**
   ```nginx
   # 旧配置
   location /api {
       proxy_pass http://localhost:5000;
   }

   # 新配置
   location /api {
       proxy_pass http://server:5000;  # 使用 Docker Compose 中定义的服务名
   }
   ```

## 重新部署步骤

1. **停止现有容器**
   ```bash
   docker-compose down
   ```

2. **重新构建并启动（推荐）**
   ```bash
   docker-compose build --no-cache
   docker-compose up -d
   ```

   或者直接启动（使用缓存，更快）
   ```bash
   docker-compose up -d
   ```

3. **验证部署**
   - 访问 `http://localhost` 应该看到页面
   - 访问 `http://localhost/api/health` 应该返回健康状态
   - API 请求应该能正常代理到后端

## 相关配置文件

### docker-compose.yml
- nginx 服务在第 86 行挂载 `./nginx.conf:/etc/nginx/conf.d/default.conf:ro`
- 后端服务名为 `server`（第 28 行）
- 前端静态文件在 `/usr/share/nginx/html`（由 client Dockerfile 定义）

### client/Dockerfile
- 第 33 行：`COPY --from=build /app/dist /usr/share/nginx/html`
- 第 36-37 行：设置文件权限

### server/Dockerfile
- 后端服务在容器内监听端口 5000
- 服务名 `server` 在 Docker 网络中可以解析

## Docker Compose 网络说明

docker-compose.yml 定义了 `liuyao-network` 网络（第 94-96 行）：
- 所有容器都连接到这个网络
- 容器可以通过服务名（如 `server`、`mysql`）进行服务发现
- 无法使用 `localhost` 或 `127.0.0.1` 来访问其他容器

## 其他相关配置

### 使用 GHCR 镜像的用户
如果使用 `docker-compose.ghcr.yml`，请确保在该文件中也有相同的修改。
修改后的 `nginx.conf` 会被所有 docker-compose 配置自动使用。

### HTTPS/SSL 部署
如果需要使用 HTTPS，参考 `nginx-ssl.conf`，该文件已包含正确的配置：
- 路径：`/usr/share/nginx/html`
- API 代理：`http://server:5000`

## 常见问题排查

### 仍然返回 404
1. 确认前端构建成功：检查容器日志 `docker-compose logs client`
2. 确认文件在容器中：`docker exec liuyao-client ls -la /usr/share/nginx/html`
3. 检查 nginx 配置：`docker exec liuyao-client nginx -t`

### API 请求失败
1. 检查后端服务是否运行：`docker-compose ps`
2. 检查后端日志：`docker-compose logs server`
3. 确认网络连通性：`docker exec liuyao-client curl http://server:5000/api/health`

### 部署后仍有问题
1. 清理所有容器和卷：`docker-compose down -v`
2. 重新构建：`docker-compose build --no-cache`
3. 重新启动：`docker-compose up -d`

## 总结

这个修复确保了：
- ✅ nginx 能找到前端静态文件
- ✅ nginx 能正确代理 API 请求到后端服务
- ✅ Docker Compose 网络中的容器能通过服务名互相通信
- ✅ 支持通过 IP 或任何域名访问应用
