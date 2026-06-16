# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a traditional Chinese divination system combining Liuyao (六爻), Bazi (八字), and AI-powered interpretation through the DeepSeek API.

Core product areas:
- Liuyao divination: time-based, number-based, manual coin-tossing, and manual line input.
- Traditional Liuyao rule judgement: structured analysis based on yongshen, month/day strength, moving lines, fu shen, shi-ying, and timing hints.
- Bazi chart calculation: four pillars, ten gods, five-element analysis, shensha, and dayun.
- AI analysis: DeepSeek-backed streaming interpretation for Liuyao and Bazi.
- Auth/admin: JWT authentication, RBAC permissions, sessions, audit logs, invite codes, and user API key settings.

Tech stack:
- Frontend: React 18, TypeScript, Vite, Tailwind CSS, React Router v6
- Backend: Node.js, Express, TypeScript
- Database: MySQL 5.7+
- Auth: JWT with bcrypt password hashing
- AI: DeepSeek API, streamed with SSE

## Development Commands

Install dependencies:
```bash
npm run install:all
```

Run development servers:
```bash
npm run dev
```

Run separately:
```bash
cd client && npm run dev
cd server && npm run dev
```

Build:
```bash
npm run build
cd client && npm run build
cd server && npm run build
```

Database verification:
```bash
cd server && npm run verify:db
```

Docker database setup:
```bash
docker-compose up -d mysql db-init
docker-compose logs db-init
```

Default local ports:
- Frontend dev server: `3000`
- Backend API server: `5000`
- Frontend proxy: `/api` -> `http://localhost:5000`

Default test users from SQL init data:
- Admin: `admin` / `admin123`
- User: `testuser` / `test123`

Change these immediately in production.

## Repository Structure

```text
.
├── client/                 React frontend
├── server/                 Express backend
├── server/sql/             MySQL schema and seed scripts
├── doc/                    Project documentation
├── docker-compose.yml      Local Docker deployment
├── nginx.conf              Frontend reverse proxy config
└── package.json            Root scripts, including concurrently dev mode
```

## Frontend Architecture

Important files:
- `client/src/App.tsx`: main route table and protected/admin route wiring.
- `client/src/contexts/AuthContext.tsx`: auth state, login/register/logout, permission helpers.
- `client/src/utils/api.ts`: Liuyao API client and streaming AI helper.
- `client/src/utils/baziApi.ts`: Bazi API client and streaming AI helper.
- `client/src/types/index.ts`: Liuyao frontend types.
- `client/src/types/bazi.ts`: Bazi frontend types.

Main pages:
- `DivinationPage.tsx`: Liuyao creation form, including divination method and question category.
- `PaidianPage.tsx`: Liuyao chart display, traditional rule judgement, gua/yao text, timing hints.
- `JieguaPage.tsx`: AI Liuyao interpretation page.
- `HistoryPage.tsx`: Liuyao history.
- `BaziInputPage.tsx`: Bazi input.
- `BaziDisplayPage.tsx`: Bazi chart display.
- `BaziAiAnalysisPage.tsx`: AI Bazi analysis.
- `BaziHistoryPage.tsx`: Bazi history.
- `ToolsPage.tsx`: utilities.
- `ApiKeySettingsPage.tsx`: user-level DeepSeek API key management.

Admin pages live in `client/src/pages/admin/`.

## Backend Architecture

Important files:
- `server/src/index.ts`: Express setup, JSON parsing, CORS, routes, health check, DB initialization.
- `server/src/routes/index.ts`: central API route table.
- `server/src/routes/baziRoutes.ts`: Bazi route table.
- `server/src/models/database.ts`: MySQL connection pool and legacy Liuyao models.
- `server/src/middleware/auth.ts`: JWT authentication and RBAC checks.
- `server/src/middleware/normalizeResponse.ts`: legacy text normalization wrapper.
- `server/src/utils/textNormalize.ts`: compatibility map for historical mojibake strings.

Main controllers:
- `authController.ts`
- `divinationController.ts`
- `aiController.ts`
- `baziController.ts`
- `aiController.bazi.ts`
- `apiKeyController.ts`
- `userController.ts`
- `roleController.ts`
- `sessionController.ts`
- `securityController.ts`
- `inviteController.ts`
- `auditController.ts`
- `toolsController.ts`

Route categories:
- `/api/auth/*`
- `/api/divination/*`
- `/api/records/*`
- `/api/ai/*`
- `/api/bazi/*`
- `/api/tools/*`
- `/api/user/api-key/*`
- `/api/users/*`, `/api/roles/*`, `/api/permissions/*`
- `/api/logs/*`, `/api/sessions/*`, `/api/security/*`
- `/api/invite-codes/*`, `/api/audit-logs/*`

Most routes require `authenticate`; admin routes additionally require permissions or admin role checks.

## Liuyao Core

Primary files:
- `server/src/utils/liuyao.ts`: hexagram generation, decoration, moving lines, advanced Liuyao attributes.
- `server/src/utils/bagong.ts`: Eight Palace system, gua palace, shi-ying positions.
- `server/src/utils/constants.ts`: traditional mapping tables.
- `server/src/utils/liuyaoAnalysis.ts`: structured traditional Liuyao rule judgement.

Generation flow in `liuyao.ts`:
1. Generate basic hexagram from method: time, number, manual coin results, or manual input.
2. Apply Najia (纳甲), Earth Branches (地支), Five Elements (五行).
3. Calculate Six Relatives (六亲), Six Spirits (六神), and Shi-Ying (世应).
4. Generate changing hexagram if any line moves.
5. Calculate Kong Wang (空亡), line strength, moving-line transformations, yao relations, Fu Shen (伏神), and timing hints.

Traditional judgement flow in `liuyaoAnalysis.ts`:
1. Infer or receive question category.
2. Select yongshen (用神).
3. Score yongshen by month/day, movement, kong wang, and transformations.
4. Identify yuan shen, ji shen, chou shen, and same-element helpers.
5. Analyze moving lines and their effect on yongshen.
6. Analyze shi-ying relationship.
7. Build timing hints.
8. Return `traditionalAnalysis` with final tendency, confidence, score, and reasoning steps.

`divinationController.ts` stores the traditional judgement under `decoration.traditionalAnalysis`.

AI prompt construction in `aiController.ts` includes this structured judgement and instructs the model to follow it rather than freely inventing a conclusion.

## Bazi Core

Primary files:
- `server/src/utils/bazi.ts`
- `server/src/utils/baziConstants.ts`
- `server/src/types/bazi.ts`
- `server/src/controllers/baziController.ts`
- `server/src/controllers/aiController.bazi.ts`

Bazi flow:
1. Convert birth datetime with `lunar-javascript`.
2. Calculate year, month, day, and hour pillars.
3. Determine day master.
4. Calculate ten gods and five-element distribution.
5. Analyze relations, shensha, kong wang, and dayun.
6. Save record to `bazi_records`.
7. Stream AI analysis through `/api/bazi/ai/analyze`.

## Database Notes

Important SQL files:
- `server/sql/00_init_complete.sql`: main schema.
- `server/sql/01_init_data.sql`: seed data.
- `server/sql/02_bazi_tables.sql`: Bazi tables and permissions.
- `server/sql/04_insert_gua_data.sql`
- `server/sql/05_insert_gua_texts_part1.sql`
- `server/sql/05_insert_gua_texts_part2.sql`

Main tables:
- `divination_records`
- `bazi_records`
- `users`
- `roles`
- `permissions`
- `user_roles`
- `role_permissions`
- `user_sessions`
- `token_blacklist`
- `invite_codes`
- `login_logs`
- `operation_logs`
- `audit_logs`
- `trigrams`
- `gua_data`

JSON storage:
- Liuyao records store `ben_gua`, `bian_gua`, `decoration`, and `ai_analysis`.
- Bazi records store `bazi_data`, `dayun_data`, and AI analysis fields.

Important caveat:
- Bazi records are explicitly queried by `user_id`.
- The Liuyao schema has `user_id`, but the current legacy `DivinationRecordModel` path may not fully enforce user isolation everywhere. Be careful when modifying records APIs.

## Authentication and Authorization

Auth flow:
1. Login returns access and refresh tokens.
2. Frontend stores tokens in `localStorage`.
3. Axios/fetch helpers attach `Authorization: Bearer <token>`.
4. Backend `authenticate` loads user roles and permissions.
5. `requirePermissions(...)` and `requireRoles(...)` enforce access.

Permission examples:
- `divination:create`
- `divination:view`
- `divination:delete`
- `divination:aiAnalysis`
- `bazi:create`
- `bazi:view`
- `bazi:delete`
- `bazi:aiAnalysis`
- `user:view`, `user:create`, `user:edit`, `user:delete`
- `role:view`, `role:create`, `role:edit`, `role:delete`
- `session:view`, `session:manage`
- `invite:*`
- `audit:*`

## AI Integration

Liuyao AI:
- Frontend: `analyzeGuaStream` in `client/src/utils/api.ts`
- Backend: `analyzeGua` in `server/src/controllers/aiController.ts`
- Endpoint: `POST /api/ai/analyze`

Bazi AI:
- Frontend: `analyzeBaziStream` in `client/src/utils/baziApi.ts`
- Backend: `analyzeBazi` in `server/src/controllers/aiController.bazi.ts`
- Endpoint: `POST /api/bazi/ai/analyze`

Both use SSE-style streamed responses:
```text
data: {"content":"..."}

data: [DONE]
```

DeepSeek configuration:
```env
DEEPSEEK_API_KEY=sk-your-key
DEEPSEEK_API_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
```

User-level API keys can override the system key.

## Environment Configuration

Create `server/.env` from `server/.env.example`.

Typical local values:
```env
PORT=5000
HOST=0.0.0.0

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=123456
DB_NAME=liuyao_db

JWT_SECRET=replace-with-strong-random-secret
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

DEEPSEEK_API_KEY=sk-your-key
DEEPSEEK_API_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
```

Docker uses service host `mysql`, not `localhost`, inside containers.

## Development Guidelines

When changing Liuyao:
- Keep `Gua`, `GuaDecoration`, and stored JSON compatibility in mind.
- Prefer adding new fields to `decoration` rather than changing existing field shapes.
- If modifying traditional rules, keep outputs structured and explainable.
- AI should consume structured judgement; it should not be the source of core divination logic.

When changing Bazi:
- Keep API response fields in camelCase on the frontend.
- Avoid circular references in JSON stored to `bazi_records`.
- Re-check dayun direction and qiyun calculations after touching gender/year-stem logic.

When changing auth:
- Verify both frontend route protection and backend middleware checks.
- Check permission strings exactly; many routes depend on literal permission codes.

When changing database queries:
- Use parameterized queries.
- Parse JSON fields on the backend before sending to the frontend.
- Be especially careful about user data isolation.

When changing Chinese text:
- Use UTF-8.
- Avoid introducing mojibake strings.
- Keep `textNormalize.ts` compatibility unless migrating all legacy data and constants at once.

## Manual Testing Checklist

Basic Liuyao flow:
1. Start app with `npm run dev`.
2. Log in as admin or test user.
3. Create Liuyao divination with each method.
4. Confirm Paidian page shows gua, moving lines, decoration, timing hints, and traditional judgement.
5. Run AI analysis and confirm streamed response completes.
6. Confirm record appears in history.

Basic Bazi flow:
1. Open `/bazi`.
2. Create a Bazi record.
3. Confirm four pillars, ten gods, five-element analysis, shensha, kong wang, and dayun display.
4. Run AI analysis.
5. Confirm record appears in Bazi history.

Admin flow:
1. Open `/admin`.
2. Verify users, roles, sessions, invite codes, and logs load for admin.
3. Confirm non-admin users cannot access admin routes.

API smoke tests:
```bash
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
```

Use the returned JWT for protected endpoints.

## Build and Verification

Before handing off code changes, run:
```bash
npm run build
```

Expected non-blocking warnings may include:
- Vite chunk size over 500 KB.
- Browserslist/caniuse-lite data is outdated.

These warnings are currently not build failures.

## Security Notes

Production checklist:
- Change default admin and test passwords.
- Use a strong `JWT_SECRET`.
- Do not commit `.env` files.
- Restrict production CORS origins.
- Use HTTPS.
- Do not expose MySQL publicly.
- Rotate and protect DeepSeek API keys.
- Keep user API keys encrypted or otherwise protected at rest.
- Clean expired sessions and token blacklist records.

## Documentation References

Useful local docs:
- `README.md`
- `doc/PROJECT_DOCUMENTATION.md`
- `doc/QUICKSTART.md`
- `doc/DEPLOYMENT.md`
- `doc/QUICK_REFERENCE.md`
- `server/sql/README.md`
- `server/docs/DB_AUTO_REPAIR_USAGE.md`

Deployment docs:
- `GHCR_DEPLOYMENT_GUIDE.md`
- `GHCR_QUICKSTART.md`
- `docker-compose.yml`
- `docker-compose.ghcr.yml`

## Current Implementation Notes

Recent notable implementation areas:
- Full JWT/RBAC auth system.
- Admin dashboard and management pages.
- Session, audit, login, invite-code, and security features.
- Bazi calculation and AI analysis.
- Liuyao traditional rule judgement in `server/src/utils/liuyaoAnalysis.ts`.
- Rule-guided AI prompt for Liuyao interpretation.

Known technical debt:
- Some historical source files and SQL comments contain mojibake text. There is a normalization layer for responses, but a full encoding cleanup should be planned carefully.
- Liuyao record user isolation should be audited if multi-user privacy is a priority.
- Frontend bundle size is above Vite's default warning threshold.
