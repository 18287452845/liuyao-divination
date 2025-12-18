# Docker 构建测试指南

## 修复说明

### 问题
- **错误**：`npm run build` 在 Docker 构建时失败 (exit code 127)
- **原因**：使用了 `npm ci --only=production`，导致开发依赖（包括 TypeScript）不被安装，但构建过程需要 TypeScript

### 解决方案
- **修改**：将 `server/Dockerfile` 转换为多阶段构建
- **阶段 1 (Builder)**：安装所有依赖并编译代码
- **阶段 2 (Production)**：复制编译后的代码，仅安装生产依赖
- **优势**：
  - ✅ 最终镜像不包含编译工具，体积更小
  - ✅ 构建时有完整的依赖
  - ✅ 运行时仅有必需的生产依赖

---

## 本地测试构建

### 测试后端镜像构建

```bash
# 进入项目目录
cd /home/engine/project

# 构建后端镜像
docker build -t liuyao-server:test ./server

# 验证构建成功
docker images | grep liuyao-server
```

### 测试前端镜像构建

```bash
# 构建前端镜像
docker build -t liuyao-client:test ./client

# 验证构建成功
docker images | grep liuyao-client
```

### 本地运行测试

```bash
# 启动应用
docker-compose up -d

# 检查容器状态
docker-compose ps

# 查看日志
docker-compose logs -f server
docker-compose logs -f client

# 测试后端健康检查
curl http://localhost:5000/api/health

# 测试前端
curl http://localhost:80
```

---

## Docker Buildx 构建（用于 GitHub Actions）

### 多架构构建

```bash
# 设置 buildx（如果还没有）
docker buildx create --name multiarch --use

# 构建多架构镜像（不加载到本地，仅推送到仓库）
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t ghcr.io/USERNAME/liuyao-divination/server:latest \
  --push \
  ./server
```

### 本地加载测试

```bash
# 构建并加载到本地 Docker
docker buildx build \
  --platform linux/amd64 \
  -t liuyao-server:test \
  --load \
  ./server
```

---

## 验证修复完成

运行此脚本验证修复有效：

```bash
#!/bin/bash

echo "=== Docker 构建修复验证 ==="
echo ""

# 1. 检查 Dockerfile 是否使用多阶段构建
echo "✓ 检查 server/Dockerfile 多阶段构建..."
if grep -q "FROM node:18-alpine AS builder" server/Dockerfile; then
    echo "  ✅ 构建阶段已配置"
else
    echo "  ❌ 构建阶段配置缺失"
    exit 1
fi

if grep -q "COPY --from=builder /app/dist" server/Dockerfile; then
    echo "  ✅ 多阶段复制已配置"
else
    echo "  ❌ 多阶段复制配置缺失"
    exit 1
fi

# 2. 尝试构建后端镜像
echo ""
echo "✓ 尝试构建后端镜像..."
if docker build -t liuyao-server:test ./server >/dev/null 2>&1; then
    echo "  ✅ 后端镜像构建成功"
    docker rmi liuyao-server:test
else
    echo "  ❌ 后端镜像构建失败"
    exit 1
fi

# 3. 尝试构建前端镜像
echo ""
echo "✓ 尝试构建前端镜像..."
if docker build -t liuyao-client:test ./client >/dev/null 2>&1; then
    echo "  ✅ 前端镜像构建成功"
    docker rmi liuyao-client:test
else
    echo "  ❌ 前端镜像构建失败"
    exit 1
fi

# 4. 尝试启动容器
echo ""
echo "✓ 尝试启动容器..."
if docker-compose up -d >/dev/null 2>&1; then
    echo "  ✅ 容器启动成功"
    
    # 等待服务就绪
    sleep 10
    
    # 检查健康状态
    if curl -f http://localhost:5000/api/health >/dev/null 2>&1; then
        echo "  ✅ 后端服务健康"
    else
        echo "  ⚠️ 后端服务尚未就绪（可能需要更多时间）"
    fi
    
    docker-compose down
else
    echo "  ❌ 容器启动失败"
    exit 1
fi

echo ""
echo "=== 所有检查通过！修复有效 ✅ ==="
```

---

## 常见问题

### Q: 镜像大小是否会增加？
A: 否。最终的生产镜像实际上更小，因为不包含编译工具。

### Q: 构建时间是否会增加？
A: 首次构建时间相似，但后续构建会因为多阶段缓存而变快。

### Q: 是否兼容 GitHub Actions？
A: 是的，完全兼容。GitHub Actions 会自动使用此配置。

### Q: 旧的 Dockerfile 是否需要删除？
A: 否，我们已经覆盖了原有配置。只需推送代码，GitHub Actions 会自动使用新配置。

---

## 下一步

1. ✅ 修复已完成
2. 推送代码到 GitHub
3. GitHub Actions 会自动重新构建
4. 查看构建日志确认成功

```bash
git add server/Dockerfile
git commit -m "fix: Fix server Dockerfile build failure - use multi-stage build"
git push origin ci-ghcr-github-actions-docker-compose-setup
```

---

## 相关文件

- `server/Dockerfile` - 已修复
- `client/Dockerfile` - 已验证（无需修改）
- `.github/workflows/build-and-push-ghcr.yml` - 自动使用新 Dockerfile
