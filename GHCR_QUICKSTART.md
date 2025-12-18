# GHCR + GitHub Actions 快速入门指南

> ⏱️ 预计完成时间：10-15 分钟

## 📚 快速导航

- 🚀 **[快速启动](#快速启动)**
- 🔧 **[GitHub 配置](#github-配置)**
- 📦 **[本地部署](#本地部署)**  
- 🌐 **[远程部署](#远程部署)**
- 🆘 **[故障排除](#故障排除)**

---

## 快速启动

### 本地快速测试（仅需 Docker）

```bash
# 1️⃣ 准备环境
cp .env.example .env

# 2️⃣ 启动应用（本地构建）
docker-compose up -d

# 3️⃣ 访问应用
# 前端: http://localhost:80
# 后端: http://localhost:5000/api
```

---

## GitHub 配置

### ✅ 必做 3 步

#### 1. 启用 GitHub Actions

```
GitHub 仓库 → Settings → Actions → General
→ 勾选 "Allow all actions and reusable workflows"
```

#### 2. 创建个人访问令牌（PAT）

```bash
# 在 GitHub.com 上操作：
Settings → Developer settings → Personal access tokens → Fine-grained tokens
→ Generate new token

# 权限选择：
- Repository access: 选择你的仓库
- Permissions:
  - Repository: Contents (read & write)
  - Repository: Packages (read & write)

# 保存 token（下面会用到）
```

**✨ 好消息**：GitHub Actions 内置 `GITHUB_TOKEN` 已自动支持 GHCR，无需额外配置！

#### 3. 推送代码触发自动构建

```bash
# 推送代码（任何分支或标签）
git push

# GitHub Actions 会自动：
# ✓ 构建 Docker 镜像
# ✓ 推送到 GHCR
# ✓ 运行测试和安全扫描

# 查看进度：GitHub 仓库 → Actions 标签
```

---

## 本地部署

### 场景 1：开发环境（推荐）

```bash
# 最简单的方式 - 本地构建
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止
docker-compose down
```

### 场景 2：测试 GHCR 镜像（本地）

```bash
# 1. 准备配置
cp .env.ghcr.example .env

# 2. 编辑 .env 设置：
#   GHCR_REGISTRY=ghcr.io
#   GHCR_REPO=YOUR_USERNAME/liuyao-divination
#   IMAGE_TAG=main

# 3. 运行一键部署脚本
./deploy-ghcr.sh              # Linux/Mac
.\deploy-ghcr.bat             # Windows

# 或手动操作
docker login ghcr.io -u YOUR_USERNAME -p YOUR_PAT
docker-compose -f docker-compose.ghcr.yml pull
docker-compose -f docker-compose.ghcr.yml up -d
```

---

## 远程部署

### 前置条件

- 有远程服务器（云主机）
- 服务器已安装 Docker & Docker Compose
- 可用 SSH 密钥连接服务器

### 方式 1：一键部署（推荐）

#### 生成 SSH 密钥

```bash
# 在你的本地电脑上
ssh-keygen -t ed25519 -f ~/.ssh/github_deploy -C "github-actions"

# 或使用 RSA（更兼容）
ssh-keygen -t rsa -b 4096 -f ~/.ssh/github_deploy -C "github-actions"
```

#### 部署公钥到服务器

```bash
ssh-copy-id -i ~/.ssh/github_deploy.pub user@your-server.com

# 或手动操作
cat ~/.ssh/github_deploy.pub | ssh user@your-server.com \
  "cat >> ~/.ssh/authorized_keys"
```

#### 配置 GitHub Secrets

```
GitHub 仓库 → Settings → Secrets and variables → Actions
→ New repository secret

需要添加的 Secrets：
┌─────────────────┬────────────────────────────────────┐
│ 名称            │ 值                                  │
├─────────────────┼────────────────────────────────────┤
│ DEPLOY_HOST     │ your-server.com                     │
│ DEPLOY_USER     │ ubuntu (或你的用户名)               │
│ DEPLOY_KEY      │ ~/.ssh/github_deploy 的内容         │
│ DEPLOY_PORT     │ 22 (默认) 或其他 SSH 端口          │
└─────────────────┴────────────────────────────────────┘
```

#### 自动部署完成

现在每次代码推送后，会自动：
1. ✓ 构建镜像
2. ✓ 推送到 GHCR
3. ✓ 部署到服务器
4. ✓ 启动应用

### 方式 2：手动部署到服务器

```bash
# 在服务器上执行
ssh user@your-server.com

# 进入应用目录
cd /opt/liuyao-app

# 首次部署：克隆仓库
git clone https://github.com/YOUR_USERNAME/liuyao-divination.git .

# 后续更新：拉取最新代码
git pull origin main

# 创建环境文件
cp .env.ghcr.example .env
# ⚠️ 编辑 .env 设置正确的值！

# 运行部署脚本
./deploy-ghcr.sh

# 检查状态
docker-compose -f docker-compose.ghcr.yml ps

# 查看日志
docker-compose -f docker-compose.ghcr.yml logs -f
```

---

## 环境变量速查表

### 开发环境 (.env.example)

```env
# 最基本的配置
NODE_ENV=development
DEEPSEEK_API_KEY=sk-xxxxx  # 必须！从 https://platform.deepseek.com 获取
```

### 生产环境 (GHCR 部署 .env.ghcr.example)

```env
# GHCR 配置
GHCR_REGISTRY=ghcr.io
GHCR_REPO=YOUR_USERNAME/liuyao-divination  # 必须改！
IMAGE_TAG=main  # 或 develop, v1.0.0 等

# 数据库配置（务必修改！）
MYSQL_ROOT_PASSWORD=your-secure-password
MYSQL_PASSWORD=your-secure-password

# JWT 密钥（务必修改！）
JWT_SECRET=your-very-long-secret-key

# API 密钥
DEEPSEEK_API_KEY=sk-xxxxx
```

---

## 工作流总结

### 本地开发

```
编写代码 → git push → GitHub Actions 自动测试、构建、推送
         ↓
        √ 镜像已在 GHCR 中
        √ 工作流已完成
```

### 本地快速测试

```
docker-compose up → 访问 localhost:80 → docker-compose down
```

### 使用 GHCR 镜像测试

```
./deploy-ghcr.sh → 自动登录、拉取、启动 → 访问 localhost:80
```

### 自动远程部署

```
GitHub Actions 检测到代码变更
       ↓
构建镜像并推送到 GHCR
       ↓
通过 SSH 连接服务器
       ↓
拉取最新镜像并启动
       ↓
验证服务健康状态
       ↓
完成！📦
```

---

## 常用命令

### Docker Compose

```bash
# 查看所有服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
docker-compose logs -f server

# 重启服务
docker-compose restart

# 停止并删除容器（保留数据）
docker-compose down

# 停止并删除所有数据
docker-compose down -v

# 重新构建并启动
docker-compose up -d --build
```

### GHCR 镜像操作

```bash
# 登录 GHCR
docker login ghcr.io -u YOUR_USERNAME -p YOUR_PAT

# 拉取镜像
docker pull ghcr.io/YOUR_USERNAME/liuyao-divination/server:main

# 查看本地镜像
docker images | grep ghcr.io

# 删除镜像
docker rmi ghcr.io/YOUR_USERNAME/liuyao-divination/server:main
```

### GitHub Actions

```bash
# 使用 GitHub CLI 查看工作流
gh workflow list

# 查看特定工作流的运行记录
gh run list --workflow=build-and-push-ghcr.yml

# 查看工作流详细日志
gh run view <run_id> --log
```

---

## 故障排除

### ❌ "unauthorized: authentication required"

**原因**：GHCR 登录失败或权限不足

**解决**：
```bash
# 1. 重新登录
docker logout ghcr.io
docker login ghcr.io -u YOUR_USERNAME -p YOUR_PERSONAL_ACCESS_TOKEN

# 2. 验证 token 权限包括 packages (read & write)

# 3. 确认镜像名称正确
docker pull ghcr.io/YOUR_USERNAME/liuyao-divination/server:main
```

### ❌ "port 80 already in use"

**原因**：端口被占用

**解决**：
```bash
# 查看占用 80 端口的进程
lsof -i :80

# 改用其他端口
# 编辑 .env：CLIENT_HTTP_PORT=8080
# 或停止占用该端口的服务
```

### ❌ 工作流构建失败

**解决步骤**：
1. 进入 GitHub 仓库 → Actions 标签
2. 点击失败的工作流查看日志
3. 查找 ❌ 标记的步骤
4. 常见原因：
   - Dockerfile 错误 → 修复代码
   - 依赖安装失败 → 检查 package.json
   - 构建命令失败 → 在本地重现问题

### ❌ SSH 部署失败

**解决步骤**：
```bash
# 1. 本地测试 SSH 连接
ssh -i ~/.ssh/github_deploy -p 22 user@your-server.com

# 2. 检查 GitHub Secrets 配置
# 确认 DEPLOY_KEY 包含完整的私钥（BEGIN/END 行）

# 3. 检查服务器公钥
# 在服务器上执行：
cat ~/.ssh/authorized_keys | grep github-actions
```

---

## 📊 架构图

```
┌─────────────────────────────────────────────────────────┐
│                    你的 GitHub 仓库                       │
└──────────┬──────────────────────────────────────────────┘
           │ git push
           ↓
┌─────────────────────────────────────────────────────────┐
│            GitHub Actions (CI/CD)                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 1. Checkout 代码                                 │   │
│  │ 2. 构建 Docker 镜像                              │   │
│  │ 3. 运行测试                                     │   │
│  │ 4. 推送到 GHCR                                  │   │
│  │ 5. SSH 连接服务器并部署                         │   │
│  └─────────────────────────────────────────────────┘   │
└──────────┬────────────────────────┬────────────────────┘
           │                        │
           ↓                        ↓
    ┌──────────────────┐   ┌──────────────────┐
    │   GHCR (镜像仓)   │   │  远程服务器(部署) │
    │  server:main     │   │  Docker Compose  │
    │  client:main     │   │  MySQL/Node      │
    └──────────────────┘   └──────────────────┘
```

---

## 🎯 下一步

1. ✅ 按照上述步骤配置 GitHub
2. ✅ 推送代码到仓库
3. ✅ 检查 GitHub Actions 工作流
4. ✅ 验证镜像出现在 GHCR
5. ✅ （可选）配置远程部署
6. ✅ 享受自动化部署！🚀

---

## 📚 完整文档

详见 [GHCR_DEPLOYMENT_GUIDE.md](./GHCR_DEPLOYMENT_GUIDE.md)

---

**Version**: 1.0  
**Last Updated**: 2024
