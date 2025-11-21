# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a traditional Chinese Liuyao (六爻) divination system combining modern web technologies with AI-powered interpretation. The system provides three divination methods (time-based, number-based, manual coin-tossing simulation), generates complete hexagram layouts, and integrates with DeepSeek API for intelligent analysis.

**Tech Stack:**
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS
- Backend: Node.js + Express + TypeScript
- Database: MySQL 5.7+ (or SQLite for development)
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
```bash
# MySQL initialization (Windows)
cd server && setup_mysql.bat

# MySQL initialization (Unix/Mac)
cd server && chmod +x setup_mysql.sh && ./setup_mysql.sh

# Or manually
mysql -u root -p123456 < server/sql/init_database.sql
mysql -u root -p123456 < server/sql/insert_data.sql
mysql -u root -p123456 < server/sql/test_data.sql
```

**Note:** SQLite is used by default in development mode and auto-initializes on first run.

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
- `trigrams` - Eight basic trigrams reference data
- `gua_data` - 64 hexagrams with names and traditional texts

**Important:** Hexagram data is stored as JSON to preserve complex nested structures. When querying, parse JSON fields on the backend before sending to frontend.

### Frontend Architecture

**Page Components (`client/src/pages/`):**
- `DivinationPage.tsx` - Main divination interface with method selection
- `PaidianPage.tsx` - Hexagram display page (排盘 = layout/arrangement)
- `JieguaPage.tsx` - AI interpretation page (解卦 = interpretation)
- `HistoryPage.tsx` - Historical records browser

**Routing:** Uses React Router v6. Main routes configured in `App.tsx`.

**Data Flow:**
1. User performs divination → POST `/api/divination`
2. Backend generates complete hexagram with all attributes
3. Navigate to PaidianPage to display hexagram
4. User clicks "AI Analysis" → POST `/api/ai/analyze` (SSE stream)
5. Save to history → available in HistoryPage

## Environment Configuration

### Required: DeepSeek API Key

Create `server/.env` from `server/.env.example`:
```env
DEEPSEEK_API_KEY=sk-your-actual-key-here
DEEPSEEK_API_URL=https://api.deepseek.com
```

**Getting a key:** See `DEEPSEEK_CONFIG.md` for detailed instructions.

### Database Configuration

Default uses SQLite for development. For MySQL:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=123456
DB_NAME=liuyao_db
```

## Key Technical Concepts

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

## Testing

### Test Data
Database includes 5 pre-seeded records covering all divination methods:
```bash
mysql -u root -p123456 < server/sql/test_data.sql
```

### Manual Testing Flow
1. Start development servers: `npm run dev`
2. Navigate to http://localhost:3000
3. Perform divination using any method
4. Verify hexagram display shows all attributes correctly
5. Test AI analysis (requires valid DeepSeek API key)
6. Check history page for saved records

### API Testing
Use tools like Postman or curl:
```bash
# Create divination
curl -X POST http://localhost:5000/api/divination \
  -H "Content-Type: application/json" \
  -d '{"question":"Test","method":"time"}'

# Get records
curl http://localhost:5000/api/records

# Simulate coin toss
curl http://localhost:5000/api/divination/simulate
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

## Troubleshooting

### Port Already in Use
Default ports: 3000 (frontend), 5000 (backend)

Change in:
- Frontend: `client/vite.config.ts` → `server.port`
- Backend: `server/.env` → `PORT=5001`

### MySQL Connection Issues
Check:
1. MySQL service is running
2. Credentials in `.env` match your MySQL setup
3. Database `liuyao_db` exists (created by init script)
4. Character set is `utf8mb4`

Alternative: Use SQLite (default) by not configuring MySQL env vars.

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

- `README.md` - Project overview and basic setup
- `QUICKSTART.md` - Quick start guide
- `PROJECT_DOCUMENTATION.md` - Comprehensive technical documentation
- `DEEPSEEK_CONFIG.md` - DeepSeek API configuration guide
- `server/sql/README.md` - Database schema documentation
- `server/src/utils/najia_reference.md` - Traditional Najia reference
