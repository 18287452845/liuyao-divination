# GitHub Actions + GHCR 配置检查清单

> 按照此清单确保所有配置步骤都已完成

---

## 📋 阶段 1：GitHub 仓库基础配置

### 1.1 仓库访问权限
- [ ] 已有 GitHub 账户
- [ ] 是仓库的所有者或有管理员权限
- [ ] 已将本地仓库连接到 GitHub（remote origin 正确）

### 1.2 启用 GitHub Actions
- [ ] 进入仓库 Settings → Actions → General
- [ ] 勾选 **"Allow all actions and reusable workflows"**
- [ ] 选择 **"Allow GitHub Actions to create and approve pull requests"**（可选但推荐）
- [ ] 点击 Save

### 1.3 验证工作流文件已存在
- [ ] `.github/workflows/build-and-push-ghcr.yml` ✓
- [ ] `.github/workflows/deploy-ghcr.yml` ✓
- [ ] `.github/workflows/docker-compose-ghcr.yml` ✓

---

## 🔑 阶段 2：创建个人访问令牌 (PAT)

### 2.1 生成 Fine-grained Personal Access Token

- [ ] 访问 https://github.com/settings/tokens?type=beta
- [ ] 点击 **"Generate new token"**
- [ ] 设置 Token 名称：`ghcr-deployment-token`
- [ ] 设置过期时间：90 天或更长
- [ ] 选择 **"Only select repositories"** 并勾选此仓库
- [ ] 设置权限：

  ```
  ✓ Repository permissions:
    - Contents: read & write
    - Packages: read & write
  
  ✓ Account permissions:
    - Read access to metadata
  ```

- [ ] 点击 **"Generate token"**
- [ ] **立即复制并保存** token（仅显示一次！）

### 2.2 验证 Token 权限

- [ ] Token 包含 `repo` 和 `write:packages` 权限
- [ ] Token 未过期

---

## 🔐 阶段 3：配置 GitHub Secrets（可选 - 用于远程部署）

### 3.1 基础配置（仅构建 + 推送）

> 说明：使用内置 GITHUB_TOKEN 已足以推送到 GHCR，无需额外配置！

- [ ] GitHub Actions 会自动使用 GITHUB_TOKEN
- [ ] 无需手动创建任何 Secrets
- [ ] ✨ 工作流会自动工作

### 3.2 高级配置（如需远程自动部署）

如果想启用自动部署到远程服务器，需要添加以下 Secrets：

#### 3.2.1 生成 SSH 密钥对

```bash
# 在本地电脑上执行
ssh-keygen -t ed25519 -f ~/.ssh/github_deploy -C "github-actions"

# 或使用 RSA（更好的兼容性）
ssh-keygen -t rsa -b 4096 -f ~/.ssh/github_deploy -C "github-actions"
```

- [ ] 私钥已生成：`~/.ssh/github_deploy`
- [ ] 公钥已生成：`~/.ssh/github_deploy.pub`

#### 3.2.2 将公钥部署到服务器

```bash
ssh-copy-id -i ~/.ssh/github_deploy.pub user@your-server.com

# 验证
ssh -i ~/.ssh/github_deploy user@your-server.com "echo SSH works"
```

- [ ] 可以用私钥成功 SSH 连接到服务器
- [ ] 服务器已将公钥添加到 `~/.ssh/authorized_keys`

#### 3.2.3 在 GitHub 中添加 Secrets

进入仓库 **Settings** → **Secrets and variables** → **Actions**

| Secret 名称 | 值 | 备注 |
|----------|-----|------|
| `DEPLOY_HOST` | your-server.com | 部署服务器地址 |
| `DEPLOY_USER` | ubuntu | SSH 用户名 |
| `DEPLOY_KEY` | ~/.ssh/github_deploy 的内容 | 包括 BEGIN/END 行 |
| `DEPLOY_PORT` | 22 | SSH 端口（可选）|

添加步骤：
- [ ] 进入 Settings → Secrets and variables → Actions
- [ ] 点击 **New repository secret**
- [ ] 依次添加上表中的每一个 Secret
- [ ] 对于 DEPLOY_KEY，复制整个文件内容：
  ```bash
  cat ~/.ssh/github_deploy
  ```

---

## 📦 阶段 4：验证 Docker 配置

### 4.1 检查 Dockerfile

- [ ] `server/Dockerfile` 存在且有效
- [ ] `client/Dockerfile` 存在且有效
- [ ] 两个 Dockerfile 都包含 EXPOSE 指令

### 4.2 检查 Docker Compose 文件

- [ ] `docker-compose.yml` 存在
- [ ] `docker-compose.ghcr.yml` 存在
- [ ] `.dockerignore` 存在

### 4.3 环境配置

- [ ] `.env.example` 存在
- [ ] `.env.ghcr.example` 存在
- [ ] `.env` 文件不在 git 中（已在 .gitignore）

---

## 🚀 阶段 5：首次构建测试

### 5.1 在本地测试构建

```bash
# 进入项目目录
cd /path/to/liuyao-divination

# 测试本地构建
docker-compose build

# 或仅构建特定服务
docker-compose build server
docker-compose build client
```

- [ ] 后端构建成功（无错误）
- [ ] 前端构建成功（无错误）

### 5.2 推送代码触发 GitHub Actions

```bash
# 确保在正确分支
git branch  # 确认在 main 或 develop

# 提交并推送
git add .
git commit -m "feat: Enable GitHub Actions CI/CD"
git push origin main
```

- [ ] 代码已推送到 GitHub
- [ ] GitHub Actions 工作流已自动触发

### 5.3 监控工作流执行

- [ ] 进入仓库主页 → **Actions** 标签
- [ ] 找到最近的工作流运行
- [ ] 查看工作流状态：
  - [ ] ✅ Checkout 完成
  - [ ] ✅ Setup Docker Buildx 完成
  - [ ] ✅ Login to GHCR 完成
  - [ ] ✅ Build and push backend 完成
  - [ ] ✅ Build and push frontend 完成
  - [ ] ✅ Tests 完成
  - [ ] ✅ Security scan 完成

### 5.4 验证镜像已推送到 GHCR

```bash
# 方式 1：使用 docker pull 测试
docker login ghcr.io -u YOUR_USERNAME -p YOUR_PAT
docker pull ghcr.io/YOUR_USERNAME/liuyao-divination/server:main

# 方式 2：在 GitHub 网页上查看
# 进入仓库 → Packages（在右侧栏）
```

- [ ] 镜像成功推送到 GHCR
- [ ] 可以看到 `server` 和 `client` 两个包
- [ ] 镜像标记正确（`main`, `latest`, `sha-xxxxx` 等）

---

## 🌐 阶段 6：本地部署测试

### 6.1 使用本地构建部署

```bash
# 创建环境文件
cp .env.example .env

# 启动服务
docker-compose up -d

# 验证服务运行
docker-compose ps
```

- [ ] MySQL 容器运行中 ✓
- [ ] Server 容器运行中 ✓
- [ ] Client 容器运行中 ✓

### 6.2 访问应用

```bash
# 在浏览器中打开
# 前端: http://localhost:80
# 后端 API: http://localhost:5000/api/health
```

- [ ] 前端页面加载成功
- [ ] 后端 API 响应 200 OK

### 6.3 清理

```bash
docker-compose down
```

- [ ] 容器已停止

---

## ☁️ 阶段 7：远程部署测试（可选）

> 仅在配置了 DEPLOY_* Secrets 后执行此步骤

### 7.1 准备远程服务器

```bash
# 在服务器上
ssh user@your-server.com

# 创建应用目录
mkdir -p /opt/liuyao-app
cd /opt/liuyao-app

# 克隆仓库
git clone https://github.com/YOUR_USERNAME/liuyao-divination.git .

# 创建环境文件
cp .env.ghcr.example .env

# 编辑 .env 设置正确的值
nano .env  # 或使用其他编辑器
```

- [ ] 服务器目录已创建：`/opt/liuyao-app`
- [ ] 仓库已克隆
- [ ] `.env` 文件已创建并配置

### 7.2 测试手动部署

```bash
# 在服务器上
cd /opt/liuyao-app

# 登录 GHCR
docker login ghcr.io -u YOUR_USERNAME -p YOUR_PAT

# 运行部署脚本
chmod +x deploy-ghcr.sh
./deploy-ghcr.sh

# 或手动运行
docker-compose -f docker-compose.ghcr.yml pull
docker-compose -f docker-compose.ghcr.yml up -d

# 验证
docker-compose -f docker-compose.ghcr.yml ps
docker-compose -f docker-compose.ghcr.yml logs -f
```

- [ ] 镜像已拉取
- [ ] 容器已启动
- [ ] 服务健康检查通过

### 7.3 测试自动 CD 部署

```bash
# 在本地：再次推送代码
git push origin main

# 在 GitHub：
# - 进入 Actions 标签
# - 查看 build-and-push-ghcr.yml 完成
# - 然后查看 deploy-ghcr.yml 触发

# 在服务器上：
# - 观察容器自动更新
# - 检查日志确认部署成功
```

- [ ] 自动部署工作流已触发
- [ ] 代码已自动部署到服务器
- [ ] 应用已成功重启

---

## 🔍 阶段 8：最终验证

### 8.1 工作流检查

- [ ] `build-and-push-ghcr.yml` 在代码推送时自动运行
- [ ] 工作流完成时间：< 15 分钟
- [ ] 无错误或仅有警告

### 8.2 镜像仓库检查

```bash
# 查看所有推送的镜像
docker pull ghcr.io/YOUR_USERNAME/liuyao-divination/server:latest
docker pull ghcr.io/YOUR_USERNAME/liuyao-divination/client:latest
docker pull ghcr.io/YOUR_USERNAME/liuyao-divination/server:main
```

- [ ] 镜像可以成功拉取
- [ ] 镜像标签正确（latest, main, 版本号等）
- [ ] 镜像大小合理（server < 500MB, client < 100MB）

### 8.3 容器运行检查

```bash
# 测试拉取的镜像
docker run --rm ghcr.io/YOUR_USERNAME/liuyao-divination/server:latest

# 应输出类似：
# > liuyao-divination@1.0.0 start
# > node dist/index.js
# Application listening on port 5000
```

- [ ] 后端容器成功启动
- [ ] 前端容器成功启动
- [ ] 无运行时错误

---

## 📚 参考文档

| 文档 | 用途 |
|------|------|
| [GHCR_QUICKSTART.md](./GHCR_QUICKSTART.md) | 快速入门（推荐新手阅读）|
| [GHCR_DEPLOYMENT_GUIDE.md](./GHCR_DEPLOYMENT_GUIDE.md) | 详细部署指南 |
| [README.md](./README.md) | 项目概述 |
| [CLAUDE.md](./CLAUDE.md) | 开发指南 |

---

## ✅ 完成检查

所有步骤已完成？

- [ ] 是的！所有配置都已完成
- [ ] 缺少某些步骤？返回查看上面的阶段
- [ ] 遇到问题？查看 GHCR_DEPLOYMENT_GUIDE.md 的故障排除部分

---

## 🎉 下一步

1. ✅ 所有配置都已完成
2. 🚀 可以开始开发和部署
3. 📊 定期检查 Actions 工作流状态
4. 🔄 每次推送都会自动触发构建和部署

---

**检查清单版本**: 1.0  
**最后更新**: 2024 年
