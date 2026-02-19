# Prisma 7 Configuration Fix

**Date:** 2026-01-26  
**Issue:** Prisma Client generation error with engine type "client"

---

## The Problem

We encountered this error:
```
❌ Failed to create Prisma Client: Using engine type "client" requires either "adapter" or "accelerateUrl" to be provided to PrismaClient constructor.
```

## Root Cause

**Prisma 7 Breaking Changes:**

1. **`datasource.url` is NO LONGER supported in `schema.prisma`**
   - In Prisma 6 and earlier, you would put `url = env("DATABASE_URL")` in the schema
   - In Prisma 7, this property must be removed from the schema file
   - The URL is now configured only in `prisma.config.ts`

2. **Database adapters are now required for client-side connections**
   - Prisma 7 uses a different client architecture
   - Direct PostgreSQL connections require the `@prisma/adapter-pg` package
   - The adapter must be passed to the `PrismaClient` constructor

## The Solution

### 1. Updated `prisma/schema.prisma`

**REMOVED** the `url` property:

```prisma
datasource db {
  provider = "postgresql"
  // NO url property here anymore!
}

generator client {
  provider = "prisma-client-js"
  // NO engineType needed
}
```

### 2. Kept `prisma.config.ts` with datasource URL

```typescript
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],  // URL is here now
  },
});
```

### 3. Installed PostgreSQL adapter

```bash
npm install @prisma/adapter-pg pg
```

### 4. Updated `lib/prisma.js` to use adapter

```javascript
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

function createPrismaClient() {
  // Create PostgreSQL connection pool
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  
  // Create Prisma adapter
  const adapter = new PrismaPg(pool);
  
  // Create Prisma Client with adapter
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();
```

### 5. Added `"type": "module"` to `package.json`

```json
{
  "name": "ligneous-frontend",
  "type": "module",
  ...
}
```

This eliminates ES module warnings.

---

## Result

✅ **Prisma Client generates successfully**  
✅ **Database connection works**  
✅ **Website owner (monalig) created**  
✅ **Seed script runs without errors**

---

## Key Takeaways for Prisma 7

1. **Never** put `url` in `datasource` block in `schema.prisma`
2. **Always** put it in `prisma.config.ts`
3. **Use adapters** for database connections (unless using Prisma Accelerate)
4. The `engineType = "binary"` option is no longer needed
5. Database drivers (like `pg`) are now explicit dependencies

---

## Next Steps

- ✅ Database setup complete
- ✅ Website owner created (monalig / Oscar890!)
- 🚀 Ready to test authentication in the browser
- 🚀 Ready to begin Phase 2: Tree Management

---

## References

- [Prisma 7 Client Configuration](https://pris.ly/d/prisma7-client-config)
- [Prisma 7 Config Datasource](https://pris.ly/d/config-datasource)
- [@prisma/adapter-pg documentation](https://www.prisma.io/docs/orm/overview/databases/postgresql)


