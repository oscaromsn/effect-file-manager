# Running Locally

> **Relevant source files**
> * [README.md](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/README.md)
> * [docker-compose.yml](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml)
> * [package.json](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/package.json)

## Purpose and Scope

This document provides step-by-step instructions for starting the Effect File Manager application in a local development environment. It covers prerequisite software, infrastructure startup via Docker Compose, database migration, and running both the server and client development servers.

For environment variable configuration details, see [Environment Configuration](/lucas-barake/effect-file-manager/2.1-environment-configuration). For understanding the monorepo package structure, see [Monorepo Structure](/lucas-barake/effect-file-manager/3.1-monorepo-structure).

---

## Prerequisites

The following software must be installed on your development machine:

| Software | Version | Purpose |
| --- | --- | --- |
| Node.js | 22.14.0 | JavaScript runtime for server and build tools |
| pnpm | 10.3.0 | Package manager for monorepo workspace management |
| Docker | Latest | Containerization for PostgreSQL and Jaeger services |

**Sources:** [package.json L5-L8](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/package.json#L5-L8)

---

## Infrastructure Services

The application depends on two containerized services defined in [docker-compose.yml](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml)

 These services must be running before starting the development servers.

### Service Overview

```mermaid
flowchart TD

Postgres["postgres<br>(effect-files-example-postgres)<br>Port: 5432"]
Jaeger["jaeger<br>(effect-files-example-jaeger)<br>Ports: 16686, 4317, 4318"]
Server["@example/server<br>Port: 3001"]
Client["@example/client<br>Port: 5173"]
Browser["Web Browser"]
JaegerUI["Jaeger UI<br>Unsupported markdown: link"]

Server --> Postgres
Server --> Jaeger
Browser --> Client
JaegerUI --> Jaeger

subgraph subGraph2 ["Developer Access"]
    Browser
    JaegerUI
    Browser --> JaegerUI
end

subgraph subGraph1 ["Development Servers"]
    Server
    Client
    Client --> Server
end

subgraph subGraph0 ["Docker Compose Services"]
    Postgres
    Jaeger
    Postgres --> Jaeger
end
```

**Sources:** [docker-compose.yml L1-L48](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L1-L48)

 [README.md L26-L37](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/README.md#L26-L37)

### Service Specifications

| Service | Container Name | Image | Exposed Ports | Purpose |
| --- | --- | --- | --- | --- |
| `postgres` | `effect-files-example-postgres` | `postgres:16-alpine` | 5432 | File metadata storage |
| `jaeger` | `effect-files-example-jaeger` | `jaegertracing/all-in-one:latest` | 16686 (UI), 4317 (OTLP gRPC), 4318 (OTLP HTTP) | Distributed tracing |

**Sources:** [docker-compose.yml L2-L15](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L2-L15)

 [docker-compose.yml L17-L39](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L17-L39)

### PostgreSQL Configuration

The PostgreSQL service uses the following credentials (defined in [docker-compose.yml L5-L8](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L5-L8)

):

```yaml
POSTGRES_USER: postgres
POSTGRES_PASSWORD: postgres
POSTGRES_DB: effect-files-example
```

Data is persisted in the `postgres_data` Docker volume [docker-compose.yml L46](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L46-L46)

### Network Topology

Both services connect through the `jaeger-network` bridge network [docker-compose.yml L41-L43](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L41-L43)

 enabling communication between PostgreSQL and Jaeger for potential trace storage (though the default configuration uses in-memory storage).

**Sources:** [docker-compose.yml L13-L14](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L13-L14)

 [docker-compose.yml L37-L38](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L37-L38)

 [docker-compose.yml L41-L43](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L41-L43)

---

## Startup Sequence

The following diagram shows the complete startup sequence with actual script names from [package.json](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/package.json)

:

```mermaid
sequenceDiagram
  participant Developer
  participant pnpm CLI
  participant Docker Compose
  participant PostgreSQL Container
  participant Jaeger Container
  participant @example/server
  participant @example/client

  Developer->>pnpm CLI: pnpm install
  note over pnpm CLI: Installs workspace dependencies
  Developer->>Docker Compose: docker compose up -d
  Docker Compose->>PostgreSQL Container: Start effect-files-example-postgres
  Docker Compose->>Jaeger Container: Start effect-files-example-jaeger
  note over PostgreSQL Container,Jaeger Container: Services running in detached mode
  Developer->>pnpm CLI: pnpm db:migrate
  pnpm CLI->>@example/server: Execute migration script
  @example/server->>PostgreSQL Container: Apply SQL migrations
  PostgreSQL Container-->>@example/server: Migration complete
  Developer->>pnpm CLI: pnpm dev:server
  note over @example/server: Server starts on port 3001
  @example/server->>PostgreSQL Container: Connect to database
  @example/server->>Jaeger Container: Initialize tracer
  Developer->>pnpm CLI: pnpm dev:client (in new terminal)
  note over @example/client: Vite dev server on port 5173
  Developer->>@example/client: Open http://localhost:5173
```

**Sources:** [package.json L12-L28](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/package.json#L12-L28)

 [README.md L18-L35](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/README.md#L18-L35)

---

## Step-by-Step Instructions

### Step 1: Install Dependencies

```

```

This command installs all workspace dependencies for the monorepo. The workspace configuration is defined in [package.json L9-L11](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/package.json#L9-L11)

**Sources:** [README.md L20](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/README.md#L20-L20)

 [package.json L9-L11](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/package.json#L9-L11)

### Step 2: Configure Environment

Copy the example environment file and configure required secrets:

```

```

Edit `.env` and set the `UPLOADTHING_SECRET` variable with your UploadThing API key. For detailed information about all environment variables, see [Environment Configuration](/lucas-barake/effect-file-manager/2.1-environment-configuration).

**Sources:** [README.md L23-L24](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/README.md#L23-L24)

### Step 3: Start Infrastructure Services

Start PostgreSQL and Jaeger in detached mode:

```

```

This executes the service definitions in [docker-compose.yml](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml)

 The `-d` flag runs containers in the background.

To verify services are running:

```

```

Expected output:

| NAME | STATUS | PORTS |
| --- | --- | --- |
| effect-files-example-postgres | running | 0.0.0.0:5432->5432/tcp |
| effect-files-example-jaeger | running | 0.0.0.0:16686->16686/tcp, ... |

**Sources:** [README.md L26-L27](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/README.md#L26-L27)

 [docker-compose.yml L1-L48](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L1-L48)

### Step 4: Run Database Migrations

Execute SQL migrations to create the database schema:

```

```

This script [package.json L27](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/package.json#L27-L27)

 delegates to the server package's migration command. It connects to PostgreSQL using the `DATABASE_URL` environment variable and applies migrations from the server's migration directory.

**Alternative:** To reset the database (drop all tables and reapply migrations):

```

```

This executes the `db:reset` script [package.json L28](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/package.json#L28-L28)

**Sources:** [README.md L30](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/README.md#L30-L30)

 [package.json L27-L28](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/package.json#L27-L28)

### Step 5: Start Development Servers

The server and client must be started in separate terminal sessions.

#### Terminal 1: Server

```

```

This executes `pnpm --filter @example/server dev` [package.json L25](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/package.json#L25-L25)

 starting the Node.js server with hot-reload. The server:

* Listens on `http://localhost:3001`
* Connects to PostgreSQL at `localhost:5432`
* Sends OpenTelemetry traces to Jaeger at `localhost:4318`
* Exposes WebSocket RPC endpoints

**Sources:** [README.md L33](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/README.md#L33-L33)

 [package.json L25](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/package.json#L25-L25)

#### Terminal 2: Client

```

```

This executes `pnpm --filter @example/client dev` [package.json L26](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/package.json#L26-L26)

 starting the Vite development server. The client:

* Serves the React application at `http://localhost:5173`
* Enables hot module replacement (HMR)
* Proxies WebSocket connections to the server

**Sources:** [README.md L34](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/README.md#L34-L34)

 [package.json L26](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/package.json#L26-L26)

---

## Service Access Points

Once all services are running, access the application through the following URLs:

| Service | URL | Purpose |
| --- | --- | --- |
| Client Application | [http://localhost:5173](http://localhost:5173) | Main user interface |
| Server API | [http://localhost:3001](http://localhost:3001) | WebSocket RPC endpoint |
| Jaeger UI | [http://localhost:16686](http://localhost:16686) | Trace visualization and query |
| PostgreSQL | localhost:5432 | Database (use `psql` or GUI client) |

**Sources:** [README.md L33-L37](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/README.md#L33-L37)

---

## Development Workflow Diagram

This diagram maps the development workflow to actual npm scripts and services:

```mermaid
flowchart TD

Install["pnpm install<br>(Install dependencies)"]
CopyEnv["cp .env.example .env<br>(Configure environment)"]
DockerUp["docker compose up -d<br>(Start infrastructure)"]
Migrate["pnpm db:migrate<br>(Apply SQL migrations)"]
DevServer["pnpm dev:server<br>(@example/server on 3001)"]
DevClient["pnpm dev:client<br>(@example/client on 5173)"]
Browser["Open Unsupported markdown: link"]
Jaeger["Open Unsupported markdown: link<br>(Optional: view traces)"]

CopyEnv --> DockerUp
DevClient --> Browser

subgraph Development ["Development"]
    Browser
    Jaeger
    Browser --> Jaeger
end

subgraph subGraph1 ["Per-session Startup"]
    DockerUp
    Migrate
    DevServer
    DevClient
    DockerUp --> Migrate
    Migrate --> DevServer
    DevServer --> DevClient
end

subgraph subGraph0 ["One-time Setup"]
    Install
    CopyEnv
    Install --> CopyEnv
end
```

**Sources:** [README.md L18-L37](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/README.md#L18-L37)

 [package.json L25-L28](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/package.json#L25-L28)

---

## Troubleshooting

### Port Conflicts

If ports are already in use, modify the port mappings in [docker-compose.yml](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml)

 or stop conflicting services:

| Port | Service | Check Command |
| --- | --- | --- |
| 5432 | PostgreSQL | `lsof -i :5432` (Unix) or `netstat -ano \| findstr :5432` (Windows) |
| 16686 | Jaeger UI | `lsof -i :16686` (Unix) or `netstat -ano \| findstr :16686` (Windows) |
| 3001 | Server | `lsof -i :3001` (Unix) or `netstat -ano \| findstr :3001` (Windows) |
| 5173 | Client | `lsof -i :5173` (Unix) or `netstat -ano \| findstr :5173` (Windows) |

### Container Health Checks

Verify container status and logs:

```

```

**Sources:** [docker-compose.yml L1-L48](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L1-L48)

### Database Connection Issues

If the server cannot connect to PostgreSQL:

1. Verify the `DATABASE_URL` in `.env` matches the PostgreSQL configuration
2. Ensure the PostgreSQL container is running: `docker compose ps postgres`
3. Test connection manually: `psql -h localhost -U postgres -d effect-files-example`

Default connection string: `postgresql://postgres:postgres@localhost:5432/effect-files-example`

**Sources:** [docker-compose.yml L5-L8](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L5-L8)

### Missing Environment Variables

If the server fails to start due to missing environment variables, verify `.env` contains:

* `UPLOADTHING_SECRET` (required for file uploads)
* `DATABASE_URL` (required for database connection)
* `PORT` (optional, defaults to 3001)

See [Environment Configuration](/lucas-barake/effect-file-manager/2.1-environment-configuration) for complete variable documentation.

**Sources:** [README.md L23-L24](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/README.md#L23-L24)

---

## Stopping Services

To stop development:

1. Stop the server and client: `Ctrl+C` in each terminal
2. Stop Docker services: `docker compose down`
3. To remove volumes (deletes database data): `docker compose down -v`

To restart just the infrastructure without rebuilding:

```

```

**Sources:** [docker-compose.yml L1-L48](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L1-L48)