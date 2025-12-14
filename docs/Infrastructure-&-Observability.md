# Infrastructure & Observability

> **Relevant source files**
> * [.env.example](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.env.example)
> * [docker-compose.yml](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml)

This document covers the local development infrastructure for the Effect File Manager, including the PostgreSQL database for file metadata persistence, Jaeger distributed tracing for observability, and the Docker Compose orchestration that manages these services. For information about the monorepo build system and CI/CD tooling, see [Development Infrastructure](/lucas-barake/effect-file-manager/8-development-infrastructure). For database schema and SQL operations, refer to the server-side documentation in the [Architecture Overview](/lucas-barake/effect-file-manager/3-architecture-overview).

---

## Docker Compose Infrastructure

The Effect File Manager uses Docker Compose to orchestrate two primary infrastructure services for local development: PostgreSQL for data persistence and Jaeger for distributed tracing. The configuration is defined in [docker-compose.yml L1-L48](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L1-L48)

**Docker Infrastructure Topology**

```mermaid
flowchart TD

PGContainer["Container: effect-files-example-postgres<br>Image: postgres:16-alpine"]
PGPort["Port 5432:5432"]
PGVolume["Volume: postgres_data<br>/var/lib/postgresql/data"]
JContainer["Container: effect-files-example-jaeger<br>Image: jaegertracing/all-in-one:latest"]
JUIPort["Port 16686 - Web UI"]
JOTLPHTTPPort["Port 4318 - OTLP HTTP"]
JOTLPGRPCPort["Port 4317 - OTLP gRPC"]
JThriftPorts["Ports 6831/6832 - Thrift"]
ServerApp["Server Application<br>Node.js"]
DevBrowser["Developer Browser"]
PGClient["Database Client<br>psql/GUI"]

ServerApp --> PGPort
ServerApp --> JOTLPHTTPPort
DevBrowser --> JUIPort
PGClient --> PGPort

subgraph subGraph3 ["Host Machine"]
    ServerApp
    DevBrowser
    PGClient
end

subgraph subGraph2 ["Docker Compose Network: jaeger-network"]

subgraph subGraph1 ["Jaeger Service"]
    JContainer
    JUIPort
    JOTLPHTTPPort
    JOTLPGRPCPort
    JThriftPorts
    JContainer --> JUIPort
    JContainer --> JOTLPHTTPPort
    JContainer --> JOTLPGRPCPort
    JContainer --> JThriftPorts
end

subgraph subGraph0 ["PostgreSQL Service"]
    PGContainer
    PGPort
    PGVolume
    PGContainer --> PGPort
    PGContainer --> PGVolume
end
end
```

**Sources:** [docker-compose.yml L1-L48](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L1-L48)

 [.env.example L1-L14](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.env.example#L1-L14)

### PostgreSQL Service Configuration

The PostgreSQL service provides persistent storage for file and folder metadata. Key configuration details:

| Configuration | Value | Purpose |
| --- | --- | --- |
| **Container Name** | `effect-files-example-postgres` | Consistent reference across restarts |
| **Image** | `postgres:16-alpine` | Lightweight PostgreSQL 16 |
| **Database Name** | `effect-files-example` | Application database |
| **Username** | `postgres` | Default superuser |
| **Password** | `postgres` | Local dev password (not production-safe) |
| **Port Mapping** | `5432:5432` | Standard PostgreSQL port exposed to host |
| **Volume** | `postgres_data:/var/lib/postgresql/data` | Persists data across container restarts |
| **Network** | `jaeger-network` | Shared network with Jaeger |
| **Restart Policy** | `unless-stopped` | Auto-restart on failures |

The service is defined in [docker-compose.yml L2-L15](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L2-L15)

 The volume mapping [docker-compose.yml L12](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L12-L12)

 ensures that database contents survive container recreation, which is critical during development to avoid re-running migrations or losing test data.

**Sources:** [docker-compose.yml L2-L15](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L2-L15)

### Jaeger Service Configuration

Jaeger provides distributed tracing capabilities through the OpenTelemetry Protocol (OTLP). The `all-in-one` image bundles the collector, query service, and web UI into a single container suitable for development:

| Port | Protocol | Purpose |
| --- | --- | --- |
| `16686` | HTTP | Jaeger UI for viewing traces |
| `4318` | HTTP | OTLP collector endpoint (used by server) |
| `4317` | gRPC | OTLP collector endpoint (alternative) |
| `6831` | UDP | Jaeger Thrift compact protocol |
| `6832` | UDP | Jaeger Thrift binary protocol |
| `14268` | HTTP | Jaeger Thrift HTTP |
| `9411` | HTTP | Zipkin compatible endpoint |

The critical configuration flags [docker-compose.yml L20-L22](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L20-L22)

 enable CORS for OTLP collection and disable TLS for local development:

* `--collector.otlp.http.cors.allowed-headers=*`: Permits cross-origin requests
* `--collector.otlp.http.tls.enabled=false`: Allows plaintext HTTP for development

Environment variables [docker-compose.yml L34-L36](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L34-L36)

 explicitly enable the OTLP collector and set the UI base path to root.

**Sources:** [docker-compose.yml L17-L39](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L17-L39)

### Network Architecture

The `jaeger-network` bridge network [docker-compose.yml L41-L43](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L41-L43)

 connects PostgreSQL and Jaeger, though they don't directly communicate. This network could support future service mesh patterns or allow database query tracing if instrumented. The bridge driver provides:

* Automatic DNS resolution between containers (e.g., `postgres` resolves to the PostgreSQL container)
* Network isolation from other Docker networks on the host
* Default connectivity to the host via gateway

**Sources:** [docker-compose.yml L41-L43](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L41-L43)

---

## Database Connection Configuration

The server application connects to PostgreSQL using the `DATABASE_URL` environment variable. The connection string format follows PostgreSQL's standard URI syntax:

```yaml
postgresql://[user]:[password]@[host]:[port]/[database]
```

For local development, the connection string is defined in [.env.example L2](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.env.example#L2-L2)

:

```yaml
postgresql://postgres:postgres@localhost:5432/effect-files-example
```

**Connection Parameters:**

| Parameter | Value | Notes |
| --- | --- | --- |
| **Protocol** | `postgresql://` | PostgreSQL driver protocol |
| **User** | `postgres` | Superuser account |
| **Password** | `postgres` | Dev-only password |
| **Host** | `localhost` | Host machine (Docker port mapping) |
| **Port** | `5432` | Default PostgreSQL port |
| **Database** | `effect-files-example` | Application schema |

The server application uses this connection string to initialize the SQL client via `@effect/sql` package, which provides Effect-based database operations with automatic connection pooling and transaction management.

**Sources:** [.env.example L2](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.env.example#L2-L2)

---

## OpenTelemetry and Distributed Tracing

The Effect File Manager integrates OpenTelemetry for comprehensive observability. The tracing pipeline captures spans from the server application and sends them to Jaeger for analysis.

**OpenTelemetry Integration Flow**

```mermaid
sequenceDiagram
  participant Server Application
  participant @example/server
  participant OpenTelemetry SDK
  participant @opentelemetry/sdk-node
  participant OTLP Exporter
  participant @opentelemetry/exporter-trace-otlp-http
  participant Jaeger Collector
  participant Port 4318
  participant Jaeger Query Service
  participant Jaeger UI
  participant Port 16686

  Server Application->>OpenTelemetry SDK: "Initialize tracer provider"
  OpenTelemetry SDK->>OTLP Exporter: "Configure OTLP HTTP exporter
  note over Server Application,@example/server: "RPC request received"
  Server Application->>OpenTelemetry SDK: url: OTLP_URL"
  Server Application->>OpenTelemetry SDK: "Start span: 'Api.list'"
  Server Application->>OpenTelemetry SDK: "Start child span: 'SQL Query'"
  OpenTelemetry SDK->>OTLP Exporter: "End spans with attributes"
  OTLP Exporter->>Jaeger Collector: "Batch spans"
  Jaeger Collector->>Jaeger Query Service: "POST /v1/traces
  note over Jaeger UI,Port 16686: "Developer opens UI"
  Jaeger UI->>Jaeger Query Service: Protobuf/JSON payload"
  Jaeger Query Service-->>Jaeger UI: "Store traces"
```

**Sources:** [.env.example L6-L7](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.env.example#L6-L7)

 [docker-compose.yml L17-L39](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L17-L39)

### OTLP Configuration

The OpenTelemetry Protocol (OTLP) endpoint is configured via the `OTLP_URL` environment variable [.env.example L7](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.env.example#L7-L7)

:

```
OTLP_URL=http://localhost:4318/v1/traces
```

This URL points to Jaeger's OTLP HTTP collector endpoint [docker-compose.yml L29](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L29-L29)

 which accepts trace spans in either Protobuf or JSON format. The server application uses the OpenTelemetry SDK to:

1. Instrument Effect-based operations with automatic span creation
2. Propagate trace context across async boundaries
3. Batch and export spans to the collector endpoint
4. Include metadata such as span names, attributes, and timing information

**Sources:** [.env.example L7](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.env.example#L7-L7)

 [docker-compose.yml L29](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L29-L29)

### Accessing Jaeger UI

The Jaeger web interface is accessible at `http://localhost:16686` [docker-compose.yml L27](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L27-L27)

 once the Docker Compose stack is running. The UI provides:

* **Service Search**: Filter traces by service name (e.g., `effect-file-manager-server`)
* **Operation View**: See all traced operations (e.g., `Api.list`, `Api.initiateUpload`)
* **Trace Timeline**: Visualize request flows with span durations
* **Dependency Graph**: Understand service interactions
* **Error Analysis**: Identify failed spans and exceptions

Traces include Effect-specific metadata like error types, fiber IDs, and layer dependencies, making it invaluable for debugging complex asynchronous workflows.

**Sources:** [docker-compose.yml L27](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L27-L27)

---

## Environment Variables Reference

All infrastructure-related environment variables are documented in [.env.example L1-L14](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.env.example#L1-L14)

 The following table categorizes them by service:

### Server Configuration

| Variable | Example Value | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/effect-files-example` | PostgreSQL connection string for `@effect/sql` |
| `PORT` | `3001` | HTTP server listen port for RPC and static files |
| `API_URL` | `http://localhost:3001` | Server's external URL (used for CORS/redirects) |

### OpenTelemetry Configuration

| Variable | Example Value | Purpose |
| --- | --- | --- |
| `OTLP_URL` | `http://localhost:4318/v1/traces` | Jaeger OTLP collector endpoint for trace export |

### UploadThing Configuration

| Variable | Example Value | Purpose |
| --- | --- | --- |
| `UPLOADTHING_SECRET` | `sk_live_xxxxx` | API secret for presigned URL generation (see [UploadThing Integration](/lucas-barake/effect-file-manager/4.3-uploadthing-integration)) |

### Client Configuration

| Variable | Example Value | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:3001` | Server endpoint for client RPC connections |

**Note:** The `.env.example` file serves as a template. Developers must copy it to `.env` and populate with actual credentials. The `.env` file is excluded from version control via `.gitignore`.

**Sources:** [.env.example L1-L14](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.env.example#L1-L14)

---

## Starting the Infrastructure

To launch the PostgreSQL and Jaeger services, run the following command from the repository root:

```

```

**Verification Steps:**

1. **Check container status:** ``` ``` Both `effect-files-example-postgres` and `effect-files-example-jaeger` should show status `Up`.
2. **Verify PostgreSQL connectivity:** ``` ``` Enter password `postgres` when prompted.
3. **Access Jaeger UI:** Navigate to `http://localhost:16686` in a browser. The UI should load with no traces initially.
4. **Run database migrations:** The server application will apply schema migrations on startup using Effect SQL's migration system.

**Sources:** [docker-compose.yml L1-L48](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L1-L48)

---

## Infrastructure Topology Diagram

The following diagram maps the complete infrastructure topology, showing how the server application, Docker services, and developer tools interact:

```mermaid
flowchart TD

ServerCode["@example/server<br>TypeScript Source"]
ClientCode["@example/client<br>React + Vite"]
EnvFile[".env File<br>DATABASE_URL<br>OTLP_URL<br>PORT"]
Browser["Web Browser<br>Unsupported markdown: link"]
PGProcess["PostgreSQL 16<br>Alpine Linux"]
PGData["Volume: postgres_data<br>Persistent Storage"]
JCollector["OTLP Collector<br>Port 4318"]
JQuery["Query Service"]
JUI["Web UI<br>Port 16686"]
JStorage["In-Memory Storage<br>Non-Persistent"]
Network["jaeger-network<br>Bridge Driver"]

ServerCode --> PGProcess
ServerCode --> JCollector
Browser --> JUI

subgraph subGraph5 ["Docker Host"]

subgraph subGraph4 ["docker-compose.yml Stack"]
    Network
    PGProcess --> Network
    JCollector --> Network

subgraph subGraph3 ["jaeger Container"]
    JCollector
    JQuery
    JUI
    JStorage
    JCollector --> JQuery
    JQuery --> JUI
    JCollector --> JStorage
end

subgraph subGraph2 ["postgres Container"]
    PGProcess
    PGData
    PGProcess --> PGData
end
end
end

subgraph subGraph1 ["Developer Machine - Host OS"]
    EnvFile
    Browser
    ServerCode --> EnvFile
    Browser --> ClientCode

subgraph subGraph0 ["pnpm Workspace"]
    ServerCode
    ClientCode
    ClientCode --> ServerCode
end
end
```

**Key Observations:**

* The **server application** runs on the host OS (not in Docker), connecting to containerized services via `localhost` port mappings.
* **PostgreSQL data** persists in a named volume, surviving container recreation.
* **Jaeger traces** are stored in-memory only (suitable for development; production would use a persistent backend like Elasticsearch).
* The **bridge network** provides container-to-container DNS but isn't utilized in the current architecture since services don't intercommunicate.

**Sources:** [docker-compose.yml L1-L48](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L1-L48)

 [.env.example L1-L14](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.env.example#L1-L14)

---

## Volume Persistence

The `postgres_data` volume [docker-compose.yml L45-L47](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L45-L47)

 ensures database persistence across Docker Compose lifecycle operations:

```

```

This volume maps to `/var/lib/postgresql/data` inside the container [docker-compose.yml L12](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L12-L12)

 which is PostgreSQL's default data directory. The local driver stores volume data in Docker's host filesystem (typically `/var/lib/docker/volumes/` on Linux).

**Volume Operations:**

| Command | Effect |
| --- | --- |
| `docker compose down` | Stops containers but **preserves** the volume |
| `docker compose down -v` | Stops containers and **deletes** the volume |
| `docker volume ls` | Lists all volumes including `effect-files-example_postgres_data` |
| `docker volume inspect effect-files-example_postgres_data` | Shows volume metadata and mount point |

**Warning:** Running `docker compose down -v` will delete all database contents, requiring re-execution of migrations and loss of test data.

**Sources:** [docker-compose.yml L12](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L12-L12)

 [docker-compose.yml L45-L47](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L45-L47)

---

## Observability Best Practices

When developing with this infrastructure, the following practices enhance observability:

1. **Trace Key Operations**: Ensure all RPC handlers and database queries are instrumented with OpenTelemetry spans. Effect-TS's integration automatically propagates trace context through Effect operations.
2. **Use Structured Logging**: Combine traces with structured logs (Effect's `Logger` service) that include trace IDs for correlation.
3. **Monitor Resource Usage**: Use `docker stats` to observe CPU and memory usage of PostgreSQL and Jaeger containers during development.
4. **Inspect Query Performance**: Jaeger traces include SQL query durations, helping identify slow queries during development.
5. **Test Trace Propagation**: Verify that trace context flows through the entire request pipeline: client RPC call → server handler → database query → response.

**Sources:** [docker-compose.yml L1-L48](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/docker-compose.yml#L1-L48)

 [.env.example L6-L7](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.env.example#L6-L7)