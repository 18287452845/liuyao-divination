# Dockerfile 修复说明

## 问题描述

前端构建时遇到以下错误：

```
ERROR: failed to build: failed to solve: process "/bin/sh -c addgroup -g 1001 -S nginx && adduser -S nginx -u 1001 -G nginx" did not complete successfully: exit code: 1
```

同时有一个警告：
```
FromAsCasing: 'as' and 'FROM' keywords' casing do not match (line 2)
```

## 根本原因

1. **主要错误**：尝试创建已存在的 nginx 用户
   - `nginx:1.25-alpine` 基础镜像已经包含了 nginx 用户和组
   - 再次创建导致冲突，返回 exit code 1

2. **警告**：Docker 最佳实践要求关键字大小写一致
   - 第 2 行使用小写 `as`
   - 应该使用大写 `AS` 与 `FROM` 保持一致

## 修复内容

### 1. 修复 FROM 大小写问题
```dockerfile
# 修复前
FROM node:18-alpine as build

# 修复后
FROM node:18-alpine AS build
```

### 2. 删除重复的用户创建代码
```dockerfile
# 删除了以下代码（第 41-42 行）
# RUN addgroup -g 1001 -S nginx && \
#     adduser -S nginx -u 1001 -G nginx
```

### 3. 删除 USER nginx 指令
nginx 需要以 root 身份启动才能绑定 80 端口，然后会自动降权到 nginx 用户运行 worker 进程。这是 nginx 官方推荐的方式。

### 4. 简化构建依赖安装
使用 `build-base` 包来简化安装，它包含了 make 和 g++：
```dockerfile
# 简化后
RUN apk add --no-cache python3 build-base git
```

### 5. 删除不必要的 curl 安装
nginx:alpine 镜像已经包含了 curl，无需额外安装。

## 修复后的 Dockerfile 结构

```dockerfile
# 构建阶段
FROM node:18-alpine AS build
WORKDIR /app
RUN apk add --no-cache python3 build-base git
# ... npm 构建步骤 ...

# 生产阶段
FROM nginx:1.25-alpine
# 无需创建用户，直接复制文件
COPY --from=build /app/dist /usr/share/nginx/html
# 设置权限
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html
# ... nginx 配置 ...
CMD ["nginx", "-g", "daemon off;"]
```

## 验证

修复后的 Dockerfile 应该能够：
1. ✅ 成功构建，不再出现 adduser 错误
2. ✅ 没有大小写警告
3. ✅ nginx 正常启动并监听 80 端口
4. ✅ 健康检查通过

## 关键点总结

- **不要**在 nginx 官方镜像中重新创建 nginx 用户
- **不要**在 Dockerfile 中使用 `USER nginx` 运行 nginx（需要 root 权限绑定端口）
- **使用**一致的大小写（所有 Dockerfile 关键字应该大写）
- **使用** `build-base` 简化构建工具安装
- nginx 镜像已包含常用工具（如 curl），无需重复安装
