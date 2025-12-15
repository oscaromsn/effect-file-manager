# TalentScore

It's a full-stack demonstration application built with **Effect**, featuring an AI-powered Resume Parser and score system. This project showcases how to use structured LLM extraction to derive deterministic assessments. The filosophy is use LLMs for what they do better: turn messy unstructured information into typed data that we can then model deterministically and integrate into larger AI/ML pipelines. It's a key pattern for regulated industries, where systems should run as deterministically and explanable as possible while handling documents with a wide range of formats and structures.

## Overview

This repository demonstrates how to build production-grade applications with the Effect ecosystem. It combines two major domains:

1.  **File Management:** Resumable uploads via UploadThing, folder organization, and multi-user isolation.
2.  **AI Resume Analysis:** PDF parsing, structured entity extraction using BAML (Basically A Made-Up Language), and context-aware scoring based on job roles and company profiles.

## Key Features

### AI Resume Parser
-   **Structured Extraction:** Uses **BAML** to guarantee type-safe extraction of experience, education, skills, and contact info from PDFs.
-   **Streaming Responses:** Real-time UI updates as the LLM parses the document (partial results via WebSocket).
-   **Context Scoring:** Dynamic candidate scoring algorithm based on target **Position** (e.g., Frontend, Tech Lead) and **Company Profile** (e.g., Startup, Enterprise).
-   **Dealbreaker Detection:** Logic to identify missing certifications or experience gaps based on context.

### File System
-   **UploadThing Integration:** Secure, resumable file uploads.
-   **Real-time Sync:** WebSocket events update file lists across clients instantly.
-   **File Operations:** Create folders, move files, and delete items with optimistic UI updates.

### Architecture
-   **Contract-First RPC:** Type-safe communication between Client and Server using `@effect/rpc`.
-   **Reactive Client:** State management using `@effect-atom/atom-react`.
-   **Observability:** Full OpenTelemetry tracing with Jaeger.

## Getting Started

**Prerequisites:**
-   Node.js 22.x
-   pnpm 10.x
-   Docker (for PostgreSQL & Jaeger)
-   An OpenAI API Key (or Anthropic)

### 1. Installation

```bash
pnpm install
```

### 2. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

You must configure the following in `.env`:
-   `DATABASE_URL`: (Default is set for Docker)
-   `UPLOADTHING_TOKEN`: Get this from your UploadThing dashboard (v7).
-   `OPENAI_API_KEY`: Required for the Resume Parser (or configure `anthropic` in `baml_src/clients.baml`).

### 3. Database & BAML Generation

Start the infrastructure and prepare the code generation:

```bash
# Start Postgres and Jaeger
docker compose up -d

# Run database migrations
pnpm db:migrate

# Generate BAML client code (required for AI features)
pnpm baml:generate
```

### 4. Run Development Servers

Run the client and server in separate terminals:

```bash
# Terminal 1: API Server
pnpm dev:server  # http://localhost:3001

# Terminal 2: React Client
pnpm dev:client  # http://localhost:5173
```

-   **App:** http://localhost:5173
-   **Jaeger UI:** http://localhost:16686 (Trace ID available in server logs)

## Architecture & Code Structure

### Monorepo Overview

```
packages/
  domain/    # Shared Schemas, RPC Contracts (Files + Resume), and Policy
  server/    # Node.js runtime, BAML definitions, DB Logic
  client/    # React, TanStack Router, Effect Atoms
```

### AI Pipeline Flow

1.  **Upload:** User uploads a PDF via the Client.
2.  **RPC Call:** Client calls `resume_parse(fileId)`.
3.  **Server:**
    *   Retrieves file URL from UploadThing.
    *   Invokes **BAML** (`packages/server/baml_src/resume.baml`) to prompt the LLM.
    *   Streams partial results back to the client via `Stream.async`.
4.  **Scoring:** Once parsing is complete, `packages/server/src/public/resume/scoring-logic.ts` calculates a score (0-1000) based on weighted dimensions (Skills, Experience, etc.).
5.  **Persistence:** Structured data is stored in PostgreSQL.

### Technology Stack

-   **Runtime:** [Effect](https://effect.website) (TypeScript)
-   **AI/LLM:** [BAML](https://www.boundaryml.com/) (Boundary)
-   **RPC:** @effect/rpc (WebSocket/NDJSON)
-   **Frontend:** React 19, Tailwind v4, TanStack Router
-   **State:** @effect-atom/atom-react
-   **Database:** PostgreSQL, @effect/sql
-   **Storage:** UploadThing

## Commands

| Command | Description |
| :--- | :--- |
| `pnpm baml:generate` | Generate TypeScript clients from `.baml` files |
| `pnpm db:migrate` | Apply SQL migrations |
| `pnpm db:reset` | Wipe database and re-apply schema |
| `pnpm check` | Run TypeScript type checking |
| `pnpm lint` | Run Oxlint and ESLint |
| `pnpm test` | Run Vitest suite |

## Acknowledgements

Huge thanks to Lucas Barake for his [amazing video tutorials](https://youtu.be/-23f_B1fnKA?si=eR7Fjk02fIzAL6Zg) on how to build type-safe, resilient applications and the Uploadthing integration demo (which is the foundation of this project). Also huge thanks to the Effect community as a whole - it's being a long way to learn new patterns of error handling and concurrency, but I have never seen such a talented and helpful community ([Effect Office Hours](https://www.youtube.com/watch?v=qU5z5VqIdxg&list=PLDf3uQLaK2B_0hEiHT82cv-DotrtD6Bhi) by [Kit](https://x.com/kitlangton) and [Max](https://x.com/imax153) have enlightned me many times haha).

Last but not least, [🦄 ai that works](https://www.youtube.com/playlist?list=PLi60mUelRAbFqfgymVfZttlkIyt0XHZjt) by [dex](https://x.com/dexhorthy) and [hellovai](https://x.com/vaibcode) as always.

## License

MIT
