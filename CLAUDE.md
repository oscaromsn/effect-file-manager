# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Effect-based file manager demonstrating file uploads with UploadThing, real-time sync via WebSocket RPC, and React state management with @effect-atom/atom-react.

## Commands

```bash
# Install dependencies
pnpm install

# Development (run in separate terminals)
pnpm dev:server          # http://localhost:3001
pnpm dev:client          # http://localhost:5173

# Build (builds domain first, then client and server)
pnpm build

# Type checking
pnpm typecheck           # or: pnpm check

# Linting
pnpm lint                # runs both oxlint and eslint
pnpm lint:fix            # auto-fix lint issues

# Testing
pnpm test                # run all tests
pnpm test:watch          # watch mode

# Run single test file
cd packages/server && pnpm test src/public/files/files-repo.test.ts

# Database
pnpm db:migrate          # run migrations
pnpm db:reset            # reset database

# Docker (PostgreSQL + Jaeger)
docker compose up -d
```

## Architecture

### Monorepo Structure (pnpm workspaces)

```
packages/
  domain/    # Shared types, Effect Schemas, RPC contract definitions
  server/    # Node.js server with Effect, PostgreSQL, UploadThing
  client/    # React + Vite client with TanStack Router
```

### RPC Architecture

**Contract-first approach**: RPC endpoints are defined in `@example/domain` using `@effect/rpc`:

- `packages/domain/src/api/files/files-rpc.ts` - File operations RPC definitions
- `packages/domain/src/api/event-stream-rpc.ts` - Real-time event stream
- `packages/domain/src/domain-api.ts` - Combined RPC group (`DomainRpc`)

**Server implementation**: RPC handlers use `RpcGroup.toLayer()`:
- `packages/server/src/public/files/files-rpc-live.ts` - Files RPC implementation
- Handlers access `CurrentUser` from RPC middleware context (`Policy.CurrentUser`)

**Client consumption**: WebSocket client with NDJSON serialization:
- `packages/client/src/lib/domain-rpc-client.ts` - `DomainRpcClient` service

### State Management (Client)

Uses `@effect-atom/atom-react` for reactive Effect-based state:

- `packages/client/src/lib/atom.ts` - Atom runtime configuration
- `packages/client/src/lib/event-stream-atoms.tsx` - Real-time event subscription
- `packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx` - File state atoms

Pattern: Atoms wrap Effect computations and streams, integrating with React via hooks like `useAtomValue`.

### Database Layer

- `packages/server/src/db/pg-live.ts` - PostgreSQL client layer (`PgLive`)
- `packages/server/src/public/files/files-repo.ts` - Repository pattern with `@effect/sql`
- Testing uses `@testcontainers/postgresql` with schema dump application

### Testing Patterns

Uses `@effect/vitest` for Effect-integrated tests:

```typescript
it.layer(Live, { timeout: "30 seconds" })("TestSuite", (it) => {
  it.effect("test name", Effect.fn(function* () {
    const service = yield* SomeService;
    // assertions
  }));
});
```

## Key Patterns

**Effect Services**: Services use `Effect.Service` class pattern with `Default` layers:
```typescript
class FilesRepo extends Effect.Service<FilesRepo>()("FilesRepo", {
  dependencies: [PgLive],
  effect: Effect.gen(function* () { /* ... */ })
}) {}
```

**RPC Middleware**: Auth via `CurrentUserRpcMiddleware` providing `CurrentUser` context.

**Import Aliases**:
- Server: `@/` maps to `src/`
- Client: `@/` maps to `src/`

## Custom ESLint Rules

- `no-relative-import-outside-package` - Prevents relative imports crossing package boundaries
- `enforce-react-namespace` - Requires `React.*` namespace usage (no bare imports)
- `no-deep-relative-imports` - Limits relative import depth

## Environment Setup

Copy `.env.example` to `.env` and configure:
- `DATABASE_URL` - PostgreSQL connection string
- `UPLOADTHING_TOKEN` - UploadThing v7 API token
- `OTLP_URL` - OpenTelemetry collector (Jaeger)
- `VITE_API_URL` - Client API endpoint
