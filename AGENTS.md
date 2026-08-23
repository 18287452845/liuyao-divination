# AGENTS.md

Guidance for ZCode agents working in this repository. `README.md` (Chinese) is the authoritative architecture doc; this file summarizes what agents need before editing.

## Project Purpose

Traditional Chinese divination web app: Liuyao (六爻) hexagram casting, Bazi (八字) four-pillar charts, AI interpretation via DeepSeek (streaming + follow-up chat), history records, and an admin console (users/roles/permissions/invite codes/logs/sessions).

## Architecture: full-stack local Docker (Express + MySQL)

The app was briefly migrated to Supabase and has been **migrated back** (2026-08). Everything runs on the local server via Docker Compose — no external BaaS:

- Frontend: React 18 + TypeScript + Vite + Tailwind + React Router v6 (dev port 3000, `/api` proxy → 5000)
- Backend: Node 20 + Express + TypeScript (`server/src`, port 5000) — generates hexagrams server-side, streams DeepSeek AI via SSE
- Database: MySQL 5.7, init scripts in `server/sql/` (run by the `db-init` compose service; non-destructive by default — only initializes an empty database, `DB_RESET_ON_STARTUP=true` forces rebuild)
- Auth: custom JWT (access + refresh, `server/src/utils/jwt.ts`, `tokenBlacklist.ts`) + RBAC tables (`roles`, `permissions`, `user_roles`, `role_permissions`); tokens in localStorage, axios interceptors in `client/src/utils/tokenRefresh.ts` auto-refresh on 401
- Nginx serves the built frontend and proxies `/api` to the server container (SSE enabled: `proxy_buffering off`, 300s timeouts)

**Supabase is fully removed** — do not reintroduce `@supabase/supabase-js`, `VITE_SUPABASE_*` vars, Edge Functions, or the `client/src/domain/` engine copy. Divination/Bazi generation happens **server-side** (`server/src/utils/liuyao.ts`, `bazi.ts`); the client only renders.

## Commands

```bash
npm run install:all      # root + client + server deps
npm run dev              # client (3000) + server (5000) via concurrently
npm run build            # builds client AND server (tsc strict)
npm run test:liuyao      # server tests: liuyao engine (node --test) + AI chat protocol (tsx)
```

CI (`.github/workflows/build-and-push-ghcr.yml`) runs `test:liuyao` + `build` on Node 20, then pushes client & server images to GHCR. Keep both green. Vite chunk-size and Browserslist warnings are non-blocking.

Local server dev needs `server/.env` (copy `server/.env.example`) and a reachable MySQL.

## Repository Layout

```
client/src/
  utils/api.ts           axios client + divinationApi + analyzeGuaStream/chatGuaStream (SSE)
  utils/baziApi.ts       baziApi + analyzeBaziStream/chatBaziStream
  services/api.ts        authApi/userApi/roleApi (admin pages)
  contexts/AuthContext.tsx  JWT auth state, hasPermission/hasRole/isAdmin
  utils/tokenRefresh.ts  fetchWithAutoRefresh + 401 auto-refresh
  utils/textNormalize.ts mojibake compatibility map for legacy data
  pages/                 Liuyao: Divination→Paidian→Jiegua; Bazi: Input→Display→AiAnalysis→History
  pages/admin/           Dashboard, users, roles, sessions, invites, login logs
server/src/
  index.ts               Express app, CORS, /api/health, static serving
  routes/index.ts        central route table (all /api/* routes)
  routes/baziRoutes.ts   /api/bazi/* including ai/analyze + ai/chat
  models/database.ts     mysql2 pool + query helpers + DivinationRecordModel (user-scoped)
  middleware/auth.ts     authenticate + requirePermissions/requireRoles (req.user = {userId, roles, permissions})
  controllers/           auth, divination, ai, aiController.bazi, bazi, apiKey, user, role, session, security, invite, audit, log, tools
  utils/liuyao.ts        hexagram generation + decorateGua + traditionalAnalysis (structured judgement)
  utils/bazi.ts          four pillars, ten gods, dayun
  utils/aiPrompt.ts      AI chat protocol: validateAiRequest, buildDeepSeekMessages, stream filter (shared by tests + AI controllers)
  utils/aiOutputSanitizer.ts  strips AI disclaimers/identity preambles from output
server/sql/              MySQL schema + seed (00_init_complete.sql → 02_bazi_tables.sql)
server/tests/            liuyao.test.js + analyze-ai-chat.test.ts
```

## Key Facts for Edits

- **AI endpoints** (all SSE, `data: {"content":"..."}` → `data: [DONE]`):
  - `POST /api/ai/analyze` + `/api/ai/chat` (gua; chat loads the record server-side, user-scoped)
  - `POST /api/bazi/ai/analyze` + `/api/bazi/ai/chat`
  - User's personal DeepSeek key (`users.deepseek_api_key`) takes precedence over `DEEPSEEK_API_KEY` env
  - The AI must follow the structured `decoration.traditionalAnalysis` judgement; AI is not the source of divination logic
- **Hexagram data is JSON in MySQL**: `divination_records.ben_gua/bian_gua/decoration/ai_analysis`, `bazi_records.bazi_data/dayun_data`. Parse JSON on the backend (`buildNormalizedRecord`); prefer adding fields over changing shapes.
- **User isolation**: every records query filters by `user_id` from `req.user.userId`; admin pages go through `requirePermissions`.
- **Permission strings are literal codes** (`divination:create`, `bazi:aiAnalysis`, `user:edit`...); check them exactly.
- **AI chat protocol** lives in `server/src/utils/aiPrompt.ts` — question/history limits, message sanitization, disclaimer stripping. `server/tests/analyze-ai-chat.test.ts` pins this contract; update both together.

## Environment

Root `.env` (from `.env.example`) drives Docker Compose: `MYSQL_*`, `JWT_SECRET`, `DEEPSEEK_API_KEY/URL/MODEL`, `DB_RESET_ON_STARTUP` (keep `false` in production — `true` drops the database), `CLIENT_HTTP_PORT`. Server dev config lives in `server/.env`.

## Gotchas

- **UTF-8 / mojibake**: all Chinese content must be clean UTF-8. `normalizeLegacyText`/`textNormalize.ts` repairs historical mojibake — keep it working.
- **Bazi serialization**: `lunarDate`/`solarDate` from lunar-javascript are not JSON-serializable; `baziController` strips them before storing (`serializableDecorated`).
- **`teaching-docs/`** is an untracked nested git repo — don't commit or modify it as part of app work.
- Default seed accounts: `admin/admin123`, `testuser/test123` — must be changed in production.
- Many root-level `*_FIX.md` / `BAZI_*.md` reports are historical archives (including Supabase-era docs); don't treat them as current.

## Deployment

- `docker compose up -d --build` — full stack (mysql + db-init + server + client) on the local server.
- `docker-compose.ghcr.yml` — same topology using prebuilt GHCR images.
- GitHub Actions: `build-and-push-ghcr.yml` (validate → build/push client & server images), `deploy-ghcr.yml` (deploy after build).
