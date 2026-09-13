# Digital Sign App (SignCraft)

A high-assurance, type-safe full-stack digital signature platform built with **Bun**, **ElysiaJS**, **Svelte 5**, **PostgreSQL**, and **Drizzle ORM**.

## Tech Stack

- **Runtime & Package Manager:** [Bun](https://bun.sh/)
- **Backend (BE):** [ElysiaJS](https://elysiajs.com/) with Swagger and CORS
- **Frontend (FE):** [Svelte 5](https://svelte.dev/) with Vite and TypeScript
- **Database (DB):** [PostgreSQL](https://www.postgresql.org/)
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/) & Drizzle Kit
- **Language:** TypeScript (End-to-End)

## Monorepo Layout

```
digital-sign-app/
├── package.json               # Root workspace scripts & dependencies
├── docker-compose.yml         # Local PostgreSQL 16 container
├── .env.example               # Environment template
├── apps/
│   ├── backend/               # ElysiaJS + Drizzle ORM + TypeScript
│   │   ├── drizzle.config.ts  # Drizzle configuration
│   │   ├── drizzle/           # Generated SQL migrations
│   │   └── src/
│   │       ├── db/            # Postgres client & schema definition
│   │       └── index.ts       # Elysia server & API routes
│   └── frontend/              # Svelte 5 + Vite + TypeScript
│       ├── vite.config.ts     # Vite setup with proxy to :3000
│       └── src/
│           ├── App.svelte     # Dashboard, signing pad, API status
│           └── main.ts
```

## Getting Started

### 1. Install Dependencies
```bash
bun install
```

### 2. Start PostgreSQL (Optional for Local DB)
```bash
bun run db:up
# Or: docker compose up -d
```

### 3. Generate & Run DB Migrations
```bash
bun run db:generate
bun run db:migrate
```

### 4. Start Development Servers
Start both backend (port 3000) and frontend (port 5173):
```bash
bun run dev
```

Or start individually:
```bash
bun run dev:backend   # Elysia backend
bun run dev:frontend  # Svelte frontend
```

### 5. API Documentation
Once the backend is running, access the interactive Swagger/OpenAPI documentation at:
- `http://localhost:3000/swagger`
- Health check: `http://localhost:3000/api/health`
