# Ligneous Frontend

Frontend application for the Ligneous GEDCOM genealogy platform.

## Tech Stack

- **Next.js 16** - React framework with App Router
- **Mycelia Plugin System** - Domain logic and state management
- **Tailwind CSS** - Styling
- **Axios** - HTTP client

## Features

- User authentication (registration, login)
- Tree management (create, view, edit, delete)
- Tree collaboration (share trees with permissions)
- User-individual linking (link users to individuals in trees)
- GEDCOM file processing (via Go API)
- Family tree visualization
- Relationship queries
- Graph analytics

## Getting Started

### Prerequisites

- Node.js 18+
- GEDCOM lib API running (ligneous-gedcom-lib-api, default: http://localhost:8091)

**Note:** The gateway is built into this frontend as Next.js API routes, so no separate gateway service is needed.

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file:

```bash
# Go API URL (Next.js API routes will proxy to this)
LIB_API_URL=http://localhost:8091

# Frontend API base URL (Next.js API routes run on same port as frontend)
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

### Development

```bash
npm run dev
```

Open [http://localhost:4000](http://localhost:4000) in your browser.

**Note:** Frontend runs on port 4000 (not 3000) to avoid conflicts.

### Build

```bash
npm run build
npm start
```

## Project Structure

```
ligneous-frontend/
├── app/                    # Next.js App Router
│   ├── layout.js          # Root layout
│   ├── page.js            # Home page
│   ├── (auth)/            # Auth routes
│   └── (dashboard)/       # Dashboard routes
├── mycelia/               # Mycelia Plugin System
│   ├── system.builder.js  # System builder
│   └── hooks/             # Mycelia hooks (facets)
├── components/            # React components
├── hooks/                 # React hooks (wrappers)
└── utils/                 # Utilities
```

## Architecture

This frontend uses **Mycelia Plugin System** for domain logic:

- **Facets** - Domain logic (auth, trees, API client)
- **React Components** - UI only (presentation layer)
- **Event-Driven** - Facets emit events, React listens

See `SIMPLIFIED_ARCHITECTURE_PLAN.md` in the gateway project for full architecture details.

## License

MIT
