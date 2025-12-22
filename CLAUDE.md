# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a traditional Chinese Liuyao (六爻) divination system combining modern web technologies with AI-powered interpretation. The system provides three divination methods (time-based, number-based, manual coin-tossing simulation), generates complete hexagram layouts, and integrates with DeepSeek API for intelligent analysis.

**Tech Stack:**
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS + React Router v6
- Backend: Node.js + Express + TypeScript
- Database: MySQL 5.7+
- Authentication: JWT-based auth with bcrypt password hashing
- AI: DeepSeek API for hexagram interpretation

## Development Commands

### Installation
```bash
# Install all dependencies (root + client + server)
npm run install:all

# Or install separately
npm install                    # Root dependencies
cd client && npm install       # Frontend dependencies
cd server && npm install       # Backend dependencies
```

### Running the Application
```bash
# Development mode (runs both frontend and backend concurrently)
npm run dev                    # From root directory

# Or run separately
cd client && npm run dev       # Frontend only (port 3000)
cd server && npm run dev       # Backend only (port 5000)
```

### Building
```bash
# Build frontend
cd client && npm run build

# Build backend
cd server && npm run build
```

### Database Setup

**Using Docker (Recommended):**
```bash
# Start MySQL and auto-initialize database
docker-compose up -d mysql db-init

# Check initialization status
docker-compose logs db-init
```

**Manual Setup:**
```bash
# MySQL initialization (Windows)
cd server && setup_mysql.bat

# MySQL initialization (Unix/Mac)
cd server && chmod +x setup_mysql.sh && ./setup_mysql.sh

# Or manually run SQL files in order
mysql -u root -p < server/sql/00_init_complete.sql
mysql -u root -p < server/sql/01_init_data.sql
```

**Note:** Ensure the MySQL service or Docker container is healthy before starting the backend. The database includes authentication, permissions, user management, and admin features.

## Architecture

### Monorepo Structure
```
lt/
├── client/              # React frontend (Vite + TypeScript)
├── server/              # Express backend (TypeScript)
└── package.json         # Root config with concurrently for dev
```

### Core Algorithm Flow

**Divination Generation (`server/src/utils/liuyao.ts`):**
1. Generate hexagram based on method (time/number/manual)
2. Apply Najia (纳甲) - heavenly stems assignment
3. Apply Earth Branches (地支) - twelve branches
4. Calculate Five Elements (五行) based on earth branches
5. Determine Six Relatives (六亲) - relationship to hexagram palace
6. Assign Six Spirits (六神) - based on day's earth branch
7. Mark Shi-Ying (世应) positions using eight palace system (`bagong.ts`)
8. Generate changing hexagram if moving lines exist
9. Calculate advanced features:
   - Kong Wang (空亡) - void positions
   - Yao States (爻位旺衰) - line prosperity/decline
   - Change Analyses (化爻分析) - transformation analysis
   - Yao Relations (爻位关系) - six harmonies/clashes
   - Fu Shen (伏神) - hidden spirits

**Eight Palace System (`server/src/utils/bagong.ts`):**
- Each of 8 trigrams has a "palace" (宫) with 8 related hexagrams
- Determines Shi (世) and Ying (应) positions
- Critical for Six Relatives calculation

### Database Schema

**Main Tables:**
- `divination_records` - Stores complete hexagram records with JSON fields for:
  - `ben_gua` (original hexagram)
  - `bian_gua` (changing hexagram)
  - `decoration` (all hexagram attributes)
  - `ai_analysis` (AI interpretation text)
  - `user_id` (user data isolation)
  - Verification feedback fields (`is_verified`, `actual_result`, `accuracy_rating`, etc.)

**Authentication & Authorization Tables:**
- `users` - User accounts with password hashing, status, API keys, login security
- `roles` - Role-based access control (RBAC)
- `permissions` - Granular permissions system
- `user_roles` - Many-to-many user-role relationships
- `role_permissions` - Many-to-many role-permission relationships

**Supporting Tables:**
- `trigrams` - Eight basic trigrams reference data
- `gua_data` - 64 hexagrams with names and traditional texts
- `login_logs` - User login history and security tracking
- `operation_logs` - User activity audit trail
- `user_sessions` - Active session management
- `invite_codes` - Invitation code system for user registration
- `audit_logs` - Comprehensive system audit logs

**Important:** Hexagram data is stored as JSON to preserve complex nested structures. When querying, parse JSON fields on the backend before sending to frontend.

### Frontend Architecture

**Page Components (`client/src/pages/`):**
- `LoginPage.tsx` - User authentication page
- `DivinationPage.tsx` - Main divination interface with method selection
- `PaidianPage.tsx` - Hexagram display page (排盘 = layout/arrangement)
- `JieguaPage.tsx` - AI interpretation page (解卦 = interpretation)
- `HistoryPage.tsx` - Historical records browser
- `ToolsPage.tsx` - Various utilities (calendar conversion, branch relations, etc.)
- `ApiKeySettingsPage.tsx` - User's personal DeepSeek API key management
- `ChangePasswordPage.tsx` - Password change functionality

**Admin Pages (`client/src/pages/admin/`):**
- `DashboardPage.tsx` - Admin dashboard with statistics
- `UserManagementPage.tsx` - User CRUD operations
- `RoleManagementPage.tsx` - Role and permission management
- `LoginLogsPage.tsx` - Login history and security monitoring
- `SessionManagementPage.tsx` - Active session management
- `InviteManagementPage.tsx` - Invitation code management

**Routing:** Uses React Router v6. Main routes configured in `App.tsx`:
- Public route: `/login`
- Protected routes (require authentication): All other pages
- Admin routes (require admin permissions): `/admin/*`

**Authentication Flow:**
1. User logs in via LoginPage → JWT token stored in localStorage
2. `AuthContext` provides authentication state globally
3. `ProtectedRoute` component guards authenticated routes
4. `authenticate` middleware on backend validates JWT tokens
5. `requirePermissions` and `requireRoles` middleware enforce authorization

**Data Flow:**
1. User performs divination → POST `/api/divination`
2. Backend generates complete hexagram with all attributes
3. Navigate to PaidianPage to display hexagram
4. User clicks "AI Analysis" → POST `/api/ai/analyze` (SSE stream)
5. Save to history → available in HistoryPage

### Backend Architecture

**Route Organization (`server/src/routes/index.ts`):**
All API routes are centrally defined and protected by authentication/authorization middleware:

**Route Categories:**
- `/api/auth/*` - Authentication (login, register, logout, change password)
- `/api/divination/*` - Divination operations (create, simulate)
- `/api/records/*` - Record management (CRUD, verification feedback)
- `/api/ai/*` - AI analysis (streaming SSE)
- `/api/tools/*` - Utility functions (calendar, branch relations, gua lookup)
- `/api/users/*` - User management (admin only)
- `/api/roles/*` - Role management (admin only)
- `/api/permissions/*` - Permission management (admin only)
- `/api/logs/*` - Log viewing and export (admin only)
- `/api/sessions/*` - Session management
- `/api/security/*` - Security operations (2FA, account locking)
- `/api/invite-codes/*` - Invitation code management (admin only)
- `/api/audit-logs/*` - Audit log viewing (admin only)
- `/api/user/api-key/*` - Personal API key management

**Middleware Stack:**
1. `authenticate` - Validates JWT token, attaches `req.user`
2. `requirePermissions(['permission:action'])` - Checks user has specific permissions
3. `requireRoles(['roleName'])` - Checks user has specific roles
4. Controllers execute business logic
5. Responses sent to client

**Controllers (`server/src/controllers/`):**
- `authController.ts` - Authentication and user profile
- `divinationController.ts` - Divination logic and records
- `aiController.ts` - AI analysis with SSE streaming
- `userController.ts` - User CRUD operations
- `roleController.ts` - Role and permission management
- `logController.ts` - Login and operation logs
- `sessionController.ts` - Session management
- `securityController.ts` - Security features
- `inviteController.ts` - Invitation code system
- `auditController.ts` - Audit logging
- `toolsController.ts` - Utility functions

## Environment Configuration

### Required: DeepSeek API Key

Create `server/.env` from `server/.env.example`:
```env
# DeepSeek API Configuration (Required)
DEEPSEEK_API_KEY=sk-your-actual-key-here
DEEPSEEK_API_URL=https://api.deepseek.com

# JWT Configuration (Required for Authentication)
JWT_SECRET=your-secure-random-secret-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
```

**Getting a key:** See `DEEPSEEK_CONFIG.md` for detailed instructions.

**Note:** Users can optionally configure their own DeepSeek API keys via the API Settings page, which takes precedence over the system default key.

### Database Configuration

Configure MySQL credentials (Docker Compose exposes the `mysql` host by default):
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=123456
DB_NAME=liuyao_db
```

## Key Technical Concepts

### Authentication & Authorization

**JWT-Based Authentication:**
- Login generates access token (default 7 days) and refresh token (default 30 days)
- Tokens stored in localStorage on frontend
- Backend middleware (`authenticate`) validates tokens on protected routes

**Role-Based Access Control (RBAC):**
- Three-tier permission model: Users → Roles → Permissions
- Middleware functions: `requirePermissions(['permission:action'])`, `requireRoles(['roleName'])`
- Default roles: Admin (full access), User (basic divination access)
- Granular permissions for divination, users, roles, logs, sessions, etc.

**Permission Categories:**
- `divination:*` - Divination operations (create, view, delete, aiAnalysis)
- `user:*` - User management (view, create, edit, delete, status)
- `role:*` - Role management (view, create, edit, delete, assignPermission)
- `permission:*` - Permission viewing
- `log:*` - Log management (viewLogin, viewOperation, delete, export)
- `session:*` - Session management (view, manage)
- `security:*` - Security operations (view, lockUnlock, forcePasswordReset, auditReport)
- `invite:*` - Invite code management
- `audit:*` - Audit log operations

**User Data Isolation:**
- Regular users can only access their own divination records
- Admins can access all records
- Implemented via `user_id` field in `divination_records` table

### Najia (纳甲) System
Traditional method of assigning heavenly stems to hexagram lines:
- 乾 (Qian): Inner lines → 甲, Outer lines → 壬
- 坤 (Kun): Inner lines → 乙, Outer lines → 癸
- Other six trigrams: Same stem for all six lines

See `server/src/utils/constants.ts` for complete mapping tables.

### Six Relatives (六亲) Calculation
Determined by relationship between line's Five Element and hexagram palace's Five Element:
- Same element → Brothers (兄弟)
- Element that palace generates → Children (子孙)
- Element that palace is generated by → Parents (父母)
- Element that palace controls → Wife/Wealth (妻财)
- Element that controls palace → Officials/Ghosts (官鬼)

**Implementation:** `calculateSixRelatives()` in `liuyao.ts`

### Moving Lines (动爻)
- Old Yang (老阳 9) → Changes to Yin
- Old Yin (老阴 6) → Changes to Yang
- Young Yang/Yin don't change
- Moving lines are marked in `changes` array

### AI Analysis Integration

**Streaming Response:** Uses Server-Sent Events (SSE)
```typescript
// Backend (aiController.ts)
res.setHeader('Content-Type', 'text/event-stream');
// Stream chunks as they arrive from DeepSeek

// Frontend (JieguaPage.tsx)
const eventSource = new EventSource(url);
eventSource.onmessage = (event) => {
  // Append chunks to display
};
```

**Prompt Construction:** AI receives complete hexagram context including all attributes, moving lines, and traditional interpretations when available.

## Common Development Tasks

### Adding a New Divination Method

1. Update type: `client/src/types/index.ts`
   ```typescript
   export type DivinationMethod = 'time' | 'number' | 'manual' | 'newmethod';
   ```

2. Implement algorithm: `server/src/utils/liuyao.ts`
   ```typescript
   export function newMethodDivination(params): Gua { /* ... */ }
   ```

3. Add controller handler: `server/src/controllers/divinationController.ts`
   ```typescript
   case 'newmethod':
     result = newMethodDivination(req.body.methodParams);
     break;
   ```

4. Add UI: `client/src/pages/DivinationPage.tsx`

### Modifying Hexagram Attributes

Core decoration logic is in `decorateGua()` function in `liuyao.ts`. This function:
- Takes a basic hexagram (lines only)
- Adds all traditional attributes (Najia, branches, elements, etc.)
- Returns complete `GuaDecoration` object

**When modifying:** Ensure changes maintain compatibility with JSON storage schema in database.

### Working with Traditional Chinese Elements

All constant mappings are centralized in `server/src/utils/constants.ts`:
- `TRIGRAMS` - Eight trigrams with symbols and elements
- `GUA_NAMES` - 64 hexagram names
- `NAJIA` - Heavenly stem assignments
- `EARTH_BRANCHES` - Earthly branch assignments
- `FIVE_ELEMENTS` - Element mappings for branches
- `SIX_RELATIVES_MAP` - Relative relationships between elements
- `SIX_SPIRITS` - Spirit sequence for days
- `KONG_WANG_MAP` - Void calculation table
- `LIU_HE` / `LIU_CHONG` - Six harmonies/clashes
- `SAN_HE` / `BRANCH_SAN_HE` - Three harmonies

**Reference:** `server/src/utils/najia_reference.md` contains traditional reference material.

## Admin Features

The system includes comprehensive admin functionality accessible at `/admin`:

**User Management:**
- Create, edit, delete users
- Enable/disable user accounts
- Reset user passwords
- View user details and roles

**Role & Permission Management:**
- Create custom roles with specific permissions
- Assign permissions to roles
- Assign roles to users
- Enable/disable roles

**Session Management:**
- View all active sessions across users
- Invalidate specific sessions
- Force logout users
- Session statistics and monitoring

**Login & Activity Logs:**
- View login history with IP addresses and user agents
- Track user operations (create, update, delete actions)
- Export logs for audit purposes
- Filter and search log entries

**Invite Code System:**
- Generate invitation codes for user registration
- Set usage limits and expiration dates
- Track invite code usage
- Batch create codes

**Security Features:**
- Failed login attempt tracking
- Account lockout after multiple failures
- Password change enforcement
- API key management (system and user-level)

## Deployment

**Docker Deployment (Recommended):**
```bash
# 1. Configure environment
cp .env.example .env
# Edit .env: Set JWT_SECRET, MYSQL passwords, DEEPSEEK_API_KEY

# 2. Start all services
docker-compose up -d

# 3. Check logs
docker-compose logs -f

# Access: http://localhost (frontend) and http://localhost:5000 (backend)
```

See `DOCKER_DEPLOYMENT.md` and `doc/DEPLOYMENT.md` for detailed deployment instructions.

## Testing

### Test Data
Database initialization includes default admin user and test data:
```bash
# Default admin credentials (for testing only - change in production!)
Username: admin
Password: admin123

# Regular test user
Username: testuser
Password: test123
```

**IMPORTANT:** Change default passwords immediately in production environments.

### Manual Testing Flow
1. Start development servers: `npm run dev`
2. Navigate to http://localhost:3000/login
3. Log in with test credentials
4. Perform divination using any method
5. Verify hexagram display shows all attributes correctly
6. Test AI analysis (requires valid DeepSeek API key)
7. Check history page for saved records
8. (Admin only) Access `/admin` to test admin features

### API Testing
Use tools like Postman or curl:
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Create divination (requires JWT token)
curl -X POST http://localhost:5000/api/divination \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"question":"Test","method":"time"}'

# Get records
curl http://localhost:5000/api/records \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Simulate coin toss
curl http://localhost:5000/api/divination/simulate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Important Notes

### Chinese Character Encoding
- Database uses `utf8mb4` character set
- All API responses are UTF-8
- Ensure your editor uses UTF-8 encoding when editing Chinese content

### Type Safety
The project uses TypeScript strictly. Key interfaces:
- `Gua` - Basic hexagram structure
- `GuaDecoration` - Complete hexagram with all attributes
- `YaoState`, `ChangeAnalysis`, `YaoRelation`, `FuShen` - Advanced features

**Location:** All types defined in respective utility files and imported where needed.

### Frontend Styling
Uses Tailwind CSS with traditional Chinese color scheme:
- Primary: Red tones (朱红)
- Secondary: Green tones (墨绿)
- Accent: Gold (金色)

Custom colors configured in `client/tailwind.config.js`.

## Security Best Practices

### Production Deployment Checklist
1. **Change default passwords** immediately:
   - Default admin password (`admin123`)
   - MySQL root password
   - All test user passwords

2. **Generate strong JWT secret**:
   ```bash
   # Generate a random 64-character secret
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
   Set in `.env`: `JWT_SECRET=your-generated-secret`

3. **Secure environment variables**:
   - Never commit `.env` files to version control
   - Use different secrets for dev/staging/production
   - Restrict `.env` file permissions: `chmod 600 .env`

4. **Database security**:
   - Use strong MySQL passwords
   - Don't expose MySQL port publicly (Docker: remove port mapping in production)
   - Regular backups of `liuyao_db`
   - Enable MySQL audit logging for sensitive operations

5. **API key protection**:
   - Store DeepSeek API keys encrypted in database
   - Don't expose API keys in client-side code
   - Monitor API usage and set rate limits

6. **Session management**:
   - Regularly clean expired sessions
   - Implement session timeout
   - Use HTTPS in production (prevents token interception)

7. **Input validation**:
   - Backend validates all inputs (already implemented)
   - Frontend provides additional UX validation
   - Sanitize user-generated content to prevent XSS

8. **CORS configuration**:
   - Restrict allowed origins in production
   - Don't use `*` wildcard for CORS
   - Configure in `server/src/index.ts`

### Login Security Features
- Failed login attempt tracking (max 5 attempts)
- Account lockout after excessive failures (30 minutes)
- Login history with IP and user agent tracking
- Session invalidation on password change
- Force logout capabilities for admins

## Troubleshooting

### Authentication Issues
**Problem:** "Invalid token" or "Token expired" errors
**Solutions:**
1. Check JWT token is being sent in Authorization header: `Bearer YOUR_TOKEN`
2. Verify JWT_SECRET matches between .env and what was used to generate tokens
3. Token may have expired - try logging in again
4. Clear localStorage and re-login if token is corrupted

**Problem:** "Insufficient permissions"
**Solutions:**
1. Check user's role has required permissions in database
2. Verify permission strings match exactly (e.g., `divination:create`)
3. Admin operations require both authentication AND admin permissions

### Port Already in Use
Default ports: 3000 (frontend), 5000 (backend)

Change in:
- Frontend: `client/vite.config.ts` → `server.port`
- Backend: `server/.env` → `PORT=5001`

### MySQL Connection Issues
Check:
1. MySQL service is running (or Docker container: `docker-compose ps mysql`)
2. Credentials in `.env` match your MySQL setup
3. Database `liuyao_db` exists (created by init script)
4. Character set is `utf8mb4`
5. Container logs show `ready for connections`: `docker-compose logs mysql`
6. Network connectivity between backend and MySQL (Docker: use host `mysql`, not `localhost`)

### Database Initialization Issues
**Problem:** Tables not created or missing data
**Solutions:**
1. Check if `00_init_complete.sql` ran successfully
2. For Docker: Check `db-init` container logs: `docker-compose logs db-init`
3. Manually run SQL: `docker-compose exec mysql mysql -u root -pPASSWORD liuyao_db < /sql/00_init_complete.sql`
4. Verify `DB_RESET_ON_STARTUP=true` in `.env` for auto-reset on startup (development only)

### DeepSeek API Failures
Common causes:
1. API key not configured or invalid
2. Insufficient account balance
3. Network connectivity issues
4. Request rate limiting

Check backend logs for detailed error messages.

### Moving Lines Not Displaying
Verify:
1. `changes` array is correctly generated in divination algorithm
2. Frontend component receives `changes` prop
3. Styling for moving line markers is applied

## Additional Documentation

- `README.md` - Project overview and basic setup (Chinese)
- `QUICKSTART.md` - Quick start guide (if exists)
- `PROJECT_DOCUMENTATION.md` - Comprehensive technical documentation (if exists)
- `DEEPSEEK_CONFIG.md` - DeepSeek API configuration guide
- `DOCKER_DEPLOYMENT.md` - Docker deployment guide (recommended for production)
- `doc/DEPLOYMENT.md` - Comprehensive deployment documentation
- `doc/DEPLOYMENT_CHECKLIST.md` - Pre-deployment checklist
- `server/sql/README.md` - Database schema documentation (if exists)
- `server/src/utils/najia_reference.md` - Traditional Najia reference

## Project Status

**Recent Additions:**
- ✅ Complete authentication and authorization system (JWT + RBAC)
- ✅ Admin dashboard with user, role, and permission management
- ✅ Session management and login security
- ✅ Audit logging and activity tracking
- ✅ Invitation code system
- ✅ User data isolation (users can only see their own records)
- ✅ Password change functionality
- ✅ Personal API key management
- ✅ Verification feedback system for divination records
- ✅ Docker deployment support with auto-initialization

**Core Features:**
- Three divination methods (time, number, manual)
- Complete Liuyao hexagram generation with traditional attributes
- AI-powered interpretation via DeepSeek API
- Historical record management
- Utility tools (calendar conversion, branch relations, hexagram lookup)

