# 六爻排盘与八字批命系统

这是一个传统命理 Web 应用，包含六爻起卦、排盘、AI 解卦、八字排盘、AI 批注、历史记录和管理后台。项目已完成后端迁移：生产环境只需要部署前端静态站点，认证、数据库、RLS 权限和少量特权操作全部依赖 Supabase。

## 当前架构

- 前端：React 18、TypeScript、Vite、Tailwind CSS、React Router。
- 数据与认证：Supabase Auth、Supabase Postgres、Row Level Security。
- 后端替代：Supabase Edge Functions。
- AI：DeepSeek API，通过 Supabase Edge Function 流式返回。
- 部署：Docker 只部署 `client` 容器，Nginx 负责静态资源和 SPA fallback。

不再需要部署旧的 Express API、MySQL、JWT 服务或 `/api` 反向代理。

## 主要能力

- 六爻：时间起卦、数字起卦、手动摇卦、完整排盘、变卦、六亲、六神、世应、动爻、空亡等。
- 八字：四柱计算、十神、五行、用神/忌神、大运推算、历史记录。
- AI 分析：六爻解卦和八字批注，支持用户个人 DeepSeek API Key，系统 fallback key 配置在 Supabase Edge Function secret 中。
- 用户体系：Supabase Auth 登录/注册、密码修改、用户资料表同步。
- 管理后台：用户、角色、权限、邀请码、登录日志、会话管理。
- 数据隔离：通过 Supabase RLS 约束普通用户只能访问自己的记录，管理员可访问管理数据。

## 目录结构

```text
client/
  src/
    domain/              # 已迁移到前端的六爻/八字核心算法
    lib/supabase.ts      # Supabase browser client
    utils/api.ts         # 管理后台和工具接口的 Supabase 适配层
    utils/baziApi.ts     # 八字记录与 AI 调用
    contexts/AuthContext.tsx
server/supabase/
  migrations/            # Supabase schema、RLS、trigger、policy
  functions/
    analyze-ai/          # DeepSeek 流式分析
    admin-api/           # 创建/删除用户、重置密码等特权操作
docker-compose.yml       # 前端-only 本地/服务器部署
docker-compose.ghcr.yml  # 前端-only GHCR 镜像部署
nginx.conf               # SPA 静态站点配置
.env.example             # 前端部署环境变量示例
```

旧 `server/src`、`server/sql`、旧测试报告和旧部署报告保留为迁移历史参考，不再是生产运行链路。

## 本地开发

```bash
npm run install:all
cp .env.example .env
# 填入 VITE_SUPABASE_URL 和 VITE_SUPABASE_PUBLISHABLE_KEY
npm run dev
```

默认访问：

```text
http://localhost:3000
```

根脚本现在只启动前端 Vite 服务。

## 生产部署

1. 准备 `.env`：

```env
NODE_ENV=production
VITE_SUPABASE_URL=https://vnwhsdmcnkfavdmbxskc.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_publishable_key_here
CLIENT_HTTP_PORT=80
```

2. 启动前端容器：

```bash
docker compose up -d --build
docker compose logs -f client
```

3. 访问：

```text
http://服务器IP或域名
```

使用 GHCR 镜像时：

```bash
docker compose -f docker-compose.ghcr.yml up -d
```

## Supabase 配置

需要在 Supabase 项目中完成：

- 执行 `server/supabase/migrations` 下的迁移。
- 部署 Edge Functions：
  - `analyze-ai`
  - `admin-api`
- 为 Edge Functions 配置 secrets：
  - `SUPABASE_SERVICE_ROLE_KEY`：仅 `admin-api` 使用，不能放到前端。
  - `DEEPSEEK_API_KEY`：系统级 AI fallback key，可选。
  - `DEEPSEEK_API_URL`：默认 `https://api.deepseek.com`，可选。
  - `DEEPSEEK_MODEL`：默认 `deepseek-chat`，可选。

前端只允许暴露 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_PUBLISHABLE_KEY`。

## 默认账号

迁移时已保留默认测试账号：

```text
admin / admin123
testuser / test123
```

生产环境必须尽快修改默认密码。

## 构建与验证

```bash
npm run build
```

当前验证状态：

- 前端 TypeScript + Vite 构建通过。
- 运行代码中已移除旧 Express `/api`、`localhost:5000` 和后端 proxy 依赖。
- Docker Compose 只部署前端容器。

构建时可能出现 Vite 大包 warning 和 Browserslist 数据过期提示，不影响运行。

## 文档说明

- 当前入口文档：`README.md`、`QUICK_REFERENCE.md`、`server/supabase/README.md`。
- 迁移状态与历史文档索引：`HISTORICAL_DOCS.md`。
- 旧的 MySQL、Express、JWT、GHCR server 镜像、Dockerfile 修复报告等文档仅作为归档材料，不能作为当前部署依据。

## 许可证

MIT License
