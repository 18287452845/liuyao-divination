# GitHub Actions + GHCR CI/CD 完整部署方案

## 📝 项目概述

已为本项目创建完整的 CI/CD 自动化部署流程，支持：

- ✅ **自动构建**：代码推送时自动构建 Docker 镜像
- ✅ **镜像仓库**：使用 GitHub Container Registry (GHCR) 存储镜像
- ✅ **自动部署**：可选的自动部署到远程服务器
- ✅ **安全扫描**：自动执行漏洞扫描和代码安全检查
- ✅ **跨平台支持**：同时提供 Linux/Mac 和 Windows 部署脚本

---

## 📦 新增文件清单

### GitHub Actions 工作流文件

```
.github/workflows/
├── build-and-push-ghcr.yml          ⭐ 主工作流：自动构建并推送镜像到 GHCR
├── deploy-ghcr.yml                  ⭐ 部署工作流：从 GHCR 部署到服务器
└── docker-compose-ghcr.yml          ⭐ 辅助工作流：生成 GHCR compose 配置
```

### Docker 配置文件

```
├── docker-compose.yml               ✏️ 更新：支持本地构建和 GHCR 镜像拉取
├── docker-compose.ghcr.yml          ⭐ 新增：生产环境专用配置（使用 GHCR 镜像）
└── .dockerignore                    ⭐ 新增：优化 Docker 构建速度
```

### 环境配置文件

```
├── .env.example                     ✏️ 更新：添加 GHCR 相关变量
└── .env.ghcr.example               ⭐ 新增：GHCR 部署专用配置
```

### 部署脚本

```
├── deploy-ghcr.sh                   ⭐ 新增：Linux/Mac 一键部署脚本
└── deploy-ghcr.bat                  ⭐ 新增：Windows 一键部署脚本
```

### 文档

```
├── GHCR_QUICKSTART.md               ⭐ 新增：快速入门指南（10-15 分钟）
├── GHCR_DEPLOYMENT_GUIDE.md         ⭐ 新增：详细部署指南（完整参考）
├── GITHUB_SETUP_CHECKLIST.md        ⭐ 新增：配置检查清单（逐步操作）
└── CI_CD_SETUP_SUMMARY.md           ⭐ 本文件：汇总说明
```

---

## 🚀 快速开始（3 步）

### 步骤 1：基础 GitHub 配置（5 分钟）

```bash
# 1. 进入 GitHub 仓库 Settings → Actions → General
# 2. 勾选 "Allow all actions and reusable workflows"
# 3. 保存设置
```

✨ **好消息**：GitHub Actions 内置 `GITHUB_TOKEN` 已自动支持 GHCR！无需额外配置！

### 步骤 2：推送代码触发自动构建（1 分钟）

```bash
# 推送任何代码改动（或推送到任何分支）
git push

# GitHub Actions 会自动：
# ✓ 构建 Docker 镜像
# ✓ 推送到 GHCR
# ✓ 运行测试和安全扫描
```

### 步骤 3：查看构建结果（2 分钟）

```
GitHub 仓库 → Actions 标签 → 查看最近的工作流 → 点击查看日志
```

---

## 📋 工作流触发条件

### build-and-push-ghcr.yml 自动触发条件

- ✅ 推送到 `main` 分支
- ✅ 推送到 `develop` 分支
- ✅ 推送到 `ci-ghcr-github-actions-docker-compose-setup` 分支
- ✅ 推送任何版本标签（如 `v1.0.0`）
- ✅ 创建拉取请求到 `main` 或 `develop`

### deploy-ghcr.yml 触发条件

- ✅ build-and-push-ghcr.yml 成功完成后自动触发
- ✅ 或手动触发（Settings → Actions secrets 配置后）

---

## 🎯 三种部署方式

### 方式 1：本地开发（最简单）

```bash
# 本地构建运行
docker-compose up -d

# 访问：http://localhost:80
```

**适用场景**：日常开发、测试

---

### 方式 2：本地使用 GHCR 镜像（推荐测试）

```bash
# 一键部署
./deploy-ghcr.sh              # Linux/Mac
.\deploy-ghcr.bat             # Windows

# 访问：http://localhost:80
```

**适用场景**：
- 测试生产环境镜像
- 验证 GHCR 配置是否正确
- 模拟远程部署环境

---

### 方式 3：远程服务器自动部署（完全自动化）

```bash
# GitHub 仓库 Settings → Secrets 中添加：
# - DEPLOY_HOST      (服务器地址)
# - DEPLOY_USER      (SSH 用户名)
# - DEPLOY_KEY       (SSH 私钥)
# - DEPLOY_PORT      (SSH 端口，默认 22)

# 之后每次代码推送会自动：
# 1. 构建镜像
# 2. 推送到 GHCR
# 3. SSH 连接服务器
# 4. 部署新镜像
# 5. 启动服务
```

**适用场景**：
- 生产环境自动化部署
- 持续交付 (CD)
- 零停机部署

---

## 📚 文档导航

### 🟢 初次使用？从这里开始

1. **[GHCR_QUICKSTART.md](./GHCR_QUICKSTART.md)** ← 10-15 分钟快速上手
   - 快速启动命令
   - 基本概念
   - 常用命令

2. **[GITHUB_SETUP_CHECKLIST.md](./GITHUB_SETUP_CHECKLIST.md)** ← 按步骤配置
   - 详细的配置检查清单
   - 每个步骤验证
   - 问题排除

### 🔵 需要详细说明？

3. **[GHCR_DEPLOYMENT_GUIDE.md](./GHCR_DEPLOYMENT_GUIDE.md)** ← 完整参考文档
   - 详细原理说明
   - 所有配置选项
   - 故障排除指南
   - 最佳实践

### 🟡 快速查询？

4. **本文件** - CI/CD 总览
   - 文件清单
   - 快速开始
   - 工作流概览

---

## 🔧 GitHub Actions 工作流详解

### build-and-push-ghcr.yml

**职责**：构建、测试、安全扫描并推送镜像

**步骤流程**：
```
1. Checkout 代码
   ↓
2. 设置 Docker Buildx（多架构构建支持）
   ↓
3. 登录 GHCR（使用内置 GITHUB_TOKEN）
   ↓
4. 提取镜像元数据（生成标签规则）
   ↓
5. 构建后端镜像 → 推送到 GHCR
   ↓
6. 构建前端镜像 → 推送到 GHCR
   ↓
7. 运行测试（可选）
   ↓
8. 执行安全扫描（Trivy 漏洞扫描）
   ↓
9. 上传扫描结果到 GitHub Security Tab
```

**输出镜像**：
```
ghcr.io/YOUR_USERNAME/liuyao-divination/server:TAG
ghcr.io/YOUR_USERNAME/liuyao-divination/client:TAG

其中 TAG 包括：
- latest      (main 分支推送时)
- main        (main 分支)
- develop     (develop 分支)
- vX.Y.Z      (版本标签)
- sha-XXXXX   (提交 SHA)
```

---

### deploy-ghcr.yml

**职责**：监控构建完成并自动部署

**步骤流程**（当启用 SSH 部署时）：
```
1. 检测 build-and-push-ghcr.yml 完成
   ↓
2. Checkout 代码（获取最新 docker-compose 配置）
   ↓
3. 通过 SSH 连接到部署服务器
   ↓
4. 拉取最新代码（git pull）
   ↓
5. 登录 GHCR
   ↓
6. 拉取最新镜像（docker-compose pull）
   ↓
7. 启动容器（docker-compose up -d）
   ↓
8. 清理旧镜像（docker system prune）
```

**前提条件**：
- 在 GitHub Secrets 中配置 DEPLOY_* 相关密钥
- 服务器已准备好（已安装 Docker & Docker Compose）

---

## 🌐 Docker Compose 配置

### 三个配置文件的区别

| 文件 | 用途 | 构建方式 | 推荐场景 |
|------|------|--------|--------|
| **docker-compose.yml** | 通用配置 | 支持本地构建或 GHCR 拉取 | 开发 + 生产 |
| **docker-compose.ghcr.yml** | GHCR 专用 | 仅拉取 GHCR 镜像 | 生产环境 |
| 原始 docker-compose.yml | 已更新 | - | - |

### 如何切换到 GHCR 镜像

**方法 1**：使用专用配置文件（推荐）
```bash
docker-compose -f docker-compose.ghcr.yml up -d
```

**方法 2**：修改 docker-compose.yml
```yaml
# 将此行
build:
  context: ./server
  dockerfile: Dockerfile

# 替换为
image: ghcr.io/YOUR_USERNAME/liuyao-divination/server:latest
```

---

## 📊 工作流架构图

```
┌──────────────────────────────────────────────────────────┐
│                  开发者推送代码                              │
│                   git push main                           │
└───────────────┬────────────────────────────────────────┘
                │
                ↓
┌──────────────────────────────────────────────────────────┐
│         GitHub Actions: build-and-push-ghcr.yml         │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 1. Checkout                                        │ │
│  │ 2. Setup Docker Buildx                            │ │
│  │ 3. Login to GHCR                                  │ │
│  │ 4. Build & Push Server Image                      │ │
│  │ 5. Build & Push Client Image                      │ │
│  │ 6. Run Tests                                      │ │
│  │ 7. Security Scan (Trivy)                          │ │
│  └────────────────────────────────────────────────────┘ │
└───────────────┬──────────────────────────────────────┬──┘
                │                                      │
                ↓                                      ↓
        ┌─────────────────┐            ┌──────────────────────┐
        │  GHCR Registry   │            │   GitHub Security    │
        │  - server:main  │            │   - Scan Results     │
        │  - client:main  │            │   - Vulnerabilities  │
        └─────────────────┘            └──────────────────────┘
                │
                ↓
        ✅ 如果配置了 SSH Secrets：
        │
        ├──→ GitHub Actions: deploy-ghcr.yml
        │    ├─ SSH Connect
        │    ├─ Docker Login
        │    ├─ Pull Latest Images
        │    └─ Restart Containers
        │
        └──→ ✅ 部署完成！
```

---

## 🔑 GitHub Secrets 配置（可选）

### 基础配置（仅 CI）

- ✅ 无需配置任何 Secrets！
- ✅ 使用内置 `GITHUB_TOKEN` 自动推送到 GHCR

### 高级配置（CI + CD）

如需自动部署到远程服务器，在仓库中添加以下 Secrets：

```
DEPLOY_HOST        → 服务器地址（如 your-server.com）
DEPLOY_USER        → SSH 用户名（如 ubuntu）
DEPLOY_KEY         → SSH 私钥（完整内容，包括 BEGIN/END 行）
DEPLOY_PORT        → SSH 端口（默认 22，可选）
```

配置步骤：
1. GitHub 仓库 → Settings → Secrets and variables → Actions
2. New repository secret
3. 依次添加上述 secrets

---

## 🎯 镜像标签策略

工作流会自动为推送的镜像设置多个标签：

| 场景 | 标签示例 | 说明 |
|-----|--------|------|
| main 分支推送 | `main`, `latest`, `sha-abc123` | 生产环境 |
| develop 分支推送 | `develop`, `sha-def456` | 开发环境 |
| 版本标签 | `v1.0.0`, `v1.0`, `v1`, `latest` | 正式版本 |
| PR 请求 | 不推送镜像 | 仅测试 |

---

## 📈 性能优化

### Docker 构建缓存

工作流使用 GitHub Actions 的 `gha` 缓存：
- 首次构建：5-10 分钟
- 增量构建：1-3 分钟（如无大变更）

### 镜像大小

- 后端 (server)：~150-300 MB
- 前端 (client)：~50-100 MB

### 优化建议

1. 定期清理 Docker 镜像：`docker image prune`
2. 优化 .dockerignore 文件
3. 使用多阶段 Dockerfile（已配置）
4. 压缩构建日志输出

---

## 🔐 安全最佳实践

### 密钥管理

- ✅ 所有密钥存储在 GitHub Secrets
- ✅ 不在代码或日志中暴露密钥
- ✅ 定期轮换 SSH 密钥
- ✅ 使用强密码（最少 16 字符）

### 镜像安全

- ✅ 自动执行 Trivy 漏洞扫描
- ✅ 定期更新基础镜像 (node, nginx)
- ✅ 最小化镜像中的依赖
- ✅ 查看 GitHub Security Tab 中的扫描结果

### 构建安全

- ✅ 验证所有输入数据
- ✅ 不在 Dockerfile 中硬编码密钥
- ✅ 使用构建参数传递配置
- ✅ 限制容器权限 (非 root)

---

## 🆘 快速故障排除

### GitHub Actions 工作流失败

**查看日志**：
1. GitHub 仓库 → Actions 标签
2. 点击失败的工作流
3. 查看具体步骤的错误消息

**常见原因**：
- ❌ Docker 构建错误 → 检查 Dockerfile 和代码
- ❌ 依赖安装失败 → 检查 package.json
- ❌ 环境变量缺失 → 检查 .env 配置

### GHCR 镜像拉取失败

```bash
# 测试本地登录和拉取
docker login ghcr.io -u YOUR_USERNAME -p YOUR_TOKEN
docker pull ghcr.io/YOUR_USERNAME/liuyao-divination/server:main
```

### SSH 部署失败

```bash
# 测试本地 SSH 连接
ssh -i ~/.ssh/github_deploy user@your-server.com
```

更多帮助见 [GHCR_DEPLOYMENT_GUIDE.md](./GHCR_DEPLOYMENT_GUIDE.md#故障排除)

---

## 📞 获取帮助

| 问题类型 | 参考文档 |
|---------|--------|
| 快速开始 | [GHCR_QUICKSTART.md](./GHCR_QUICKSTART.md) |
| 详细配置 | [GHCR_DEPLOYMENT_GUIDE.md](./GHCR_DEPLOYMENT_GUIDE.md) |
| 逐步操作 | [GITHUB_SETUP_CHECKLIST.md](./GITHUB_SETUP_CHECKLIST.md) |
| 项目概述 | [README.md](./README.md) |
| 开发指南 | [CLAUDE.md](./CLAUDE.md) |

---

## 📊 项目统计

### 新增文件数

- GitHub Actions 工作流：3 个
- Docker 配置：2 个
- 环境配置：2 个
- 部署脚本：2 个
- 文档：4 个
- **总计：13 个文件**

### 代码行数

- 工作流配置：~300 行
- Docker 配置：~200 行
- 部署脚本：~200 行
- 文档：~2000 行
- **总计：~2700 行**

---

## ✅ 验收清单

部署方案已包括：

- ✅ GitHub Actions 自动构建工作流
- ✅ 镜像推送到 GHCR
- ✅ 自动测试和安全扫描
- ✅ 可选的自动部署到远程服务器
- ✅ Docker Compose 支持 GHCR 镜像
- ✅ 一键部署脚本（Linux/Mac 和 Windows）
- ✅ 详细的配置文档
- ✅ 快速入门指南
- ✅ 操作检查清单
- ✅ 故障排除指南
- ✅ 完整的环境配置示例

---

## 🎉 下一步

1. ✅ 阅读 [GHCR_QUICKSTART.md](./GHCR_QUICKSTART.md)（10 分钟）
2. ✅ 按照 [GITHUB_SETUP_CHECKLIST.md](./GITHUB_SETUP_CHECKLIST.md) 配置（15 分钟）
3. ✅ 推送代码触发自动构建
4. ✅ 查看 GitHub Actions 工作流运行
5. ✅ 验证镜像已推送到 GHCR
6. ✅ （可选）配置远程自动部署

---

**文档版本**：1.0  
**更新时间**：2024 年  
**适用项目**：六爻排盘系统 (liuyao-divination)
