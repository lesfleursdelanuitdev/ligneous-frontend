# Configuration

Centralized configuration for the Ligneous frontend application.

## Structure

```
config/
├── index.js          # Main config export
├── environment.js    # Environment variables
├── api.js            # API configuration
├── database.js      # Database configuration
├── auth.js           # Authentication configuration
└── README.md         # This file
```

## Usage

### Import the main config

```javascript
import { config } from '@/config';

// Access API config
const goApiUrl = config.api.goApi.baseURL;

// Access auth config
const jwtSecret = config.auth.jwtSecret;

// Check environment
if (config.isDevelopment) {
  // Development-only code
}
```

### Import specific configs

```javascript
import { apiConfig } from '@/config/api';
import { authConfig } from '@/config/auth';
import { dbConfig } from '@/config/database';
import { env } from '@/config/environment';
```

### Client-side configuration

For client-side code, use `getClientConfig()` to get only browser-accessible values:

```javascript
import { config } from '@/config';

const clientConfig = config.getClientConfig();
// Only contains NEXT_PUBLIC_* variables
```

## Environment Variables

All environment variables are accessed through `config.env`:

- `NODE_ENV` - Node environment (development, production, test)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `JWT_EXPIRES_IN` - JWT expiration time (default: '7d')
- `GO_API_URL` / `NEXT_PUBLIC_GO_API_URL` - Go API base URL
- `NEXT_PUBLIC_API_URL` - Next.js API routes base URL

## Benefits

- ✅ Single source of truth for configuration
- ✅ Type-safe configuration access
- ✅ Easier to test (can mock config)
- ✅ Better for different environments
- ✅ Centralized defaults
- ✅ Client/server separation handled automatically

