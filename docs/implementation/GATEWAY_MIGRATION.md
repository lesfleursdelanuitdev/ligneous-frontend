# Gateway Migration Note

**Date:** 2026-01-23

## Decision: Built-in Gateway

We decided to build the gateway functionality directly into the frontend project as Next.js API routes instead of maintaining a separate gateway service.

## What Was Removed

The separate `ligneous-gedcom-gateway` project has been deleted to avoid confusion.

## Why This Decision

1. **Simpler Architecture** - One service instead of two
2. **Easier Development** - Single dev server
3. **No Port Conflicts** - API routes run on same port as frontend
4. **Less Complexity** - The separate gateway project was too complex

## Architecture

The gateway is now implemented as Next.js API routes in `app/api/`:

```
app/api/
├── auth/              # Authentication endpoints
├── trees/             # Tree management endpoints
└── proxy/             # Proxy to Go API
```

## Key Documentation

Current architecture is documented in:
- `/apps/ligneous-frontend/ARCHITECTURE.md` - Current architecture
- `/apps/ligneous-frontend/PORTS.md` - Port configuration
- `/apps/ligneous-gedcom-api/README.md` - Go API documentation
- `/apps/ligneous-gedcom-api/ROUTES.md` - Go API endpoints

## Migration Notes

- Gateway functionality is now in Next.js API routes
- No separate service to run
- API routes accessible at `/api/*` on the same port as frontend (4000)
- Environment variables updated (see `.env.example`)

