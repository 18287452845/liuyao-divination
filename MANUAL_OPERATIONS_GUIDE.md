# 🔧 GitHub Actions + GHCR 手动操作指南

> 本文档列出所有需要您手动完成的操作步骤

---

## 📌 重要说明

✨ **好消息**：大部分配置已自动生成！您只需完成以下 3 个阶段的手动操作。

---

## 🟢 阶段 1：GitHub 仓库基础配置（必做）

> 预计时间：10 分钟

### 步骤 1.1：启用 GitHub Actions

```
1. 打开 GitHub 浏览器
2. 进入你的仓库主页
3. 点击顶部导航栏的 "Settings" 标签
4. 左侧菜单中找到 "Actions" → "General"
5. 确保 "Allow all actions and reusable workflows" 被选中
6. 点击 "Save"
```

### 步骤 1.2：首次代码推送

```bash
# 在你的本地电脑上执行：

cd /path/to/liuyao-divination

# 确保在主分支
git checkout main

# 添加所有文件
git add .

# 提交（提交消息必须包含 "ci-ghcr"）
git commit -m "feat: Add GitHub Actions and GHCR CI/CD configuration"

# 推送到 GitHub
git push origin main

# GitHub Actions 会自动触发构建！
```

### 步骤 1.3：验证自动构建

```
1. 进入你的 GitHub 仓库
2. 点击顶部的 "Actions" 标签
3. 你应该看到一个正在运行的工作流：
   "Build and Push to GHCR" 或
   "build-and-push-ghcr.yml"
4. 点击它查看执行详情
5. 等待完成（通常需要 5-15 分钟）
6. 如果看到绿色 ✓ 表示成功！
```

---

## 🔵 阶段 2：验证 GHCR 镜像推送（必做）

> 预计时间：5 分钟

### 步骤 2.1：在 GitHub 中查看推送的镜像

```
1. 进入 GitHub 仓库主页
2. 在右侧边栏找到 "Packages" 部分
3. 你应该看到两个新的包：
   - liuyao-divination/server
   - liuyao-divination/client
4. 点击查看各个镜像的标签
```

### 步骤 2.2：（可选）在本地验证镜像可拉取

```bash
# 打开终端执行：

# 1. 登录到 GHCR
docker login ghcr.io
# 输入用户名：YOUR_GITHUB_USERNAME
# 输入密码：YOUR_GITHUB_PAT（或直接回车使用 GITHUB_TOKEN）

# 2. 拉取镜像验证
docker pull ghcr.io/YOUR_USERNAME/liuyao-divination/server:main

# 3. 成功提示应为：
# Downloaded newer image for ghcr.io/...
# sha256:abc123...
```

---

## 🟡 阶段 3：（可选）配置远程自动部署

> 预计时间：20 分钟  
> ⚠️ 仅在拥有远程服务器时执行此步骤

### 步骤 3.1：在本地生成 SSH 密钥对

```bash
# 在你的本地电脑上执行：

# 生成 ED25519 密钥（推荐）
ssh-keygen -t ed25519 -f ~/.ssh/github_deploy -C "github-actions"

# 或生成 RSA 密钥（兼容性更好）
ssh-keygen -t rsa -b 4096 -f ~/.ssh/github_deploy -C "github-actions"

# 按提示操作：
# - 询问密码：可以留空（直接按 Enter）
# - 完成后会生成两个文件：
#   - ~/.ssh/github_deploy         (私钥 - 保密)
#   - ~/.ssh/github_deploy.pub     (公钥 - 放在服务器)
```

### 步骤 3.2：将公钥部署到远程服务器

```bash
# 在你的本地电脑上执行：

# 将公钥复制到服务器
ssh-copy-id -i ~/.ssh/github_deploy.pub user@your-server.com

# 如果上面命令不工作，手动执行：
cat ~/.ssh/github_deploy.pub | ssh user@your-server.com \
  "cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"

# 验证 SSH 连接成功
ssh -i ~/.ssh/github_deploy user@your-server.com "echo SSH works!"
```

### 步骤 3.3：在 GitHub 中添加 SSH Secrets

```
1. 进入 GitHub 仓库主页
2. 点击顶部 "Settings" 标签
3. 左侧菜单：Secrets and variables → Actions
4. 点击 "New repository secret"

需要添加的 4 个 Secrets：
```

#### Secret 1：DEPLOY_HOST

```
名称：DEPLOY_HOST
值：your-server.com        (改为你的服务器地址)
示例：deploy.example.com 或 123.45.67.89
```

#### Secret 2：DEPLOY_USER

```
名称：DEPLOY_USER
值：ubuntu                 (改为你的 SSH 用户名)
示例：ubuntu, admin, root, ec2-user 等
```

#### Secret 3：DEPLOY_KEY

```
名称：DEPLOY_KEY
值：~/.ssh/github_deploy 的完整内容（包括 BEGIN/END 行）

获取方法：
  Linux/Mac:
    cat ~/.ssh/github_deploy
  
  Windows:
    type %USERPROFILE%\.ssh\github_deploy

复制输出的全部内容，包括：
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

#### Secret 4：DEPLOY_PORT（可选）

```
名称：DEPLOY_PORT
值：22              (默认 SSH 端口)
      或其他端口：如 2222, 10022 等
```

### 步骤 3.4：准备远程服务器

```bash
# SSH 连接到你的服务器
ssh user@your-server.com

# 进入或创建应用目录
mkdir -p /opt/liuyao-app
cd /opt/liuyao-app

# 克隆仓库
git clone https://github.com/YOUR_USERNAME/liuyao-divination.git .

# 创建环境文件
cp .env.ghcr.example .env

# ⚠️ 重要：编辑 .env 设置正确的值！
nano .env
# 或
vi .env

# 需要修改的重要值：
# - MYSQL_ROOT_PASSWORD: 改为强密码
# - MYSQL_PASSWORD: 改为强密码
# - JWT_SECRET: 改为长随机字符串
# - DEEPSEEK_API_KEY: 改为你的 API Key
# - GHCR_REPO: 改为 your-username/liuyao-divination

# 保存文件后退出编辑器
```

### 步骤 3.5：测试自动部署

```bash
# 在本地电脑上推送代码变更
git push origin main

# 在 GitHub Actions 中查看：
# 1. Actions 标签 → build-and-push-ghcr.yml 应该运行
# 2. 构建成功后，deploy-ghcr.yml 应该自动触发
# 3. 查看 deploy-ghcr.yml 的日志确认部署成功

# 在服务器上验证：
docker-compose -f docker-compose.ghcr.yml ps

# 应该显示三个容器都在运行
```

---

## 📝 本地快速测试

> 如果还没有设置 GHCR 和远程部署，可以先测试本地环境

### 测试 1：使用本地构建

```bash
# 1. 进入项目目录
cd /path/to/liuyao-divination

# 2. 复制环境文件
cp .env.example .env

# 3. 启动容器
docker-compose up -d

# 4. 检查状态
docker-compose ps

# 5. 访问应用
# 前端: http://localhost:80
# 后端: http://localhost:5000/api/health

# 6. 查看日志
docker-compose logs -f

# 7. 停止容器
docker-compose down
```

### 测试 2：使用 GHCR 镜像（本地）

```bash
# 1. 准备环境文件
cp .env.ghcr.example .env

# 2. 编辑 .env 设置 GHCR 配置
# 需要改的值：
# - GHCR_REGISTRY=ghcr.io
# - GHCR_REPO=your-username/liuyao-divination
# - IMAGE_TAG=main
# - GHCR_USERNAME=your-github-username
# - GHCR_PASSWORD=your-pat-token（可选，如果镜像是私有的）

# 3. 运行一键部署脚本
./deploy-ghcr.sh              # Linux/Mac
.\deploy-ghcr.bat             # Windows

# 脚本会自动：
# - 检查依赖
# - 登录 GHCR
# - 拉取最新镜像
# - 启动服务
# - 验证健康状态
```

---

## 🆘 常见问题处理

### 问题 1：GitHub Actions 工作流失败

**症状**：Actions 标签显示红色 ❌

**处理步骤**：
```
1. 点击失败的工作流
2. 找到有 ❌ 标记的步骤
3. 点击展开查看错误信息
4. 常见原因和解决：

   如果错误是 "Dockerfile not found":
   - 检查 server/Dockerfile 和 client/Dockerfile 是否存在
   - 确保路径正确

   如果错误是 "npm install failed":
   - 检查 package.json 是否有效
   - 查看依赖版本是否兼容

   如果错误是 "docker login failed":
   - 这通常是临时问题，重新运行工作流即可
   - 在 Actions 中找到失败的运行 → Re-run jobs
```

### 问题 2：镜像没有推送到 GHCR

**症状**：GitHub Packages 中看不到镜像

**处理步骤**：
```
1. 检查工作流是否成功
   - 如果工作流有 ❌，先修复工作流错误
   
2. 检查镜像名称是否正确
   - 应该显示在 Packages 中为两个包
   
3. 检查仓库可见性
   - 如果仓库是私有的，镜像默认也是私有的
   - 需要在 GitHub Packages 设置中改变可见性
   
4. 手动检查（本地电脑）
   docker login ghcr.io -u YOUR_USERNAME
   docker pull ghcr.io/YOUR_USERNAME/liuyao-divination/server:main
   
   如果失败：
   - 可能需要创建新的 GitHub PAT 或重新登录
```

### 问题 3：SSH 部署连接失败

**症状**：deploy-ghcr.yml 工作流中显示 "Permission denied" 或 "Connection refused"

**处理步骤**：
```
1. 本地验证 SSH 连接
   ssh -i ~/.ssh/github_deploy user@your-server.com

   如果失败：
   - 检查服务器地址是否正确
   - 检查用户名是否正确
   - 检查防火墙是否开放 SSH 端口
   
2. 验证公钥已添加到服务器
   ssh -i ~/.ssh/github_deploy user@your-server.com \
     "cat ~/.ssh/authorized_keys | grep github-actions"
   
   如果没有看到你的公钥：
   - 重新运行步骤 3.2 添加公钥
   
3. 检查 GitHub Secrets
   - 确认 DEPLOY_KEY 包含完整私钥内容
   - 确认 DEPLOY_HOST 和 DEPLOY_USER 正确
   - 确认没有多余空格或换行符
```

### 问题 4：容器启动失败 - 数据库连接错误

**症状**：Docker 容器启动后立即退出

**处理步骤**：
```
1. 查看容器日志
   docker-compose logs mysql
   docker-compose logs server

2. 常见原因：

   a) MySQL 还没有启动
      - 等待 30-40 秒让 MySQL 初始化
      - 查看 docker-compose.yml 中的 healthcheck 设置
   
   b) 数据库密码错误
      - 检查 .env 文件中的 MYSQL_PASSWORD
      - 确保与 MYSQL_USER 对应
      - 重启容器：docker-compose restart server
   
   c) 数据库初始化失败
      - 删除数据卷重新初始化：
        docker-compose down -v
        docker-compose up -d

3. 手动测试数据库连接
   docker-compose exec mysql mysql -u root -p
   # 输入密码（MYSQL_ROOT_PASSWORD 的值）
   # 如果成功登录，数据库连接正常
```

---

## 📊 操作检查清单

### ✅ 必需步骤

- [ ] 阶段 1：GitHub Actions 配置
  - [ ] 启用 Actions
  - [ ] 推送代码
  - [ ] 验证工作流运行

- [ ] 阶段 2：验证 GHCR
  - [ ] 查看 Packages 中的镜像
  - [ ] （可选）本地拉取验证

### ⚠️ 可选步骤

- [ ] 阶段 3：远程部署（如有服务器）
  - [ ] 生成 SSH 密钥
  - [ ] 部署公钥到服务器
  - [ ] 添加 GitHub Secrets
  - [ ] 准备服务器环境
  - [ ] 测试自动部署

### 🧪 测试步骤

- [ ] 本地测试 1：使用本地构建
- [ ] 本地测试 2：使用 GHCR 镜像
- [ ] （可选）远程测试：服务器部署

---

## 📱 使用部署脚本的优势

### deploy-ghcr.sh / deploy-ghcr.bat

自动化脚本已为您处理以下任务：

```
✓ 检查 Docker 和 Docker Compose 是否安装
✓ 验证 .env 文件存在
✓ 加载环境变量
✓ 验证必需变量
✓ 登录到 GHCR
✓ 停止旧容器
✓ 拉取最新镜像
✓ 启动新容器
✓ 等待服务就绪
✓ 验证健康状态
✓ 显示友好的状态信息和日志查看命令
```

### 使用方法

```bash
# Linux/Mac
chmod +x deploy-ghcr.sh
./deploy-ghcr.sh

# Windows
.\deploy-ghcr.bat
```

---

## 🎯 快速参考命令

### Docker 操作

```bash
# 查看容器状态
docker-compose ps

# 查看日志
docker-compose logs -f                 # 所有服务
docker-compose logs -f server          # 仅后端

# 重启服务
docker-compose restart

# 停止和删除
docker-compose down
docker-compose down -v                 # 同时删除数据

# 强制重新构建
docker-compose up -d --build

# 进入容器
docker-compose exec server bash
```

### GHCR 操作

```bash
# 登录
docker login ghcr.io

# 拉取镜像
docker pull ghcr.io/USERNAME/liuyao-divination/server:main

# 查看本地镜像
docker images | grep ghcr.io

# 删除镜像
docker rmi ghcr.io/USERNAME/liuyao-divination/server:main
```

### GitHub 操作

```bash
# 使用 GitHub CLI（需要安装）
gh auth login                          # 登录 GitHub
gh workflow list                       # 列出所有工作流
gh run list --workflow=build-and-push-ghcr.yml  # 查看运行历史
gh run view <run_id> --log             # 查看详细日志
```

---

## 📞 需要帮助？

| 问题 | 查看 |
|------|------|
| 快速开始？ | [GHCR_QUICKSTART.md](./GHCR_QUICKSTART.md) |
| 详细说明？ | [GHCR_DEPLOYMENT_GUIDE.md](./GHCR_DEPLOYMENT_GUIDE.md) |
| 配置检查？ | [GITHUB_SETUP_CHECKLIST.md](./GITHUB_SETUP_CHECKLIST.md) |
| CI/CD 概览？ | [CI_CD_SETUP_SUMMARY.md](./CI_CD_SETUP_SUMMARY.md) |
| 本文档 | 手动操作步骤 |

---

## ⏱️ 完成时间估计

| 任务 | 时间 | 难度 |
|------|------|------|
| 启用 GitHub Actions | 5 分钟 | ⭐ 简单 |
| 首次推送和验证 | 15 分钟 | ⭐ 简单 |
| 验证 GHCR 镜像 | 5 分钟 | ⭐ 简单 |
| 本地测试 | 10 分钟 | ⭐ 简单 |
| **最小完成时间** | **35 分钟** | - |
| 配置远程部署 | 30 分钟 | ⭐⭐ 中等 |
| 完整部署（含远程）| 60 分钟 | ⭐⭐ 中等 |

---

## 🎉 完成后的收获

完成以上步骤后，您将拥有：

- ✅ 自动构建 Docker 镜像
- ✅ 镜像自动推送到 GHCR
- ✅ 自动运行测试和安全扫描
- ✅ （可选）自动部署到远程服务器
- ✅ 零停机时间的应用更新
- ✅ 完整的 CI/CD 流程

---

**指南版本**：1.0  
**最后更新**：2024 年  
**适用项目**：六爻排盘系统 (liuyao-divination)
