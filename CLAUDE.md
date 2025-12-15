# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Install dependencies (uses pnpm 10.3.0 via Corepack)
pnpm install

# Start infrastructure (PostgreSQL + Jaeger)
docker compose up -d

# Database setup
pnpm db:migrate          # Apply migrations
pnpm db:reset            # Drop and recreate schema

# Generate BAML TypeScript client (required after .baml changes)
pnpm baml:generate

# Development servers (run in separate terminals)
pnpm dev:server          # http://localhost:3001
pnpm dev:client          # http://localhost:5173

# Validation
pnpm check               # TypeScript type checking (tsc -b)
pnpm lint                # Run oxlint + eslint
pnpm lint:fix            # Auto-fix lint issues
pnpm test                # Run all tests
pnpm test:watch          # Watch mode

# Single package test
pnpm --filter @example/server test
pnpm --filter @example/client test
pnpm --filter @example/domain test
```

## Architecture Overview

This is an Effect-based full-stack application with AI-powered resume parsing. The philosophy is using LLMs for structured data extraction, then applying deterministic scoring algorithms.

### Monorepo Structure (pnpm workspaces)

```
docs/          # Project documentation (check it when doubts arises)
packages/
├── domain/    # Shared RPC contracts + Effect Schemas (no runtime deps)
├── server/    # Node.js Effect runtime, BAML LLM integration, PostgreSQL
└── client/    # React 19, TanStack Router, @effect-atom/atom-react
```

**Dependency rule:** Domain ← Server, Domain ← Client (unidirectional, no cycles)

### Key Architectural Patterns

**Contract-First RPC (@effect/rpc)**
- RPC contracts defined in `packages/domain/src/api/`
- Server implements handlers in `packages/server/src/public/**/*-rpc-live.ts`
- Client consumes via `DomainRpcClient` in atoms
- WebSocket transport with NDJSON codec for streaming

**Effect Services Pattern**
- Services use `Effect.Service<T>()` with dependencies and effects
- Layers compose via `Layer.provide()` / `Layer.mergeAll()`
- All errors are typed Effect errors (TaggedError)
- RPC groups merged: `DomainRpc extends EventStreamRpc.merge(FilesRpc).merge(ResumeRpc)`

**State Management (@effect-atom/atom-react)**
- Atoms defined alongside routes: `routes/resume/-resume/resume-atoms.ts`
- Runtime created with `makeAtomRuntime(Layer.mergeAll(...))`
- Atoms wrap Effects for async operations: `runtime.atom(Effect.gen(...))`
- Tagged enums for state phases: `Data.taggedEnum<ParsingPhase>()`

**BAML LLM Integration**
- Schema definitions in `packages/server/baml_src/*.baml`
- Generated client outputs to `packages/server/baml_client/` (gitignored)
- Streaming extraction: `b.stream.ExtractResume(pdf)` → partial updates
- Client configs support OpenAI, Anthropic, fallback strategies

### Important Files

| Purpose | Location |
|---------|----------|
| RPC contracts | `packages/domain/src/api/*/` |
| Merged RPC group | `packages/domain/src/domain-api.ts` |
| Server entry | `packages/server/src/server.ts` |
| RPC implementations | `packages/server/src/public/**/*-rpc-live.ts` |
| Scoring algorithm | `packages/server/src/public/resume/scoring-logic.ts` |
| BAML schemas | `packages/server/baml_src/*.baml` |
| Client atoms | `packages/client/src/routes/**/*-atoms.ts` |
| RPC client | `packages/client/src/lib/domain-rpc-client.ts` |

## Code Style Rules

**Custom ESLint Rules (enforced):**
1. `enforce-react-namespace`: Use `import React from 'react'` + `React.useState`, not named imports
2. `no-deep-relative-imports`: Use `@/` alias for imports >1 level up (client/server)
3. `no-relative-import-outside-package`: Cross-package imports use `@example/domain`, never relative paths

**Effect Patterns:**
- Use `Effect.gen(function* () { ... })` for sequential operations
- Errors via `Schema.TaggedError<T>()("ErrorName", { ... })`
- Services via `Effect.Service<T>()("ServiceName", { effect: Effect.gen(...) })`
- Streaming via `Stream.runForEach(stream, (event) => ...)`

## Environment Variables

Required in `.env` (copy from `.env.example`):
- `DATABASE_URL`: PostgreSQL connection string
- `UPLOADTHING_TOKEN`: UploadThing v7 token
- `OPENAI_API_KEY`: For resume parsing (or configure Anthropic in `baml_src/clients.baml`)

## External Services

- **PostgreSQL**: Port 5432 (via docker-compose)
- **Jaeger UI**: http://localhost:16686 (traces viewable via trace ID in server logs)
- **UploadThing**: File upload/storage service
