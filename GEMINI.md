# GEMINI.md

This file provides context and guidance for the Gemini AI agent when working with the Liuyao Divination System codebase.

## Project Overview

**Name:** Liuyao Divination System (六爻排盘系统)
**Purpose:** A traditional Chinese divination platform combining ancient "Liuyao" methods with modern AI interpretation.
**Architecture:** Full-stack web application (Monorepo).

**Tech Stack:**
*   **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, React Router v6.
*   **Backend:** Node.js, Express, TypeScript.
*   **Database:** MySQL 5.7 (using `mysql2` driver).
*   **AI Integration:** DeepSeek API (for hexagram interpretation).
*   **Infrastructure:** Docker, Docker Compose, Nginx (Reverse Proxy).

**Key Features:**
1.  **Divination Methods:** Time-based (时间起卦), Number-based (数字起卦), Manual Coin Toss (手动摇卦).
2.  **Hexagram Calculation:** Automatic generation of hexagrams (Ben Gua, Bian Gua) with full attributes:
    *   Najia (纳甲), Earth Branches (地支), Five Elements (五行).
    *   Six Relatives (六亲), Six Spirits (六神), Shi-Ying (世应).
    *   Advanced: Kong Wang (空亡), Yao Prosperity (旺衰), Hidden Spirits (伏神).
3.  **AI Analysis:** Streaming interpretation using DeepSeek API via Server-Sent Events (SSE).
4.  **User System:** Authentication (JWT), History tracking, Role-based access (User/Admin).

## Directory Structure

```
D:\My Documents\claude_prj\liuyao-divination\
├── client/                 # Frontend React Application
│   ├── src/
│   │   ├── components/     # UI Components (GuaDisplay, etc.)
│   │   ├── pages/          # Page Views (DivinationPage, PaidianPage, etc.)
│   │   ├── contexts/       # React Contexts (AuthContext)
│   │   ├── services/       # API integration
│   │   ├── types/          # Shared frontend types
│   │   └── utils/          # Frontend helpers
│   ├── vite.config.ts      # Vite configuration
│   └── tailwind.config.js  # Tailwind configuration
├── server/                 # Backend Express Application
│   ├── src/
│   │   ├── controllers/    # Request Handlers
│   │   ├── models/         # Database Interactions
│   │   ├── routes/         # API Route Definitions
│   │   └── utils/          # Core Logic (liuyao.ts, bagong.ts)
│   ├── sql/                # SQL Init Scripts
│   └── package.json        # Backend scripts
├── docker-compose.yml      # Container orchestration
├── CLAUDE.md               # Detailed developer guide & architecture notes
└── package.json            # Root scripts (Monorepo management)
```

## Building and Running

### Prerequisites
*   Node.js >= 18
*   MySQL 5.7+ (or Docker)
*   NPM

### Key Commands

**Development:**
```bash
# Install dependencies (Root + Client + Server)
npm run install:all

# Start Development Server (Concurrent Client :3000 & Server :5000)
npm run dev

# Run Client only
cd client && npm run dev

# Run Server only
cd server && npm run dev
```

**Database Setup:**
```bash
# Docker (Recommended)
docker-compose up -d mysql

# Manual Initialization
cd server && setup_mysql.bat  # Windows
# or
mysql -u root -p < server/sql/00_init_complete.sql
```

**Production/Docker:**
```bash
# Build and Run all services
docker-compose up -d --build
```

**Testing:**
*   **Frontend:** No explicit test script found in `client/package.json` (Assumed manual testing).
*   **Backend:** No explicit test script found in `server/package.json`. Manual API testing via `test-api.js` or curl.

## Development Conventions

*   **Language:** Strict TypeScript usage for both frontend and backend.
*   **Styling:** Tailwind CSS for all styling. Avoid custom CSS files unless necessary (`index.css` is used for base styles).
*   **State Management:** React Context (`AuthContext`) for global state; local state for components.
*   **API Pattern:** RESTful API.
    *   Path: `/api/...`
    *   Auth: JWT in `Authorization` header (`Bearer <token>`).
*   **Data Handling:**
    *   Hexagram data is complex and stored as JSON in MySQL.
    *   `GuaDecoration` interface (Server) must match expected structure in Client.
*   **Security:**
    *   Passwords hashed (bcrypt/argon2 implied).
    *   Environment variables for secrets (`.env`).
*   **Git:** Monorepo strategy. Commit changes to both client and server if a feature spans both.

## Core Logic Locations

*   **Hexagram Logic:** `server/src/utils/liuyao.ts` (The brain of the operation).
*   **Palace/Shi-Ying:** `server/src/utils/bagong.ts`.
*   **Constants:** `server/src/utils/constants.ts` (Trigrams, Elements, Stars mappings).
*   **AI Prompts:** `server/src/controllers/aiController.ts` or `divinationController.ts` (Look here to tune AI persona).

## Critical Files

*   `CLAUDE.md`: Contains the most detailed project-specific instructions. **Read this first for specific architectural questions.**
*   `server/src/models/database.ts`: Database connection and query wrapper.
*   `client/src/services/api.ts`: Frontend API client configuration.
