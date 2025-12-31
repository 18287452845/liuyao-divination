# GitHub Container Registry (GHCR) 与 GitHub Actions CI/CD 部署指南

## 📋 目录

1. [概述](#概述)
2. [前置要求](#前置要求)
3. [GitHub 仓库配置](#github-仓库配置)
4. [GitHub Actions 自动构建](#github-actions-自动构建)
5. [本地部署](#本地部署)
6. [远程服务器部署](#远程服务器部署)
7. [故障排除](#故障排除)

---

## 概述

本项目已配置完整的 CI/CD 流程：

- **持续集成 (CI)**：代码推送时自动构建 Docker 镜像
- **镜像仓库**：使用 GitHub Container Registry (GHCR) 存储镜像
- **持续部署 (CD)**：支持自动部署到远程服务器（需要配置）

### 生成的文件

```
.github/
├── workflows/
│   ├── build-and-push-ghcr.yml       # 主要 CI 工作流：构建并推送镜像
│   ├── deploy-ghcr.yml               # CD 工作流：部署到服务器
│   └── docker-compose-ghcr.yml       # 辅助工作流：生成 GHCR compose 文件

docker-compose.yml                     # 本地开发和生产环境通用配置
docker-compose.ghcr.yml                # 生产环境：使用 GHCR 镜像
.env.ghcr.example                      # GHCR 部署所需环境变量示例
.dockerignore                          # Docker 构建时排除文件

deploy-ghcr.sh                         # Linux/Mac 部署脚本
deploy-ghcr.bat                        # Windows 部署脚本
```

---

## 前置要求

### 开发环境

- Git 已安装并配置
- GitHub 账户（已有仓库访问权限）
- Docker Desktop 已安装（本地测试用）
- docker-compose 已安装

### 生产环境（远程服务器）

- 目标服务器上已安装 Docker 和 Docker Compose
- 服务器可以访问 GitHub Container Registry
- SSH 访问权限（用于 CD 部署）

---

## GitHub 仓库配置

### 步骤 1：启用 GitHub Actions

1. 进入你的 GitHub 仓库
2. 点击 **Settings** 标签
3. 左侧菜单选择 **Actions** → **General**
4. 确保 **Allow all actions and reusable workflows** 被选中
5. 保存设置

### 步骤 2：配置 GitHub Personal Access Token (PAT)

虽然 GitHub Actions 默认有 `GITHUB_TOKEN`，但如需更多权限（如推送到其他仓库），需要创建 PAT：

1. 进入 GitHub 账户 Settings → [Developer settings](https://github.com/settings/apps)
2. 选择 **Personal access tokens** → **Fine-grained tokens**
3. 点击 **Generate new token**
4. 配置权限：
   - **Repository access**: 选择你的仓库
   - **Permissions**:
     - Repository: `Contents` (read & write)
     - Repository: `Packages` (read & write)
5. 生成 token 并复制保存（稍后需要）

**备注**：GitHub Actions 内置的 `secrets.GITHUB_TOKEN` 已自动支持 GHCR，无需额外配置！

### 步骤 3：配置仓库 Secrets（可选 - 用于远程部署）

如需启用自动部署到远程服务器，配置以下 Secrets：

1. 进入仓库 **Settings** → **Secrets and variables** → **Actions**
2. 点击 **New repository secret**
3. 添加以下 secrets（用于 `deploy-ghcr.yml`）：

```
DEPLOY_HOST      # 部署服务器地址，如 your-server.com
DEPLOY_USER      # SSH 用户名，如 ubuntu
DEPLOY_KEY       # SSH 私钥（带 -----BEGIN----- 和 -----END----- 头尾）
DEPLOY_PORT      # SSH 端口，默认 22
```

#### 配置 SSH 密钥

**生成密钥对**（如果还没有）：

```bash
ssh-keygen -t ed25519 -f ~/.ssh/github_deploy -C "github-actions"
# 或者用 RSA（兼容性更好）
ssh-keygen -t rsa -b 4096 -f ~/.ssh/github_deploy -C "github-actions"
```

**部署步骤**：

1. **将公钥添加到服务器**：
   ```bash
   cat ~/.ssh/github_deploy.pub | ssh user@your-server.com \
     "cat >> ~/.ssh/authorized_keys"
   ```

2. **添加私钥到 GitHub Secrets**：
   - 复制 `~/.ssh/github_deploy` 的内容（包括 BEGIN/END 行）
   - 在 GitHub 中作为 `DEPLOY_KEY` secret 添加

---

## GitHub Actions 自动构建

### 工作流触发条件

`build-and-push-ghcr.yml` 在以下情况自动触发：

- ✅ 推送到 `main` 分支
- ✅ 推送到 `develop` 分支
- ✅ 推送到 `ci-ghcr-github-actions-docker-compose-setup` 分支（测试分支）
- ✅ 推送版本标签（如 `v1.0.0`）
- ✅ 创建拉取请求到 `main` 或 `develop`

### 工作流步骤

1. **构建镜像**：
   - 后端镜像：`ghcr.io/YOUR_USERNAME/liuyao-divination/server`
   - 前端镜像：`ghcr.io/YOUR_USERNAME/liuyao-divination/client`

2. **镜像标签策略**：
   - 分支推送：标签为分支名称（`main`, `develop` 等）
   - 标签推送：标签为版本号（`v1.0.0`, `v1.0`, `v1` 等）
   - SHA：始终标签化为最后一次提交的 SHA
   - Latest：`main` 分支推送时标记为 `latest`

3. **推送到 GHCR**：仅在非 PR 请求时执行

4. **测试**：运行基础测试和构建验证

5. **安全扫描**：运行 Trivy 漏洞扫描

### 查看工作流状态

1. 进入仓库
2. 点击 **Actions** 标签
3. 选择相应的工作流查看执行状态和日志

### 访问推送的镜像

推送成功后，镜像可在以下位置访问：

```bash
# 使用特定标签
ghcr.io/YOUR_USERNAME/liuyao-divination/server:main
ghcr.io/YOUR_USERNAME/liuyao-divination/client:main

# 查看所有镜像
docker run -it ghcr.io/YOUR_USERNAME/liuyao-divination/server:latest
```

---

## 本地部署

### 方式 1：使用 docker-compose（本地构建）

**适用于开发环境**

```bash
# 1. 进入项目目录
cd /path/to/liuyao-divination

# 2. 创建 .env 文件
cp .env.example .env
# 编辑 .env，至少设置这些：
# DEEPSEEK_API_KEY=sk-xxxxx

# 3. 启动服务
docker-compose up -d

# 4. 查看日志
docker-compose logs -f

# 5. 访问应用
# 前端: http://localhost:80
# 后端: http://localhost:5000/api
```

### 方式 2：使用 GHCR 镜像（本地）

**适用于测试生产镜像**

```bash
# 1. 准备环境文件
cp .env.ghcr.example .env

# 2. 编辑 .env，设置：
# GHCR_REGISTRY=ghcr.io
# GHCR_REPO=YOUR_USERNAME/liuyao-divination
# IMAGE_TAG=main  # 或其他标签
# GHCR_USERNAME=YOUR_GITHUB_USERNAME
# GHCR_PASSWORD=YOUR_GITHUB_PAT  # 可选，如果是私有镜像

# 3. 运行部署脚本
./deploy-ghcr.sh        # Linux/Mac
.\deploy-ghcr.bat       # Windows

# 或者手动运行：
docker login ghcr.io -u YOUR_USERNAME -p YOUR_PAT
docker-compose -f docker-compose.ghcr.yml pull
docker-compose -f docker-compose.ghcr.yml up -d
```

### 方式 3：手动指定 GHCR 镜像

```bash
# 编辑 docker-compose.yml
# 1. 注释掉 server 服务的 build 部分
# 2. 取消注释 image 行
# 3. 注释掉 client 服务的 build 部分
# 4. 取消注释 image 行
# 5. 启动
docker-compose up -d
```

---

## 远程服务器部署

### 方式 1：使用 CD 工作流自动部署（推荐）

**前置条件**：已按上述步骤配置 SSH 密钥和 GitHub Secrets

1. **配置完成后**，每次成功构建镜像后会自动触发部署
2. **部署状态**可在 Actions 标签查看

### 方式 2：手动部署到服务器

```bash
# 在服务器上执行：

# 1. 进入应用目录
cd /opt/liuyao-app

# 2. 拉取最新代码（如需要）
git pull origin main

# 3. 登录 GHCR
docker login ghcr.io -u YOUR_USERNAME -p YOUR_PAT

# 4. 创建 .env 文件
cp .env.ghcr.example .env
# 编辑 .env 设置正确的值

# 5. 拉取并启动
docker-compose -f docker-compose.ghcr.yml pull
docker-compose -f docker-compose.ghcr.yml up -d

# 6. 检查状态
docker-compose -f docker-compose.ghcr.yml ps

# 7. 查看日志
docker-compose -f docker-compose.ghcr.yml logs -f
```

### 方式 3：使用提供的部署脚本

```bash
# 在服务器上：

# 1. 复制脚本到服务器
scp deploy-ghcr.sh user@your-server.com:/opt/liuyao-app/

# 2. SSH 连接到服务器
ssh user@your-server.com

# 3. 进入应用目录
cd /opt/liuyao-app

# 4. 运行部署脚本
chmod +x deploy-ghcr.sh
./deploy-ghcr.sh

# 脚本会自动处理：
# - 检查依赖
# - 加载环境变量
# - 登录 GHCR
# - 停止旧容器
# - 拉取新镜像
# - 启动服务
# - 验证健康状态
```

---

## 配置详解

### 环境变量（.env.ghcr.example）

```env
# GHCR 配置
GHCR_REGISTRY=ghcr.io                           # GHCR 服务器地址
GHCR_REPO=your-username/liuyao-divination       # 仓库路径
IMAGE_TAG=latest                                 # 镜像标签

# 端口配置
MYSQL_PORT=3306
SERVER_PORT=5000
CLIENT_HTTP_PORT=80
CLIENT_HTTPS_PORT=443

# MySQL 配置（务必修改）
MYSQL_ROOT_PASSWORD=change-me                   # MySQL root 密码
MYSQL_DATABASE=liuyao_db
MYSQL_USER=liuyao_user
MYSQL_PASSWORD=change-me                        # MySQL 用户密码

# Node.js 环境
NODE_ENV=production

# JWT 配置（务必修改）
JWT_SECRET=your-jwt-secret-key-change-in-prod   # JWT 密钥
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# DeepSeek API
DEEPSEEK_API_KEY=sk-xxxxx                       # 从 https://platform.deepseek.com 获取
DEEPSEEK_API_URL=https://api.deepseek.com
```

### docker-compose.yml vs docker-compose.ghcr.yml

| 特性 | docker-compose.yml | docker-compose.ghcr.yml |
|-----|-------------------|----------------------|
| 用途 | 本地开发 + 生产 | 生产环境（GHCR 镜像） |
| 构建方式 | 本地构建 | 使用预构建镜像 |
| 镜像来源 | 本地 Dockerfile | GHCR |
| 启动速度 | 较慢（需构建） | 快速（仅拉取） |
| 推荐场景 | 开发、测试 | 生产部署 |

---

## GitHub Actions 工作流详解

### build-and-push-ghcr.yml

**职责**：构建、测试、扫描并推送镜像到 GHCR

**步骤**：
1. 检出代码
2. 设置 Docker Buildx（支持多架构构建）
3. 登录 GHCR（使用内置 GITHUB_TOKEN）
4. 提取元数据（生成镜像标签）
5. 构建并推送后端镜像
6. 构建并推送前端镜像
7. 运行测试
8. 执行安全扫描（Trivy）

**输出**：
- 后端镜像：`ghcr.io/USERNAME/liuyao-divination/server:TAG`
- 前端镜像：`ghcr.io/USERNAME/liuyao-divination/client:TAG`

### deploy-ghcr.yml

**职责**：监控构建完成并部署到远程服务器

**触发条件**：
- 构建工作流成功完成
- 或手动触发 (`workflow_dispatch`)

**步骤**：
1. 检出代码
2. 通过 SSH 连接到部署服务器
3. 拉取最新代码
4. 登录 GHCR
5. 拉取和启动容器

**注意**：此工作流需配置 SSH 密钥（见 GitHub 仓库配置部分）

---

## 常见操作

### 更新镜像版本

```bash
# 推送新版本标签
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions 会自动：
# 1. 构建镜像
# 2. 标记为 v1.0.0, v1.0, v1, latest
# 3. 推送到 GHCR
```

### 仅在特定分支构建

修改 `.github/workflows/build-and-push-ghcr.yml`：

```yaml
on:
  push:
    branches:
      - main              # 只在 main 分支构建
```

### 跳过 CD 部署

在提交信息中包含 `[skip cd]`：

```bash
git commit -m "Some change [skip cd]"
```

然后在 `deploy-ghcr.yml` 中添加检查（高级用法）

### 查看镜像详情

```bash
# 登录 GitHub
gh auth login

# 查看组织的包
gh package list --owner YOUR_USERNAME

# 查看特定包的版本
gh package list-versions YOUR_USERNAME/liuyao-divination/server
```

---

## 故障排除

### 问题 1：工作流失败 - 无法推送镜像

**症状**：错误信息 `unauthorized: authentication required`

**解决**：
1. 确认 GitHub Actions 已启用
2. 确认仓库 Settings 中 Actions 权限正确
3. 检查 `secrets.GITHUB_TOKEN` 有效性
4. 尝试手动运行：`gh workflow run build-and-push-ghcr.yml -b main`

### 问题 2：部署失败 - SSH 连接错误

**症状**：`Permission denied (publickey)` 或 `Connection refused`

**解决**：
1. 验证 `DEPLOY_KEY` secret 包含正确的私钥格式
2. 验证 `DEPLOY_HOST` 和 `DEPLOY_USER` 正确
3. 确认服务器上公钥已添加到 `~/.ssh/authorized_keys`
4. 测试本地 SSH 连接：`ssh -i ~/.ssh/github_deploy user@your-server.com`

### 问题 3：镜像拉取失败 - 认证错误

**症状**：`unauthorized: authentication required` 或 `pull access denied`

**解决**：
1. 确认镜像是否为私有
2. 验证 GHCR 登录凭证正确
3. 用 `docker login` 手动测试：
   ```bash
   docker login ghcr.io -u USERNAME -p TOKEN
   docker pull ghcr.io/USERNAME/liuyao-divination/server:main
   ```

### 问题 4：容器启动失败 - 数据库连接错误

**症状**：`Error: connect ECONNREFUSED 127.0.0.1:3306`

**解决**：
1. 等待 MySQL 容器完全启动（有延迟）
2. 检查 `.env` 中数据库配置正确
3. 验证容器在同一网络：`docker network ls`
4. 查看 MySQL 日志：`docker-compose logs mysql`

### 问题 5：权限拒绝 - 端口已占用

**症状**：`Error: bind: address already in use`

**解决**：
1. 查找占用端口的进程：`lsof -i :80` 或 `netstat -an`
2. 停止现有容器：`docker-compose down`
3. 更改 `.env` 中的端口设置
4. 或关闭占用该端口的其他应用

### 问题 6：工作流构建缓存问题

**症状**：构建很慢或使用过时代码

**解决**：
1. GitHub Actions 自动管理缓存，无需手动清理
2. 强制重新构建：在工作流中选择 "Run workflow" 并等待
3. 查看缓存状态在构建日志中查找 `type=gha`

---

## 最佳实践

### 1. 安全性

- ✅ 定期轮换密钥和密码
- ✅ 使用强密码（最少 16 字符）
- ✅ 不要在代码中提交密钥
- ✅ 使用 GitHub Secrets 存储所有敏感信息
- ✅ 定期审计 GitHub Actions 日志

### 2. 版本管理

- ✅ 使用语义化版本号（v1.0.0）
- ✅ 为重要版本创建 GitHub Release
- ✅ 保持 `main` 分支稳定
- ✅ 在 `develop` 分支进行测试

### 3. 性能

- ✅ 使用 Docker 构建缓存
- ✅ 使用多阶段 Dockerfile
- ✅ 优化 .dockerignore 文件
- ✅ 定期清理无用镜像和容器

### 4. 监控

- ✅ 定期检查 Actions 工作流状态
- ✅ 查看容器日志以发现问题
- ✅ 配置警报通知（GitHub 原生支持）
- ✅ 使用 `docker stats` 监控资源使用

---

## 参考资源

- [GitHub Container Registry 官方文档](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [GitHub Actions 官方文档](https://docs.github.com/en/actions)
- [Docker Compose 官方文档](https://docs.docker.com/compose/)
- [Docker 最佳实践](https://docs.docker.com/develop/dev-best-practices/)

---

## 获取帮助

如遇问题：

1. 查看 GitHub Actions 工作流日志
2. 查看容器日志：`docker-compose logs service_name`
3. 测试单个命令而不是整个工作流
4. 查看 GitHub Actions 文档和社区讨论

---

**版本**：1.0  
**最后更新**：2024 年  
**作者**：六爻排盘系统团队
