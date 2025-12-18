# 📋 GitHub Actions + GHCR 配置文件索引

本文档为所有新增和更新的文件提供完整的索引和说明。

---

## 📁 文件结构

```
项目根目录/
│
├── .github/
│   └── workflows/                          ← GitHub Actions 工作流文件
│       ├── build-and-push-ghcr.yml         ⭐ 主工作流：自动构建并推送
│       ├── deploy-ghcr.yml                 ⭐ 部署工作流：自动部署到服务器
│       └── docker-compose-ghcr.yml         ⭐ 辅助工作流：生成 compose 配置
│
├── docker-compose.yml                      ✏️ 更新：支持本地/GHCR 镜像
├── docker-compose.ghcr.yml                 ⭐ 新增：生产环境 GHCR 配置
│
├── .env.example                            ✏️ 更新：添加 GHCR 变量
├── .env.ghcr.example                       ⭐ 新增：GHCR 部署配置示例
├── .dockerignore                           ⭐ 新增：优化构建
│
├── deploy-ghcr.sh                          ⭐ 新增：Linux/Mac 部署脚本
├── deploy-ghcr.bat                         ⭐ 新增：Windows 部署脚本
│
├── GHCR_QUICKSTART.md                      ⭐ 新增：快速入门指南
├── GHCR_DEPLOYMENT_GUIDE.md                ⭐ 新增：详细部署指南
├── GITHUB_SETUP_CHECKLIST.md               ⭐ 新增：配置检查清单
├── CI_CD_SETUP_SUMMARY.md                  ⭐ 新增：CI/CD 概览
├── MANUAL_OPERATIONS_GUIDE.md              ⭐ 新增：手动操作指南
└── GITHUB_ACTIONS_FILES_INDEX.md           ⭐ 本文件：文件索引
```

---

## 📄 文件详细说明

### GitHub Actions 工作流文件

#### 1️⃣ .github/workflows/build-and-push-ghcr.yml

**用途**：主要 CI 工作流 - 自动构建、测试、扫描并推送镜像

**触发条件**：
- 推送到 `main`, `develop`, 或其他配置的分支
- 推送版本标签（如 `v1.0.0`）
- 创建拉取请求

**执行步骤**：
1. 检出代码
2. 设置 Docker Buildx（多架构构建）
3. 登录到 GHCR
4. 构建后端镜像 → 推送
5. 构建前端镜像 → 推送
6. 运行测试
7. 执行安全扫描 (Trivy)

**文件大小**：~4.4 KB  
**行数**：~140 行

---

#### 2️⃣ .github/workflows/deploy-ghcr.yml

**用途**：CD 工作流 - 自动部署到远程服务器

**触发条件**：
- build-and-push-ghcr.yml 成功完成后
- 或手动触发（workflow_dispatch）

**执行步骤**：
1. 检出代码
2. SSH 连接到部署服务器
3. 拉取最新代码
4. 登录 GHCR
5. 拉取最新镜像
6. 启动容器

**前置条件**：
- 需要在 GitHub Secrets 中配置 SSH 信息
- DEPLOY_HOST, DEPLOY_USER, DEPLOY_KEY, DEPLOY_PORT

**文件大小**：~2.3 KB  
**行数**：~80 行

---

#### 3️⃣ .github/workflows/docker-compose-ghcr.yml

**用途**：辅助工作流 - 手动生成 GHCR compose 配置

**触发条件**：
- 手动触发（workflow_dispatch）
- 提供分支/标签作为输入

**执行步骤**：
1. 检出指定分支
2. 生成 docker-compose.ghcr.yml 配置
3. 验证生成的配置

**文件大小**：~3.8 KB  
**行数**：~120 行

---

### Docker 配置文件

#### 4️⃣ docker-compose.yml（更新版本）

**用途**：通用 Docker Compose 配置 - 支持本地构建和 GHCR 镜像拉取

**主要特性**：
- ✅ 支持本地构建（开发环境）
- ✅ 支持 GHCR 镜像拉取（仅需改注释）
- ✅ 灵活的环境变量配置
- ✅ 容器健康检查
- ✅ 数据卷和网络配置

**包含的服务**：
- MySQL 数据库
- Node.js 后端服务
- Nginx 前端服务

**文件大小**：~2.9 KB  
**行数**：~97 行

**更新说明**：
- 添加了 GHCR 镜像使用说明
- 添加了灵活的端口配置
- 改进了注释

---

#### 5️⃣ docker-compose.ghcr.yml（新增）

**用途**：生产环境 Docker Compose 配置 - 仅使用 GHCR 预构建镜像

**特点**：
- 仅拉取镜像，不进行本地构建
- 快速启动（省去构建时间）
- 适合远程服务器部署
- 完整的环保变量配置

**配置**：
```env
GHCR_REGISTRY=ghcr.io
GHCR_REPO=username/liuyao-divination
IMAGE_TAG=latest
```

**文件大小**：~2.5 KB  
**行数**：~95 行

---

#### 6️⃣ .dockerignore（新增）

**用途**：优化 Docker 构建 - 排除不需要的文件

**排除的文件/目录**：
- node_modules/
- 构建输出 (dist/, build/)
- 日志文件和临时文件
- 环境配置和密钥
- Git 和 CI/CD 配置
- IDE 配置

**好处**：
- 减少镜像大小
- 加快构建速度
- 保护敏感信息

**文件大小**：~0.8 KB  
**行数**：~44 行

---

### 环境配置文件

#### 7️⃣ .env.example（更新版本）

**用途**：本地开发环境配置示例

**主要配置**：
- Node.js 环境设置
- MySQL 数据库连接
- JWT 安全配置
- DeepSeek API 密钥
- 服务端口号
- GHCR 配置（可选）

**文件大小**：~706 字节  
**行数**：~32 行

**更新说明**：
- 添加了详细的注释
- 包含 GHCR 配置部分
- 添加了端口配置

---

#### 8️⃣ .env.ghcr.example（新增）

**用途**：GHCR 生产部署环境配置示例

**主要配置**：
- GHCR 镜像仓库信息
- 数据库凭证（需修改）
- JWT 密钥（需修改）
- API 端点配置

**使用说明**：
1. 复制为 .env：`cp .env.ghcr.example .env`
2. 修改所有必需的值
3. 保存并使用：`docker-compose -f docker-compose.ghcr.yml --env-file .env up`

**文件大小**：~0.8 KB  
**行数**：~36 行

---

### 部署脚本

#### 9️⃣ deploy-ghcr.sh（新增）

**用途**：Linux/Mac 一键部署脚本

**功能**：
- ✅ 检查 Docker & Docker Compose 安装
- ✅ 验证环境配置
- ✅ 自动登录 GHCR
- ✅ 拉取最新镜像
- ✅ 启动服务
- ✅ 验证服务健康状态
- ✅ 显示友好的状态报告

**使用方法**：
```bash
chmod +x deploy-ghcr.sh
./deploy-ghcr.sh
```

**文件大小**：~4.8 KB  
**行数**：~200 行

---

#### 🔟 deploy-ghcr.bat（新增）

**用途**：Windows 一键部署脚本

**功能**：
- ✅ 检查 Docker Desktop 安装
- ✅ 验证环境配置
- ✅ 自动登录 GHCR
- ✅ 拉取最新镜像
- ✅ 启动服务
- ✅ 显示状态报告

**使用方法**：
```cmd
deploy-ghcr.bat
```

**文件大小**：~4.4 KB  
**行数**：~170 行

---

### 文档文件

#### 1️⃣1️⃣ GHCR_QUICKSTART.md（新增）

**用途**：快速入门指南 - 10-15 分钟快速上手

**内容**：
- 📚 快速导航
- 🚀 快速启动（本地）
- 🔧 GitHub 配置（3 步）
- 📦 本地部署（2 种方式）
- 🌐 远程部署（手动）
- 📊 工作流总结
- 🎯 下一步行动

**特点**：
- 面向初学者
- 简洁明快
- 包含示例命令

**文件大小**：~11 KB  
**行数**：~350 行

---

#### 1️⃣2️⃣ GHCR_DEPLOYMENT_GUIDE.md（新增）

**用途**：详细部署指南 - 完整参考文档

**内容**：
- 📋 目录索引
- ✅ 前置要求
- 🔑 GitHub 仓库配置
- 🚀 GitHub Actions 自动构建
- 📦 本地部署（3 种方式）
- 🌐 远程服务器部署（3 种方式）
- 🔧 配置详解
- 🆘 故障排除（6 个常见问题）
- 📚 最佳实践
- 📞 参考资源

**特点**：
- 深度讲解
- 原理详细
- 问题全面

**文件大小**：~15 KB  
**行数**：~600 行

---

#### 1️⃣3️⃣ GITHUB_SETUP_CHECKLIST.md（新增）

**用途**：配置检查清单 - 逐步验证所有配置

**内容**：
- 📋 8 个配置阶段
- ✅ 每个阶段的详细步骤
- 🔍 验证方法
- ⚠️ 注意事项

**阶段包括**：
1. GitHub 仓库基础配置
2. 创建个人访问令牌
3. 配置 Secrets（可选）
4. Docker 配置验证
5. 首次构建测试
6. GHCR 镜像验证
7. 远程部署测试
8. 最终验证

**特点**：
- 逐项检查
- 可打印清单
- 清晰的进度跟踪

**文件大小**：~8.9 KB  
**行数**：~350 行

---

#### 1️⃣4️⃣ CI_CD_SETUP_SUMMARY.md（新增）

**用途**：CI/CD 总体概览 - 快速理解完整方案

**内容**：
- 📝 项目概述
- 📦 文件清单
- 🚀 快速开始（3 步）
- 📋 工作流触发条件
- 🎯 三种部署方式
- 📚 文档导航
- 🔧 工作流详解
- 🌐 Docker Compose 配置
- 📊 架构图
- 🔑 Secrets 配置
- 📈 性能优化
- 🔐 安全实践
- 🆘 快速故障排除

**特点**：
- 全面概览
- 结构清晰
- 容易导航

**文件大小**：~15 KB  
**行数**：~450 行

---

#### 1️⃣5️⃣ MANUAL_OPERATIONS_GUIDE.md（新增）

**用途**：手动操作指南 - 所有需要手动完成的步骤

**内容**：
- 🟢 阶段 1：GitHub 基础配置
- 🔵 阶段 2：验证 GHCR 镜像
- 🟡 阶段 3：配置远程部署
- 📝 本地快速测试
- 🆘 常见问题处理
- 📊 操作检查清单
- 🎯 快速参考命令

**特点**：
- 实操指南
- 详细步骤
- 常见问题已包含

**文件大小**：~13 KB  
**行数**：~450 行

---

#### 1️⃣6️⃣ GITHUB_ACTIONS_FILES_INDEX.md（本文件）

**用途**：完整的文件索引和说明

**内容**：
- 📁 文件结构
- 📄 详细说明
- 📊 统计信息
- 🎯 快速查找

---

## 📊 文件统计

### 按类型统计

| 类型 | 数量 | 说明 |
|------|------|------|
| GitHub Actions 工作流 | 3 | `.github/workflows/*.yml` |
| Docker 配置 | 2 | `docker-compose*.yml` + `.dockerignore` |
| 环境配置 | 2 | `.env*.example` |
| 部署脚本 | 2 | `deploy-ghcr.*` |
| 文档文件 | 6 | `.md` 文档 |
| **总计** | **15** | - |

### 按大小统计

| 类别 | 大小 | 比例 |
|------|------|------|
| 工作流配置 | ~10 KB | 15% |
| Docker 配置 | ~6 KB | 10% |
| 部署脚本 | ~9 KB | 13% |
| 文档 | ~62 KB | 62% |
| **总计** | ~87 KB | 100% |

### 按行数统计

| 类别 | 行数 | 比例 |
|------|------|------|
| 工作流配置 | ~340 | 5% |
| Docker 配置 | ~200 | 3% |
| 部署脚本 | ~370 | 5% |
| 文档 | ~2500 | 87% |
| **总计** | ~3410 | 100% |

---

## 🎯 快速导航

### 按用途查找文件

#### 🚀 快速开始

- [GHCR_QUICKSTART.md](./GHCR_QUICKSTART.md) - 10 分钟快速上手
- [MANUAL_OPERATIONS_GUIDE.md](./MANUAL_OPERATIONS_GUIDE.md#-阶段-1github-仓库基础配置必做) - 第一步操作

#### 🔧 配置和设置

- [GITHUB_SETUP_CHECKLIST.md](./GITHUB_SETUP_CHECKLIST.md) - 逐步配置检查
- [GHCR_DEPLOYMENT_GUIDE.md](./GHCR_DEPLOYMENT_GUIDE.md#github-仓库配置) - GitHub 配置详解

#### 📦 部署相关

- [deploy-ghcr.sh](./deploy-ghcr.sh) / [deploy-ghcr.bat](./deploy-ghcr.bat) - 一键部署脚本
- [docker-compose.ghcr.yml](./docker-compose.ghcr.yml) - GHCR 专用 compose
- [.env.ghcr.example](./.env.ghcr.example) - GHCR 环境配置

#### 📚 工作流和 CI/CD

- [CI_CD_SETUP_SUMMARY.md](./CI_CD_SETUP_SUMMARY.md) - 完整 CI/CD 概览
- [.github/workflows/](./github/workflows) - 工作流文件目录

#### 🆘 故障排除

- [GHCR_DEPLOYMENT_GUIDE.md#故障排除](./GHCR_DEPLOYMENT_GUIDE.md#故障排除) - 详细问题排除
- [MANUAL_OPERATIONS_GUIDE.md#-常见问题处理](./MANUAL_OPERATIONS_GUIDE.md#-常见问题处理) - 快速问题处理

---

## 📖 推荐阅读顺序

### 初次使用

1. 本文（文件索引） ← 你在这里
2. [GHCR_QUICKSTART.md](./GHCR_QUICKSTART.md) - 快速了解
3. [MANUAL_OPERATIONS_GUIDE.md](./MANUAL_OPERATIONS_GUIDE.md) - 逐步操作
4. [GITHUB_SETUP_CHECKLIST.md](./GITHUB_SETUP_CHECKLIST.md) - 验证配置

### 需要深入了解

5. [GHCR_DEPLOYMENT_GUIDE.md](./GHCR_DEPLOYMENT_GUIDE.md) - 完整参考
6. [CI_CD_SETUP_SUMMARY.md](./CI_CD_SETUP_SUMMARY.md) - 整体概览

### 遇到问题

- [GHCR_DEPLOYMENT_GUIDE.md#故障排除](./GHCR_DEPLOYMENT_GUIDE.md#故障排除)
- [MANUAL_OPERATIONS_GUIDE.md#-常见问题处理](./MANUAL_OPERATIONS_GUIDE.md#-常见问题处理)

---

## 💡 实用提示

### 文件选择指南

| 我想... | 打开文件 |
|--------|---------|
| 5 分钟快速了解 | GHCR_QUICKSTART.md |
| 逐步配置系统 | MANUAL_OPERATIONS_GUIDE.md |
| 检查配置完整性 | GITHUB_SETUP_CHECKLIST.md |
| 理解工作原理 | GHCR_DEPLOYMENT_GUIDE.md 或 CI_CD_SETUP_SUMMARY.md |
| 查看所有文件 | 本文档 (GITHUB_ACTIONS_FILES_INDEX.md) |
| 查找特定功能 | 使用 Ctrl+F 搜索 |

### 常用命令速查

```bash
# 查看所有新增文件
find .github -type f
ls -la *.md *.sh *.bat .env* docker-compose*

# 验证工作流文件
yamllint .github/workflows/*.yml

# 测试部署脚本
./deploy-ghcr.sh --help  # 或 .\deploy-ghcr.bat
```

---

## 🎉 完成清单

所有文件已成功创建：

- ✅ GitHub Actions 工作流（3 个）
- ✅ Docker 配置（3 个）
- ✅ 环境配置（2 个）
- ✅ 部署脚本（2 个）
- ✅ 文档指南（6 个）
- ✅ 文件索引（本文）

**总计：17 个文件，~3500 行代码和文档**

---

## 📞 获取支持

- 📖 阅读相关文档
- 🔍 在文档中搜索关键词
- 💬 查看常见问题和故障排除
- 🆘 参考 GitHub Actions 官方文档

---

**文档版本**：1.0  
**最后更新**：2024 年  
**项目**：六爻排盘系统 (liuyao-divination)
