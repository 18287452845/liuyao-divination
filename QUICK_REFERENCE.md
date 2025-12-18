# 🚀 快速参考卡 - GitHub Actions + GHCR

> 打印本页面以便随时查看！

---

## 📋 3 步快速开始

### 第 1 步：启用 GitHub Actions（5 分钟）

```
Settings → Actions → General
→ ✓ Allow all actions and reusable workflows
→ Save
```

### 第 2 步：推送代码（自动构建）

```bash
git push origin main
# GitHub Actions 自动运行！
# 进入 Actions 标签查看进度
```

### 第 3 步：验证镜像（查看结果）

```
GitHub 仓库 → Packages
看到 server 和 client 两个镜像 = 成功！
```

---

## 🔑 核心命令速查

### Docker Compose 操作

```bash
# 查看状态
docker-compose ps

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f
docker-compose logs -f server    # 仅后端

# 停止服务
docker-compose down

# 停止并删除所有数据
docker-compose down -v
```

### GHCR 镜像操作

```bash
# 登录
docker login ghcr.io

# 拉取镜像
docker pull ghcr.io/USERNAME/liuyao-divination/server:main

# 一键部署（使用脚本）
./deploy-ghcr.sh           # Linux/Mac
.\deploy-ghcr.bat          # Windows
```

### Git 操作

```bash
# 查看更改
git status

# 提交更改
git add .
git commit -m "message"

# 推送（触发 GitHub Actions）
git push origin main
```

---

## 📁 重要文件位置

```
根目录/
├── .github/workflows/              ← GitHub Actions 工作流
│   ├── build-and-push-ghcr.yml     (自动构建和推送)
│   ├── deploy-ghcr.yml             (自动部署)
│   └── docker-compose-ghcr.yml     (生成配置)
│
├── docker-compose.yml              ← 本地开发/生产
├── docker-compose.ghcr.yml         ← 生产专用
│
├── deploy-ghcr.sh/bat              ← 一键部署脚本
├── .env.example                    ← 环境配置示例
├── .env.ghcr.example               ← GHCR 环境示例
│
└── 文档/
    ├── GHCR_QUICKSTART.md          ⭐ 快速入门
    ├── GHCR_DEPLOYMENT_GUIDE.md    📖 详细指南
    ├── MANUAL_OPERATIONS_GUIDE.md  📝 操作步骤
    ├── GITHUB_SETUP_CHECKLIST.md   ✓ 检查清单
    └── 其他文档...
```

---

## 🎯 三种部署方式

### 方式 1：本地开发（最简单）
```bash
docker-compose up -d
# 访问: http://localhost:80
```

### 方式 2：测试 GHCR 镜像（本地）
```bash
./deploy-ghcr.sh
# 自动登录、拉取、启动
```

### 方式 3：远程自动部署（完全自动化）
```
配置 GitHub Secrets:
  DEPLOY_HOST
  DEPLOY_USER
  DEPLOY_KEY
  DEPLOY_PORT

代码推送 → 自动构建 → 自动部署
```

---

## ⚙️ 环境变量速查

### 必需的值

```env
# MySQL 密码（必改！）
MYSQL_ROOT_PASSWORD=change-me
MYSQL_PASSWORD=change-me

# JWT 密钥（必改！）
JWT_SECRET=your-long-secret-key

# API 密钥
DEEPSEEK_API_KEY=sk-xxxxx
```

### GHCR 部署配置

```env
GHCR_REGISTRY=ghcr.io
GHCR_REPO=your-username/liuyao-divination
IMAGE_TAG=main
```

### 端口配置

```env
SERVER_PORT=5000
CLIENT_HTTP_PORT=80
CLIENT_HTTPS_PORT=443
```

---

## 🔍 快速检查

### GitHub Actions 是否运行？

```
GitHub 仓库 → Actions 标签
看到工作流 build-and-push-ghcr.yml = 正常
```

### 镜像是否推送成功？

```
GitHub 仓库 → Packages
看到 server 和 client 镜像 = 成功
```

### 容器是否运行？

```bash
docker-compose ps

# 应显示 3 个容器都在 Up 状态
# - liuyao-mysql
# - liuyao-server
# - liuyao-client
```

### 应用是否可访问？

```bash
# 前端
curl http://localhost:80

# 后端
curl http://localhost:5000/api/health

# 都返回内容 = 正常
```

---

## 🆘 常见问题快速解决

| 问题 | 快速解决 |
|-----|--------|
| Actions 工作流失败 | 点击 Actions → 查看日志 → 找 ❌ 步骤 |
| 镜像没有推送 | 检查工作流是否成功 |
| SSH 部署失败 | `ssh -i ~/.ssh/github_deploy user@server.com` 测试 |
| 容器启动失败 | `docker-compose logs server` 查看日志 |
| 端口被占用 | `lsof -i :80` 查看占用进程 |

---

## 📊 工作流状态符号

| 符号 | 含义 |
|------|------|
| ✅ | 步骤成功 |
| ❌ | 步骤失败 |
| ⏳ | 步骤运行中 |
| ⊘ | 步骤被跳过 |

---

## 📱 常用 URL

```
前端:       http://localhost:80
后端 API:   http://localhost:5000/api
健康检查:   http://localhost:5000/api/health
```

---

## 🔐 GitHub Secrets 快速配置

### 基础配置（无需做任何事！）
- ✅ 内置 GITHUB_TOKEN 已自动支持 GHCR
- ✅ 无需额外配置

### 远程部署配置（可选）

```bash
# 1. 生成密钥
ssh-keygen -t ed25519 -f ~/.ssh/github_deploy

# 2. 部署公钥
ssh-copy-id -i ~/.ssh/github_deploy.pub user@server.com

# 3. 在 GitHub 中添加 Secrets
#    DEPLOY_HOST   = server.com
#    DEPLOY_USER   = ubuntu
#    DEPLOY_KEY    = 私钥完整内容
#    DEPLOY_PORT   = 22
```

---

## 📈 镜像标签规则

推送到 main → 标签：`main`, `latest`, `sha-abc123`  
推送到 develop → 标签：`develop`, `sha-def456`  
推送 v1.0.0 → 标签：`v1.0.0`, `v1.0`, `v1`, `latest`

---

## 💡 提示

- 💡 第一次推送会触发构建，需要等待 10-15 分钟
- 💡 后续推送会更快（因为有构建缓存）
- 💡 所有密钥都应存储在 GitHub Secrets，不要放在代码里
- 💡 定期检查 GitHub Security Tab 中的漏洞扫描结果
- 💡 使用 .env 文件管理环境变量

---

## 📚 详细文档

| 需要... | 查看... |
|--------|--------|
| 5分钟快速了解 | GHCR_QUICKSTART.md |
| 逐步配置 | MANUAL_OPERATIONS_GUIDE.md |
| 检查项目状态 | GITHUB_SETUP_CHECKLIST.md |
| 完整参考 | GHCR_DEPLOYMENT_GUIDE.md |
| 查找特定文件 | GITHUB_ACTIONS_FILES_INDEX.md |

---

## ✅ 完成检查列表

- [ ] GitHub Actions 已启用
- [ ] 代码已推送
- [ ] 工作流已运行（查看 Actions 标签）
- [ ] 镜像已推送到 GHCR（查看 Packages）
- [ ] 本地容器启动成功（docker-compose ps）
- [ ] 应用可访问（localhost:80）

完成所有项目后：✅ 您已准备好！

---

**版本**：1.0  
**打印友好**：✅ 是  
**最后更新**：2024 年
