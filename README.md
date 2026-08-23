# 六爻排盘与八字批命系统

这是一个传统命理 Web 应用，包含六爻起卦、排盘、AI 解卦、八字排盘、AI 批注、追问聊天、历史记录和管理后台。全栈本地部署：前端、Express 后端和 MySQL 数据库全部通过 Docker Compose 在自有服务器上运行，不依赖任何外部 BaaS 服务。

## 当前架构

- 前端：React 18、TypeScript、Vite、Tailwind CSS、React Router。
- 后端：Node.js 20、Express、TypeScript（`server/src`）。
- 数据库：MySQL 5.7（初始化脚本在 `server/sql/`）。
- 认证：JWT（access + refresh token）+ RBAC 角色权限。
- AI：DeepSeek API，由后端 SSE 流式转发，支持用户个人 API Key（优先于系统 Key）。
- 部署：Docker Compose 一键部署 mysql + db-init + server + client（Nginx）。

## 主要能力

- 六爻：时间起卦、数字起卦、手动摇卦、完整排盘、变卦、六亲、六神、世应、动爻、空亡等；解卦后可基于同一卦例连续追问。
- 八字：四柱计算、十神、五行、用神/忌神、大运推算、历史记录；批注后可继续追问。
- AI 分析：`/api/ai/analyze`、`/api/ai/chat`、`/api/bazi/ai/analyze`、`/api/bazi/ai/chat`，全部 SSE 流式。
- 用户体系：注册（邀请码）、登录、密码修改、个人 DeepSeek API Key 管理。
- 管理后台：用户、角色、权限、邀请码、登录日志、会话管理。
- 数据隔离：普通用户只能访问自己的记录（SQL 层按 user_id 过滤）。

## 目录结构

```text
client/                 React 前端（Vite + TypeScript，dev 端口 3000，/api 代理到 5000）
server/
  src/                  Express 后端（端口 5000）
  sql/                  MySQL 建库建表与种子数据脚本
  tests/                六爻引擎 + AI 追问协议测试
docker-compose.yml      全栈本地部署（mysql + db-init + server + client）
docker-compose.ghcr.yml 使用 GHCR 预构建镜像的全栈部署
nginx.conf              Nginx 配置（静态资源 + /api 反向代理 + SSE 支持）
.env.example            部署环境变量示例
```

## 本地开发

```bash
npm run install:all
cp server/.env.example server/.env   # 按需修改数据库和 API Key
npm run dev                          # 同时启动前端(3000)和后端(5000)
```

后端需要本地 MySQL（或 `docker compose up -d mysql` 后用 `DB_HOST=localhost` 连接），
首次建库执行：`server/sql/00_init_complete.sql` 等脚本，或直接用 docker-compose 的 db-init 容器。

## 生产部署（全栈 Docker）

1. 准备 `.env`：

```env
NODE_ENV=production
MYSQL_ROOT_PASSWORD=强密码
MYSQL_PASSWORD=强密码
JWT_SECRET=强随机串
DEEPSEEK_API_KEY=sk-xxx
DB_RESET_ON_STARTUP=false
CLIENT_HTTP_PORT=80
```

2. 构建并启动：

```bash
docker compose up -d --build
docker compose logs -f
```

数据库初始化默认非破坏式：空库时自动建表，已有数据不会被动到；
需要强制重建（开发）时设置 `DB_RESET_ON_STARTUP=true`。

3. 访问：`http://服务器IP或域名`（默认 80 端口）。

使用 GHCR 预构建镜像（CI 自动推送 client/server 镜像）：

```bash
docker compose -f docker-compose.ghcr.yml up -d
```

## 默认账号

初始化数据自带测试账号（生产环境必须立即修改密码）：

```text
admin / admin123
testuser / test123
```

## 构建与验证

```bash
npm run build         # 前端 + 后端构建
npm run test:liuyao   # 六爻引擎测试 + AI 追问协议测试
```

CI（GitHub Actions）在 push 到 main 时运行同样检查，并构建推送 client/server 镜像到 GHCR。
构建时可能出现 Vite 大包 warning 和 Browserslist 数据过期提示，不影响运行。

## 文档说明

- 当前入口文档：`README.md`、`AGENTS.md`、`QUICK_REFERENCE.md`。
- 历史上的 Supabase 迁移与回迁报告、Dockerfile 修复报告等仅作归档，不代表当前架构。

## 许可证

MIT License
