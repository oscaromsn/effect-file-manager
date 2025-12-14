# Environment Configuration

> **Relevant source files**
> * [.env.example](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.env.example)
> * [docker-compose.yml](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml)

## Purpose and Scope

This document describes all environment variables required to run the Effect File Manager application. Environment configuration bridges local development infrastructure (PostgreSQL, Jaeger) with application services (server, client) and external dependencies (UploadThing).

For instructions on starting the local development environment with these configurations, see [Running Locally](/lucas-barake/effect-file-manager/2.2-running-locally). For details on the Docker infrastructure these variables connect to, see [Infrastructure & Observability](/lucas-barake/effect-file-manager/9-infrastructure-and-observability).

---

## Configuration Architecture

The application uses environment variables to configure three distinct layers: server runtime, client build-time, and local infrastructure. The `.env.example` file serves as the canonical template for all required variables.

**Diagram: Environment Variable Flow**

```mermaid
flowchart TD

EnvFile[".env file<br>(gitignored)"]
EnvExample[".env.example<br>(version controlled)"]
ServerEnv["process.env<br>Runtime Variables"]
DatabaseUrl["DATABASE_URL"]
Port["PORT"]
ApiUrl["API_URL"]
OtlpUrl["OTLP_URL"]
UploadSecret["UPLOADTHING_SECRET"]
ViteEnv["import.meta.env<br>Build-time Variables"]
ViteApiUrl["VITE_API_URL"]
PostgresContainer["postgres:16-alpine<br>Container"]
JaegerContainer["jaegertracing/all-in-one<br>Container"]

EnvExample --> EnvFile
EnvFile --> ServerEnv
EnvFile --> ViteEnv
DatabaseUrl --> PostgresContainer
OtlpUrl --> JaegerContainer
ViteApiUrl --> Port

subgraph subGraph2 ["Docker Compose"]
    PostgresContainer
    JaegerContainer
end

subgraph subGraph1 ["Client Build (Vite)"]
    ViteEnv
    ViteApiUrl
    ViteEnv --> ViteApiUrl
end

subgraph subGraph0 ["Server Process (@example/server)"]
    ServerEnv
    DatabaseUrl
    Port
    ApiUrl
    OtlpUrl
    UploadSecret
    ServerEnv --> DatabaseUrl
    ServerEnv --> Port
    ServerEnv --> ApiUrl
    ServerEnv --> OtlpUrl
    ServerEnv --> UploadSecret
end
```

**Sources:** [.env.example L1-L14](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.env.example#L1-L14)

 [docker-compose.yml L1-L48](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L1-L48)

---

## Environment Variables Reference

### Server Variables

Server-side environment variables are consumed directly by the Node.js process in `@example/server`. These variables configure database connections, API endpoints, tracing, and external service integrations.

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | `postgresql://postgres:postgres@localhost:5432/effect-files-example` | PostgreSQL connection string for Effect SQL client |
| `PORT` | No | `3001` | HTTP/WebSocket server listening port |
| `API_URL` | Yes | `http://localhost:3001` | Public-facing API URL for callbacks and CORS |
| `OTLP_URL` | Yes | `http://localhost:4318/v1/traces` | OpenTelemetry Protocol endpoint for Jaeger |
| `UPLOADTHING_SECRET` | Yes | `sk_live_xxxxx` | UploadThing API secret key for presigned URL generation |

**Sources:** [.env.example L1-L10](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.env.example#L1-L10)

#### DATABASE_URL

Connection string format: `postgresql://[user]:[password]@[host]:[port]/[database]`

The server uses this to initialize the Effect SQL PostgreSQL client. The database schema is managed by the application and stores file/folder metadata. The default value matches the Docker Compose PostgreSQL service configuration.

**Related components:**

* PostgreSQL container: [docker-compose.yml L2-L15](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L2-L15)
* Database credentials match: user=`postgres`, password=`postgres`, database=`effect-files-example`

#### PORT

Defines the TCP port for the RPC WebSocket server. The server listens for NDJSON-formatted RPC messages over WebSocket connections on this port. The client must be configured to connect to this same port.

#### API_URL

Full URL (including protocol and port) where the server is accessible. Used for generating callback URLs and configuring CORS policies. Must match the protocol, hostname, and port where the server actually runs.

#### OTLP_URL

HTTP endpoint for the OpenTelemetry Protocol (OTLP) exporter. The server sends distributed tracing spans to this endpoint, which should point to a Jaeger collector configured with OTLP support.

**Related Jaeger configuration:**

* Jaeger OTLP HTTP port: [docker-compose.yml L29](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L29-L29)  exposes `4318:4318`
* OTLP enabled: [docker-compose.yml L35](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L35-L35)  sets `COLLECTOR_OTLP_ENABLED=true`

#### UPLOADTHING_SECRET

Secret key obtained from UploadThing dashboard. Required to authenticate requests for presigned upload URLs. The key format is `sk_live_` followed by the secret token. This credential should never be committed to version control.

**Security note:** This secret grants full access to the UploadThing account. Rotate immediately if exposed.

---

### Client Variables

Client-side environment variables are prefixed with `VITE_` and are embedded into the compiled JavaScript bundle at build time. These variables are **not runtime-configurable** once the client is built.

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `VITE_API_URL` | Yes | `http://localhost:3001` | Server API base URL for RPC WebSocket connection |

**Sources:** [.env.example L12-L13](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.env.example#L12-L13)

#### VITE_API_URL

Base URL for establishing the WebSocket RPC connection from the client to the server. The client appends `/rpc` to this URL to form the complete WebSocket endpoint. Must match the server's `API_URL` and `PORT` combination.

**Build-time embedding:** Vite replaces `import.meta.env.VITE_API_URL` references with the literal string value during build. Changing this variable requires rebuilding the client.

---

## Configuration Relationships

**Diagram: Service Configuration Dependencies**

```mermaid
flowchart TD

DbUrl["DATABASE_URL"]
ServerPort["PORT"]
OtlpUrl["OTLP_URL"]
ViteApiUrl["VITE_API_URL"]
UploadSecret["UPLOADTHING_SECRET"]
Postgres["postgres<br>localhost:5432"]
Jaeger["jaeger<br>localhost:4318"]
SqlClient["@effect/sql<br>PostgreSQL Client"]
OtelExporter["OpenTelemetry<br>OTLP Exporter"]
RpcServer["RPC WebSocket<br>Server"]
UploadThingClient["UploadThing<br>API Client"]
RpcClient["RPC WebSocket<br>Client"]

DbUrl --> SqlClient
SqlClient --> Postgres
OtlpUrl --> OtelExporter
OtelExporter --> Jaeger
ServerPort --> RpcServer
ViteApiUrl --> RpcServer
RpcClient --> RpcServer
UploadSecret --> UploadThingClient

subgraph subGraph3 ["Client Application"]
    RpcClient
end

subgraph subGraph2 ["Server Application"]
    SqlClient
    OtelExporter
    RpcServer
    UploadThingClient
end

subgraph subGraph1 ["Docker Services"]
    Postgres
    Jaeger
end

subgraph subGraph0 ["Environment Variables"]
    DbUrl
    ServerPort
    OtlpUrl
    ViteApiUrl
    UploadSecret
end
```

**Sources:** [.env.example L1-L14](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.env.example#L1-L14)

 [docker-compose.yml L1-L48](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L1-L48)

---

## Local Development Setup

### Step 1: Create Environment File

Copy the example environment file and customize for your local setup:

```
cp .env.example .env
```

### Step 2: Obtain UploadThing Secret

1. Create an account at uploadthing.com
2. Create a new application
3. Navigate to API Keys
4. Copy the secret key (starts with `sk_live_`)
5. Replace `UPLOADTHING_SECRET` in `.env`

### Step 3: Start Infrastructure

Ensure Docker is running, then start PostgreSQL and Jaeger:

```
docker-compose up -d
```

The following services will be available:

* PostgreSQL: `localhost:5432`
* Jaeger UI: `http://localhost:16686`
* Jaeger OTLP: `http://localhost:4318`

### Step 4: Verify Configuration

Default values in `.env.example` are configured to work with the Docker Compose services without modification. The table below shows the mapping:

| Service | Environment Variable | Docker Compose Setting | Match |
| --- | --- | --- | --- |
| PostgreSQL | `DATABASE_URL` port | [docker-compose.yml L10](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L10-L10) <br>  `5432:5432` | ✓ |
| PostgreSQL | `DATABASE_URL` user | [docker-compose.yml L6](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L6-L6) <br>  `POSTGRES_USER: postgres` | ✓ |
| PostgreSQL | `DATABASE_URL` password | [docker-compose.yml L7](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L7-L7) <br>  `POSTGRES_PASSWORD: postgres` | ✓ |
| PostgreSQL | `DATABASE_URL` database | [docker-compose.yml L8](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L8-L8) <br>  `POSTGRES_DB: effect-files-example` | ✓ |
| Jaeger | `OTLP_URL` port | [docker-compose.yml L29](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L29-L29) <br>  `4318:4318` | ✓ |

**Sources:** [.env.example L2](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.env.example#L2-L2)

 [docker-compose.yml L2-L15](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L2-L15)

 [docker-compose.yml L18-L39](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L18-L39)

---

## Environment-Specific Configuration

### Development Environment

The default `.env.example` values are optimized for local development:

* Services run on `localhost`
* PostgreSQL and Jaeger run in Docker containers
* Server runs directly on host (not containerized)
* Client connects to local server

### Production Environment

Production deployments require different values:

| Variable | Production Consideration |
| --- | --- |
| `DATABASE_URL` | Use managed PostgreSQL (e.g., Neon, Supabase) with SSL |
| `API_URL` | Must match production domain with HTTPS |
| `VITE_API_URL` | Must match production domain with HTTPS |
| `OTLP_URL` | Point to production Jaeger or managed tracing service |
| `PORT` | May be set by hosting platform (e.g., `process.env.PORT`) |
| `UPLOADTHING_SECRET` | Use production UploadThing account |

**Security requirements for production:**

* Never commit `.env` to version control
* Use secret management service (e.g., AWS Secrets Manager, Doppler)
* Enable SSL/TLS for all connections
* Restrict CORS origins in `API_URL` configuration
* Rotate `UPLOADTHING_SECRET` periodically

---

## Validation and Error Handling

The application does not perform explicit environment variable validation at startup. Missing or malformed variables will cause runtime errors when the affected service is first accessed:

| Missing Variable | Error Symptom |
| --- | --- |
| `DATABASE_URL` | SQL client initialization fails, server crashes on first database query |
| `UPLOADTHING_SECRET` | Upload initiation fails with authentication error |
| `OTLP_URL` | Tracing export fails silently (application continues) |
| `VITE_API_URL` | Client fails to connect to server, WebSocket errors in browser console |

**Recommended validation approach:**

1. Start Docker services
2. Start server (will fail fast if database unreachable)
3. Start client (will show connection errors immediately)
4. Verify Jaeger UI accessible at `http://localhost:16686`

---

## Configuration File Reference

The repository contains two configuration files for environment setup:

| File | Purpose | Version Control |
| --- | --- | --- |
| `.env.example` | Template with documented defaults | Committed ([.env.example L1-L14](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.env.example#L1-L14) <br> ) |
| `.env` | Actual environment variables with secrets | Gitignored (never committed) |

**Sources:** [.env.example L1-L14](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.env.example#L1-L14)

---

## Network Configuration Diagram

**Diagram: Port Mapping and Network Flow**

```mermaid
flowchart TD

ClientBrowser["Client Browser<br>Vite Dev Server"]
ServerProc["Server Process<br>Node.js"]
EnvVars[".env Configuration"]
PostgresPort["PostgreSQL<br>5432:5432"]
JaegerOtlp["Jaeger OTLP<br>4318:4318"]
JaegerUI["Jaeger UI<br>16686:16686"]

ServerProc --> PostgresPort
ServerProc --> JaegerOtlp
ClientBrowser --> JaegerUI

subgraph subGraph1 ["Docker Network (jaeger-network)"]
    PostgresPort
    JaegerOtlp
    JaegerUI
end

subgraph subGraph0 ["Host Machine (localhost)"]
    ClientBrowser
    ServerProc
    EnvVars
    EnvVars --> ClientBrowser
    EnvVars --> ServerProc
    EnvVars --> ServerProc
    EnvVars --> ServerProc
    ClientBrowser --> ServerProc
end
```

**Sources:** [.env.example L2-L7](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.env.example#L2-L7)

 [.env.example L13](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.env.example#L13-L13)

 [docker-compose.yml L10](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L10-L10)

 [docker-compose.yml L27-L29](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L27-L29)

---

## Summary

Environment configuration in the Effect File Manager follows a clear separation:

* **Server variables** (`DATABASE_URL`, `PORT`, `OTLP_URL`, `UPLOADTHING_SECRET`) configure runtime services
* **Client variables** (`VITE_API_URL`) are embedded at build time
* **Infrastructure variables** are defined in Docker Compose and match the `.env` defaults

The `.env.example` file provides working defaults for local development. Copy it to `.env`, add your `UPLOADTHING_SECRET`, and the application will connect to the Docker Compose infrastructure without further configuration changes.