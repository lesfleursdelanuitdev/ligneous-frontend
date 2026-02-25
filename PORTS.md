# Port Configuration

## Service Ports

### Frontend + Gateway (ligneous-frontend)
- **Port:** `4000`
- **URL:** http://localhost:4000
- **API Routes:** http://localhost:4000/api
- **Config:** Set in `package.json` scripts (`-p 4000`)

**Note:** The gateway is now built into the frontend as Next.js API routes, so they run on the same port.

### GEDCOM Lib API (ligneous-gedcom-lib-api)
- **Port:** `8091`
- **URL:** http://localhost:8091
- **Config:** `LIB_API_URL` in frontend; `PORT` in lib-api

## Ports in Use (Checked)

The following ports are currently in use:
- 22, 80, 443 (system services)
- 3000, 3005 (other services)
- 3306 (MySQL)
- 5000, 5001, 5010 (other services)
- 5173, 5175 (Vite dev servers)
- 5432 (PostgreSQL)
- 6379 (Redis)
- 8000, 8080, 8090, 8091 (various services)

**Available ports:** 3001, 3002, 4001, 6000, 6001, 7000, 7001, etc.

## Environment Variables

### Frontend `.env.local`
```bash
# GEDCOM lib API (ligneous-gedcom-lib-api; upload/export routes call this)
LIB_API_URL=http://localhost:8091

# Frontend API base URL (for client-side requests)
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

## Request Flow

```
Frontend (port 4000)
  ↓ (client-side requests)
Next.js API Routes (/api/*) (same port 4000)
  ↓ (server-side proxy)
GEDCOM lib API (port 8091)
```

## Architecture Change

**Previous:** Separate gateway service on port 5000  
**Current:** Gateway built into frontend as Next.js API routes

### Benefits
- ✅ Simpler architecture (one service instead of two)
- ✅ No separate port needed
- ✅ Easier deployment
- ✅ API routes run on same port as frontend

### Next.js API Routes Structure

```
app/
├── api/                    # API routes (gateway functionality)
│   ├── auth/              # Authentication endpoints
│   │   ├── register/route.js
│   │   └── login/route.js
│   ├── trees/             # Tree management endpoints
│   │   ├── route.js       # GET /api/trees, POST /api/trees
│   │   └── [id]/route.js  # GET /api/trees/:id, etc.
│   └── proxy/             # Proxy to Go API
│       └── [...path]/route.js  # Proxy all /api/proxy/* to Go API
└── ...
```

## Changing Ports

### Change Frontend Port
Edit `package.json`:
```json
"dev": "next dev -p 4000",
"start": "next start -p 4000"
```

Update `.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

### Change Go API Port
Set `PORT` environment variable:
```bash
PORT=8091  # or any other port
```

Update frontend `.env.local`:
```bash
GO_API_URL=http://localhost:8091
```
