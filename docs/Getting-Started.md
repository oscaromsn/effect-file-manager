# Getting Started

> **Relevant source files**
> * [.env.example](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.env.example)
> * [README.md](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/README.md)
> * [docker-compose.yml](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml)
> * [package.json](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/package.json)

This page guides developers through initial setup of the Effect File Manager project, including installing dependencies, configuring environment variables, starting required services, and understanding the monorepo structure. It provides the minimum steps necessary to run the application locally.

For detailed environment variable configuration, see [Environment Configuration](/lucas-barake/effect-file-manager/2.1-environment-configuration). For comprehensive instructions on running development servers and infrastructure, see [Running Locally](/lucas-barake/effect-file-manager/2.2-running-locally).

---

## Purpose and Scope

This document covers:

* Installing required tools and dependencies
* Initial project setup and configuration
* Starting the development environment
* Understanding the workspace structure
* Essential development commands

The Effect File Manager is a monorepo application demonstrating file uploads with UploadThing, real-time synchronization via WebSocket RPC, and Effect-TS patterns throughout the stack.

**Sources:** [README.md L1-L13](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/README.md#L1-L13)

---

## Prerequisites

The following tools must be installed on your development machine:

| Tool | Version | Purpose |
| --- | --- | --- |
| **Node.js** | 22.14.0 | JavaScript runtime for server and build tools |
| **pnpm** | 10.3.0 | Package manager for monorepo workspace management |
| **Docker** | Latest | Container runtime for PostgreSQL and Jaeger |
| **Docker Compose** | Latest | Orchestration for local infrastructure services |

The project enforces these versions via [`package.json L5-L8](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/`package.json#L5-L8)

 Using different versions may cause compatibility issues.

**Sources:** [README.md L16](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/README.md#L16-L16)

 [package.json L5-L8](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/package.json#L5-L8)

---

## Quick Start

### Setup Flow Diagram

```mermaid
flowchart TD

Start["Developer Machine"]
Clone["Clone Repository"]
Install["pnpm install"]
EnvCopy["cp .env.example .env"]
EnvEdit["Edit .env<br>Set UPLOADTHING_SECRET"]
Docker["docker compose up -d"]
PG["PostgreSQL<br>localhost:5432"]
Jaeger["Jaeger<br>localhost:16686"]
Migrate["pnpm db:migrate"]
StartServer["pnpm dev:server<br>localhost:3001"]
StartClient["pnpm dev:client<br>localhost:5173"]
Ready["Application Ready"]
Traces["View Traces<br>Unsupported markdown: link"]

Start --> Clone
Clone --> Install
Install --> EnvCopy
EnvCopy --> EnvEdit
EnvEdit --> Docker
Docker --> PG
Docker --> Jaeger
PG --> Migrate
Migrate --> StartServer
StartServer --> StartClient
StartClient --> Ready
Jaeger --> Traces
```

**Sources:** [README.md L18-L37](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/README.md#L18-L37)

### Step-by-Step Instructions

1. **Install dependencies** ``` ``` This installs all workspace packages and their dependencies. The command is defined in [`package.json L1-L11](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/`package.json#L1-L11)  which configures the pnpm workspace.
2. **Configure environment variables** ``` ``` Then edit `.env` to set `UPLOADTHING_SECRET` with your UploadThing API key. All required variables are documented in [`.env.example L1-L13](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/`.env.example#L1-L13)  See [Environment Configuration](/lucas-barake/effect-file-manager/2.1-environment-configuration) for detailed explanations.
3. **Start infrastructure services** ``` ``` This starts PostgreSQL (port 5432) and Jaeger (port 16686) as defined in [`docker-compose.yml L1-L47](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/`docker-compose.yml#L1-L47)  Services run in detached mode and persist across restarts via Docker volumes.
4. **Run database migrations** ``` ``` This executes the migration script defined in [`package.json L27](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/`package.json#L27-L27)  which delegates to the server package's migration command.
5. **Start development servers** In separate terminal windows: ``` ``` These commands are defined in [`package.json L25-L26](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/`package.json#L25-L26)  and start the Node.js backend and React frontend in watch mode with hot module replacement.

**Sources:** [README.md L18-L37](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/README.md#L18-L37)

 [package.json L12-L28](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/package.json#L12-L28)

 [docker-compose.yml L1-L47](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L1-L47)

---

## Monorepo Structure

The project uses pnpm workspaces to manage a monorepo with three packages. Understanding this structure is essential for navigating the codebase and running workspace commands.

### Workspace Architecture

```mermaid
flowchart TD

Root["package.json<br>packageManager: Unsupported markdown: link<br>workspaces: packages/*"]
Domain["@example/domain<br>Shared types & schemas"]
Server["@example/server<br>Node.js backend"]
Client["@example/client<br>React frontend"]
Postgres["postgres:16-alpine<br>Port 5432"]
Jaeger["jaegertracing/all-in-one<br>Port 16686, 4318"]

Root --> Domain
Root --> Server
Root --> Client
Server --> Postgres
Server --> Jaeger

subgraph subGraph2 ["Infrastructure (Docker)"]
    Postgres
    Jaeger
end

subgraph packages/ ["packages/"]
    Domain
    Server
    Client
    Server --> Domain
    Client --> Domain
end

subgraph subGraph0 ["Root Workspace"]
    Root
end
```

**Sources:** [package.json L9-L11](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/package.json#L9-L11)

 [README.md L39-L46](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/README.md#L39-L46)

 [docker-compose.yml L1-L47](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L1-L47)

### Package Responsibilities

| Package | Directory | Purpose | Dependencies |
| --- | --- | --- | --- |
| **@example/domain** | `packages/domain/` | Shared type definitions, Effect schemas, and RPC interface contracts used by both client and server | None (foundation) |
| **@example/server** | `packages/server/` | Node.js backend with Effect-TS runtime, WebSocket RPC server, database layer, and UploadThing integration | Depends on `@example/domain` |
| **@example/client** | `packages/client/` | React application with Vite, TanStack Router, Effect Atoms state management, and RPC client | Depends on `@example/domain` |

The `@example/domain` package acts as the shared contract layer, ensuring type safety across the client-server boundary. Both `@example/server` and `@example/client` import schemas and types from `@example/domain`, preventing type mismatches in RPC communication.

**Sources:** [README.md L39-L46](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/README.md#L39-L46)

 [package.json L9-L11](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/package.json#L9-L11)

---

## Essential Development Commands

All commands are run from the repository root and use pnpm's workspace filtering capabilities.

### Common Workflow Commands

| Command | Purpose | Details |
| --- | --- | --- |
| `pnpm dev:server` | Start server in watch mode | Runs on `localhost:3001` with auto-reload |
| `pnpm dev:client` | Start client in watch mode | Runs on `localhost:5173` with HMR |
| `pnpm db:migrate` | Apply database migrations | Executes migrations in `packages/server/src/db/migrations/` |
| `pnpm db:reset` | Reset database to clean state | Drops all tables and re-runs migrations |
| `pnpm build` | Build all packages | Sequential: domain → client → server |
| `pnpm typecheck` | Run TypeScript type checking | Checks all workspace packages |
| `pnpm test` | Run test suite | Executes Vitest tests across workspace |
| `pnpm lint` | Run linters (OxLint + ESLint) | Enforces code quality rules |
| `pnpm format` | Format code with Prettier | Auto-formats all supported file types |

**Sources:** [package.json L12-L28](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/package.json#L12-L28)

### Command Execution Pattern

```mermaid
flowchart TD

Dev["Developer"]
RootCmd["pnpm dev:server"]
Filter["pnpm --filter @example/server"]
PkgCmd["packages/server/package.json<br>scripts.dev"]
Execute["tsx watch src/main.ts"]
Server["Node.js Process<br>Port 3001"]
WS["WebSocket Server<br>RPC + Events"]
DB["PostgreSQL Connection"]
Trace["Jaeger Tracing"]

Dev --> RootCmd
RootCmd --> Filter
Filter --> PkgCmd
PkgCmd --> Execute
Execute --> Server
Server --> WS
Server --> DB
Server --> Trace
```

The workspace filter pattern `pnpm --filter <package>` is used throughout [`package.json L25-L28](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/`package.json#L25-L28)

 to run commands in specific packages while maintaining workspace context.

**Sources:** [package.json L25-L28](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/package.json#L25-L28)

---

## Development Environment Configuration

The project requires two configuration files:

### 1. Environment Variables (.env)

Created by copying [`.env.example L1-L13](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/`.env.example#L1-L13)

:

```

```

**Critical Variables:**

* `UPLOADTHING_SECRET` - API key from uploadthing.com for file upload presigned URLs
* `DATABASE_URL` - PostgreSQL connection string (default: `postgresql://postgres:postgres@localhost:5432/effect-files-example`)
* `VITE_API_URL` - Client-side API endpoint (default: `http://localhost:3001`)

See [Environment Configuration](/lucas-barake/effect-file-manager/2.1-environment-configuration) for complete variable documentation.

### 2. Docker Services (docker-compose.yml)

The [`docker-compose.yml L1-L47](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/`docker-compose.yml#L1-L47)

 file defines two services:

**PostgreSQL Container:**

* Image: `postgres:16-alpine`
* Port: `5432`
* Credentials: `postgres:postgres`
* Database: `effect-files-example`
* Persistent volume: `postgres_data`

**Jaeger Container:**

* Image: `jaegertracing/all-in-one:latest`
* UI Port: `16686`
* OTLP HTTP Port: `4318`
* CORS enabled for local development

Start services with:

```

```

Stop services with:

```

```

**Sources:** [.env.example L1-L13](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.env.example#L1-L13)

 [docker-compose.yml L1-L47](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L1-L47)

---

## Verification Steps

After completing setup, verify the application is running correctly:

### Service Health Checks

| Service | URL | Expected Result |
| --- | --- | --- |
| Client Application | [http://localhost:5173](http://localhost:5173) | React UI loads with file list |
| Server API | [http://localhost:3001](http://localhost:3001) | WebSocket connection established |
| Jaeger UI | [http://localhost:16686](http://localhost:16686) | Tracing dashboard loads |
| PostgreSQL | localhost:5432 | Connection successful (use `psql` to test) |

### Initial Database State

After running `pnpm db:migrate`, the database schema includes:

* `files` table for file metadata
* `folders` table for folder hierarchy
* Appropriate indexes and constraints

Query the database to verify:

```

```

**Sources:** [docker-compose.yml L1-L47](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L1-L47)

---

## Monorepo Build and Dependency Graph

The build process follows a strict dependency order to ensure shared packages are compiled before their consumers.

```mermaid
flowchart TD

B1["Unsupported markdown: list"]
B2["Unsupported markdown: list"]
B3["Unsupported markdown: list"]
D1["packages/domain/dist/<br>ESM modules"]
D2["packages/client/dist/<br>Static assets"]
D3["packages/server/dist/<br>Node.js bundle"]

B1 --> D1
B2 --> D2
B3 --> D3

subgraph subGraph1 ["Output Artifacts"]
    D1
    D2
    D3
end

subgraph subGraph0 ["Build Order"]
    B1
    B2
    B3
    B1 --> B2
    B1 --> B3
end
```

The build command in [`package.json L13](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/`package.json#L13-L13)

 explicitly chains workspace builds:

```

```

**Sources:** [package.json L13](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/package.json#L13-L13)

---

## Package Manager Configuration

The project enforces specific tooling versions via the `packageManager` field in [`package.json L4](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/`package.json#L4-L4)

:

```

```

This ensures all developers use the same package manager version, preventing lock file conflicts. The pnpm configuration also includes version overrides in [`package.json L48-L63](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/`package.json#L48-L63)

 to align Effect-TS ecosystem packages across the workspace.

**pnpm Workspace Features Used:**

* Workspace protocol for inter-package dependencies (`workspace:*`)
* Shared lock file (`pnpm-lock.yaml`) for consistent installs
* Filtering for targeted package operations (`pnpm --filter`)
* Overrides for dependency version alignment

**Sources:** [package.json L4](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/package.json#L4-L4)

 [package.json L48-L63](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/package.json#L48-L63)

---

## Next Steps

After completing the setup process:

1. **Configure environment variables** - See [Environment Configuration](/lucas-barake/effect-file-manager/2.1-environment-configuration) for detailed variable documentation and configuration examples for different environments.
2. **Start development servers** - See [Running Locally](/lucas-barake/effect-file-manager/2.2-running-locally) for comprehensive instructions on starting services, viewing logs, and troubleshooting common issues.
3. **Understand the architecture** - Proceed to [Architecture Overview](/lucas-barake/effect-file-manager/3-architecture-overview) to learn about the client-server communication patterns, Effect-TS integration, and overall system design.
4. **Explore the file upload system** - The core feature is documented in [File Upload System](/lucas-barake/effect-file-manager/4-file-upload-system), which explains the state machine, compression, and synchronization mechanisms.

**Sources:** [README.md L1-L50](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/README.md#L1-L50)