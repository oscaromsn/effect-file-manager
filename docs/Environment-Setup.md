# Environment Setup

> **Relevant source files**
> * [.gitignore](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/.gitignore)
> * [README.md](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/README.md)
> * [bun.lock](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/bun.lock)
> * [package.json](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json)
> * [packages/server/package.json](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/package.json)

This page provides step-by-step instructions for setting up a local development environment for TalentScore. It covers installing dependencies, configuring environment variables, starting Docker services (PostgreSQL and Jaeger), running database migrations, generating BAML client code, and launching development servers.

For information about available build and development commands, see [Build and Development Commands](/oscaromsn/TalentScore/6.2-build-and-development-commands). For observability configuration details, see [Observability and Debugging](/oscaromsn/TalentScore/6.3-observability-and-debugging).

---

## Prerequisites

The following tools and versions must be installed before setting up TalentScore:

| Requirement | Version | Purpose |
| --- | --- | --- |
| **Node.js** | 22.14.0 | JavaScript runtime for server and build tools |
| **pnpm** | 10.3.0 | Package manager (enforced via `packageManager` field) |
| **Docker** | Latest stable | Container runtime for PostgreSQL and Jaeger |
| **Docker Compose** | v2+ | Orchestration for local infrastructure services |

The Node.js and pnpm versions are enforced by [package.json L4-L8](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L4-L8)

 in the monorepo root. Using mismatched versions will cause pnpm to fail with a version error.

### Required API Keys

At least one LLM provider API key is required for resume parsing:

* **OpenAI API Key**: Required if using the default `CustomGPT5` BAML client
* **Anthropic API Key**: Alternative if using `CustomOpus4` or `CustomSonnet4` clients

Additionally:

* **UploadThing Token**: Required for file upload functionality (v7 API)

**Sources**: [package.json L4-L8](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L4-L8)

 [README.md L32-L36](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/README.md#L32-L36)

---

## Installation Workflow

The following diagram shows the complete environment setup process from initial clone through running development servers:

```

```

**Sources**: [README.md L38-L82](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/README.md#L38-L82)

---

## Step 1: Install Dependencies

Navigate to the monorepo root and install all workspace dependencies:

```

```

This command:

* Installs all dependencies for `packages/domain`, `packages/server`, and `packages/client`
* Applies version overrides defined in [package.json L53-L67](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L53-L67)  to ensure Effect ecosystem packages are synchronized
* Creates `node_modules` directories in each workspace package
* Generates `pnpm-lock.yaml` (should not be committed per [.gitignore L3](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/.gitignore#L3-L3) )

The `packageManager` field in [package.json L4](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L4-L4)

 enforces pnpm 10.3.0. Using `npm` or `yarn` will fail.

**Sources**: [package.json L4](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L4-L4)

 [package.json L9-L11](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L9-L11)

 [package.json L53-L67](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L53-L67)

 [.gitignore L3](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/.gitignore#L3-L3)

---

## Step 2: Configure Environment Variables

TalentScore uses a single `.env` file at the monorepo root for all environment configuration:

```

```

The `.env` file is intentionally excluded from version control via [.gitignore L10-L14](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/.gitignore#L10-L14)

### Required Environment Variables

Edit `.env` and configure the following variables:

| Variable | Description | Example |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@localhost:5432/talentscore` |
| `UPLOADTHING_TOKEN` | UploadThing v7 API token | `sk_live_...` |
| `OPENAI_API_KEY` | OpenAI API key for GPT models | `sk-proj-...` |

**Optional Variables**:

| Variable | Description | Default |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude models | (none) |
| `PORT` | Server HTTP port | `3001` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Jaeger trace endpoint | `http://localhost:4318/v1/traces` |

### Environment Variable Loading

The server development script loads environment variables via `dotenv-cli`:

```

```

This pattern ensures the root `.env` file is loaded before the server starts. See [packages/server/package.json L17](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/package.json#L17-L17)

 for the exact command.

**Sources**: [README.md L44-L56](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/README.md#L44-L56)

 [.gitignore L10-L14](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/.gitignore#L10-L14)

 [packages/server/package.json L17](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/package.json#L17-L17)

---

## Step 3: Start Infrastructure Services

TalentScore requires PostgreSQL (for data persistence) and Jaeger (for distributed tracing). Both are provided via Docker Compose:

```

```

### Infrastructure Service Mapping

```mermaid
flowchart TD

PostgreSQL["PostgreSQL<br>port 5432<br>user: talentscore"]
Jaeger["Jaeger<br>port 16686 (UI)<br>port 4318 (OTLP)"]
Server["@example/server<br>Node.js runtime"]
Client["@example/client<br>React dev server"]
EnvFile[".env<br>DATABASE_URL<br>OTEL_EXPORTER_OTLP_ENDPOINT"]

EnvFile --> PostgreSQL
EnvFile --> Jaeger
Server --> PostgreSQL
Server --> Jaeger

subgraph Configuration ["Configuration"]
    EnvFile
end

subgraph subGraph1 ["Application Services"]
    Server
    Client
    Client --> Server
end

subgraph subGraph0 ["Docker Compose Services"]
    PostgreSQL
    Jaeger
end
```

The `docker compose up -d` command:

* Starts containers in detached mode (background)
* Exposes PostgreSQL on `localhost:5432`
* Exposes Jaeger UI on `localhost:16686`
* Exposes Jaeger OTLP receiver on `localhost:4318`

To verify containers are running:

```

```

To view container logs:

```

```

**Sources**: [README.md L62-L64](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/README.md#L62-L64)

---

## Step 4: Run Database Migrations

With PostgreSQL running, apply the database schema:

```

```

This script:

* Executes [packages/server/src/db/scripts/migrator.ts](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/src/db/scripts/migrator.ts)
* Reads SQL migrations from `packages/server/src/db/migrations/`
* Creates tables: `file_folders`, `files`, `resumes`
* Applies indexes and foreign key constraints
* Uses `@effect/sql` for schema management

The migration script is defined in [packages/server/package.json L19](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/package.json#L19-L19)

:

```

```

### Database Reset

To drop all tables and re-apply the schema (useful during development):

```

```

This executes [packages/server/src/db/scripts/reset-database.ts](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/src/db/scripts/reset-database.ts)

 which drops the public schema and re-runs migrations.

**Sources**: [README.md L66](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/README.md#L66-L66)

 [package.json L27-L28](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L27-L28)

 [packages/server/package.json L19-L20](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/package.json#L19-L20)

---

## Step 5: Generate BAML Client Code

BAML (BoundaryML) requires code generation to produce TypeScript clients from `.baml` schema files:

```

```

This command:

* Executes `bunx baml-cli generate --from packages/server/baml_src`
* Reads BAML definitions from [packages/server/baml_src/](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/baml_src/) * `resume.baml`: Resume extraction schema and function * `clients.baml`: LLM client configurations
* Generates `baml_client/` directory with TypeScript types and functions
* Output is excluded from version control via [.gitignore L31](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/.gitignore#L31-L31)

The generated code includes:

* `types.ts`: TypeScript interfaces for `BamlResume`, `Education`, `Experience`, etc.
* `partial_types.ts`: Streaming partial result types
* `async_client.ts`: Effect-based async BAML client
* `stream_client.ts`: Streaming client for real-time extraction

**BAML generation must be run before building or running the server**, as server code imports from the generated `baml_client` directory.

**Sources**: [README.md L68-L69](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/README.md#L68-L69)

 [package.json L29](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L29-L29)

 [.gitignore L31](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/.gitignore#L31-L31)

---

## Step 6: Start Development Servers

TalentScore requires two development processes running simultaneously:

### Terminal 1: API Server

```

```

This command:

* Executes [packages/server/package.json L17](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/package.json#L17-L17)
* Runs `tsx --watch src/server.ts` with hot-reloading
* Loads environment variables from `.env`
* Starts HTTP server on port `3001` (default)
* Initializes WebSocket RPC server
* Connects to PostgreSQL via `DATABASE_URL`
* Enables OpenTelemetry tracing to Jaeger

Server startup logs include:

```
Server listening on port 3001
Trace ID: <trace-id-hex>
```

### Terminal 2: React Client

```

```

This command:

* Executes [packages/client/package.json](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/client/package.json)  dev script
* Starts Vite dev server on port `5173` (default)
* Enables hot module replacement (HMR)
* Proxies RPC calls to `http://localhost:3001`

### Service Endpoints Table

| Service | URL | Purpose |
| --- | --- | --- |
| **React Client** | [http://localhost:5173](http://localhost:5173) | User interface |
| **API Server** | [http://localhost:3001](http://localhost:3001) | RPC server (internal) |
| **Jaeger UI** | [http://localhost:16686](http://localhost:16686) | Distributed tracing dashboard |
| **PostgreSQL** | localhost:5432 | Database (internal) |

**Sources**: [README.md L72-L85](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/README.md#L72-L85)

 [packages/server/package.json L17](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/package.json#L17-L17)

---

## Step 7: Verify Installation

After starting both servers, verify the setup:

### 1. Client Application

Navigate to [http://localhost:5173](http://localhost:5173). You should see:

* TalentScore UI with file management interface
* No console errors in browser DevTools
* WebSocket connection established (check Network tab)

### 2. Server Health

The server logs should show:

```
Server listening on port 3001
Connected to PostgreSQL
RPC server initialized
```

### 3. Jaeger Tracing

Navigate to [http://localhost:16686](http://localhost:16686):

* Select `talentscore-server` from the Service dropdown
* Search for traces
* Verify traces appear for HTTP requests

If no traces appear, check `OTEL_EXPORTER_OTLP_ENDPOINT` in `.env`.

### 4. Database Connection

Verify database schema exists:

```

```

Expected output should list `file_folders`, `files`, and `resumes` tables.

**Sources**: [README.md L84-L85](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/README.md#L84-L85)

---

## Development Workflow Dependencies

The following diagram shows the dependency relationships between setup steps and development tasks:

```mermaid
flowchart TD

NodeInstall["Node.js 22.14.0 installed"]
PnpmInstall["pnpm 10.3.0 installed"]
DockerInstall["Docker installed"]
Clone["Repository cloned"]
DepsInstall["pnpm install"]
EnvConfig[".env configured"]
DockerUp["docker compose up -d"]
DBMigrate["pnpm db:migrate"]
BAMLGen["pnpm baml:generate"]
DevServer["pnpm dev:server"]
DevClient["pnpm dev:client"]
TypeCheck["pnpm check"]
Test["pnpm test"]
Build["pnpm build"]

NodeInstall --> DepsInstall
PnpmInstall --> DepsInstall
DockerInstall --> DockerUp
EnvConfig --> DockerUp
DepsInstall --> BAMLGen
BAMLGen --> DevServer
BAMLGen --> Build
DBMigrate --> DevServer
DepsInstall --> TypeCheck
DepsInstall --> Test
BAMLGen --> Test

subgraph Development ["Development"]
    DevServer
    DevClient
    TypeCheck
    Test
    Build
    DevServer --> DevClient
end

subgraph subGraph3 ["Code Generation"]
    BAMLGen
end

subgraph Infrastructure ["Infrastructure"]
    DockerUp
    DBMigrate
    DockerUp --> DBMigrate
end

subgraph subGraph1 ["Project Setup"]
    Clone
    DepsInstall
    EnvConfig
    Clone --> DepsInstall
    DepsInstall --> EnvConfig
end

subgraph subGraph0 ["One-Time Setup"]
    NodeInstall
    PnpmInstall
    DockerInstall
end
```

**Key Dependencies**:

* `pnpm install` must complete before `pnpm baml:generate`
* `pnpm baml:generate` must complete before server can build or run
* `docker compose up -d` must complete before `pnpm db:migrate`
* `pnpm db:migrate` must complete before server can connect to database

**Sources**: [README.md L38-L82](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/README.md#L38-L82)

 [package.json L12-L29](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L12-L29)

---

## Troubleshooting Common Setup Issues

### Issue: pnpm version mismatch

**Symptom**:

```yaml
ERROR: This project requires pnpm version 10.3.0
```

**Solution**: Install the exact version via Corepack:

```

```

### Issue: BAML generation fails

**Symptom**:

```yaml
Error: Cannot find module 'baml_client'
```

**Solution**:

```

```

Verify `packages/server/baml_client/` directory exists after generation.

### Issue: Database connection fails

**Symptom**:

```yaml
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution**:

```

```

Check `DATABASE_URL` in `.env` matches Docker configuration.

### Issue: Port already in use

**Symptom**:

```yaml
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution**: Kill process using the port or configure alternative port in `.env`:

```

```

Or set `PORT=3002` in `.env`.

**Sources**: [package.json L4](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L4-L4)

 [README.md L44-L56](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/README.md#L44-L56)

---

## Environment Variable Reference

Complete list of environment variables used by TalentScore:

```mermaid
flowchart TD

DBUrl["DATABASE_URL"]
UploadToken["UPLOADTHING_TOKEN"]
OpenAIKey["OPENAI_API_KEY"]
AnthropicKey["ANTHROPIC_API_KEY"]
Port["PORT"]
OtelEndpoint["OTEL_EXPORTER_OTLP_ENDPOINT"]
SQL["@effect/sql-pg<br>PostgreSQL client"]
UploadThing["UploadThing API<br>File storage"]
BAML["BAML Engine<br>LLM extraction"]
HTTP["Node.js HTTP<br>Server"]
Otel["OpenTelemetry<br>Tracing"]

DBUrl --> SQL
UploadToken --> UploadThing
OpenAIKey --> BAML
AnthropicKey --> BAML
Port --> HTTP
OtelEndpoint --> Otel

subgraph subGraph1 ["Server Services"]
    SQL
    UploadThing
    BAML
    HTTP
    Otel
end

subgraph subGraph0 [".env File"]
    DBUrl
    UploadToken
    OpenAIKey
    AnthropicKey
    Port
    OtelEndpoint
end
```

### Variable Usage Matrix

| Variable | Required | Used By | Default |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | `@effect/sql-pg`, migrations | (none) |
| `UPLOADTHING_TOKEN` | Yes | Files RPC service | (none) |
| `OPENAI_API_KEY` | Conditional* | BAML OpenAI clients | (none) |
| `ANTHROPIC_API_KEY` | Conditional* | BAML Anthropic clients | (none) |
| `PORT` | No | HTTP server | `3001` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | No | OpenTelemetry exporter | `http://localhost:4318/v1/traces` |

* At least one LLM provider key is required

**Sources**: [README.md L52-L56](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/README.md#L52-L56)

 [packages/server/package.json L17](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/package.json#L17-L17)