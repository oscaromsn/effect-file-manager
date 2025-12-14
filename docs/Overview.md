# Overview

> **Relevant source files**
> * [.env.example](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.env.example)
> * [README.md](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/README.md)
> * [package.json](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/package.json)

This document provides an introduction to the Effect File Manager repository, a demonstration application showcasing file upload capabilities with UploadThing, real-time synchronization via WebSocket RPC, and Effect-TS functional programming patterns. This page covers the project's purpose, key features, technology stack, and high-level architecture.

For environment setup and local development instructions, see [Getting Started](/lucas-barake/effect-file-manager/2-getting-started). For detailed architectural patterns, see [Architecture Overview](/lucas-barake/effect-file-manager/3-architecture-overview). For the file upload implementation details, see [File Upload System](/lucas-barake/effect-file-manager/4-file-upload-system).

## Project Purpose and Scope

The Effect File Manager is an example project that demonstrates production-grade patterns for building file management applications using the Effect-TS ecosystem. It is not a production-ready file manager but rather a reference implementation showcasing:

* **File upload patterns** using presigned URLs from UploadThing with direct client-to-S3 uploads
* **Real-time synchronization** via WebSocket-based RPC with NDJSON serialization
* **Effect-TS patterns** including Effect, Layer, Service, and dependency injection
* **Reactive state management** using `@effect-atom/atom-react` for client-side state
* **Full-stack type safety** with shared domain schemas between client and server

The repository serves as a learning resource and reference for developers building similar systems with Effect-TS.

**Sources:** [README.md L1-L12](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/README.md#L1-L12)

## Key Features

The application implements the following core capabilities:

| Feature | Implementation | Purpose |
| --- | --- | --- |
| **File Uploads** | UploadThing presigned URLs + direct S3 upload | Scalable file uploads without server bandwidth constraints |
| **Image Compression** | Web Worker-based iterative compression | Client-side optimization for images >1MB before upload |
| **Real-time Sync** | WebSocket RPC with event streams | Instant file list updates across all connected clients |
| **Folder Organization** | Hierarchical folder structure in PostgreSQL | Organize files into folders with move/create operations |
| **Upload State Machine** | Effect Atoms with state transitions | Precise UI feedback through Compressing → Uploading → Syncing → Done states |
| **Distributed Tracing** | OpenTelemetry + Jaeger integration | Observability for debugging and performance analysis |

**Sources:** [README.md L5-L12](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/README.md#L5-L12)

## Technology Stack

The project uses the following technologies across its layers:

### Core Framework

| Layer | Technology | Version | Purpose |
| --- | --- | --- | --- |
| **Runtime** | Effect-TS (`effect`) | 3.19.8 | Functional effects, dependency injection, error handling |
| **Language** | TypeScript | 5.8.3 | Type safety across client and server |
| **Package Manager** | pnpm | 10.3.0 | Monorepo workspace management |
| **Node Runtime** | Node.js | 22.14.0 | Server runtime environment |

### Client Technologies

| Technology | Purpose |
| --- | --- |
| **React** | UI component framework |
| **Vite** | Build tool and development server |
| **TanStack Router** | Type-safe routing with file-based routes |
| **@effect-atom/atom-react** | Reactive state management with Effect integration |
| **Tailwind CSS** | Utility-first styling with CSS variables |
| **Radix UI** | Unstyled accessible component primitives |

### Server Technologies

| Technology | Purpose |
| --- | --- |
| **@effect/platform-node** | Effect platform abstractions for Node.js |
| **@effect/rpc** | Type-safe RPC over WebSocket with NDJSON |
| **@effect/sql** + **@effect/sql-pg** | Effect-based PostgreSQL client |
| **@effect/opentelemetry** | OpenTelemetry integration for tracing |
| **UploadThing SDK** | Presigned URL generation for file uploads |

### Infrastructure

| Technology | Purpose |
| --- | --- |
| **PostgreSQL** | File metadata persistence |
| **Jaeger** | Distributed tracing backend (OpenTelemetry) |
| **Docker Compose** | Local development infrastructure orchestration |

**Sources:** [package.json L1-L68](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/package.json#L1-L68)

## System Architecture

The following diagram illustrates the high-level system architecture, mapping conceptual components to their actual code entities:

```mermaid
flowchart TD

Routes["routes/<br>TanStack Router"]
FilesAtoms["atoms/files-atoms.ts<br>filesAtom, uploadAtom"]
ApiClient["api.ts<br>Api.initiateUpload, Api.list"]
CompWorker["workers/image-compression.worker.ts<br>ImageCompressionClient"]
PendingUI["components/file-manager/pending-file-item.tsx<br>PendingFileItem component"]
RpcDefs["src/rpc.ts<br>Api interface"]
Schemas["src/schemas.ts<br>S.* schemas"]
RpcServer["src/rpc-server.ts<br>makeWebSocketRpcServer"]
ApiImpl["src/api/api-impl.ts<br>ApiImpl service"]
FileSyncSvc["src/api/file-sync.ts<br>FileSync service"]
DbQueries["src/db/queries/files.ts<br>listFiles, insertFile"]
EventStream["src/api/event-stream.ts<br>filesEventStream"]
UT["UploadThing API<br>presigned URL generation"]
S3["S3-compatible storage<br>file data storage"]
PG["PostgreSQL<br>files table"]
Jaeger["Jaeger<br>:16686 tracing UI"]

ApiClient --> RpcServer
DbQueries --> PG
RpcServer --> Jaeger
ApiClient --> RpcDefs
ApiClient --> Schemas
RpcServer --> RpcDefs
ApiImpl --> Schemas
ApiImpl --> UT
FilesAtoms --> S3
EventStream --> ApiClient

subgraph Infra ["Infrastructure"]
    PG
    Jaeger
end

subgraph External ["External Services"]
    UT
    S3
    UT --> S3
end

subgraph Server ["@example/server"]
    RpcServer
    ApiImpl
    FileSyncSvc
    DbQueries
    EventStream
    RpcServer --> ApiImpl
    ApiImpl --> FileSyncSvc
    ApiImpl --> DbQueries
    ApiImpl --> EventStream
end

subgraph Domain ["@example/domain"]
    RpcDefs
    Schemas
end

subgraph Client ["@example/client"]
    Routes
    FilesAtoms
    ApiClient
    CompWorker
    PendingUI
    Routes --> FilesAtoms
    FilesAtoms --> PendingUI
    FilesAtoms --> ApiClient
    FilesAtoms --> CompWorker
end
```

**Key Architectural Patterns:**

1. **Shared Contract Layer**: The `@example/domain` package ([packages/domain](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/domain) ) defines the `Api` interface and schemas used by both client and server, ensuring compile-time type safety across the network boundary.
2. **Hybrid Upload Flow**: The server ([src/api/api-impl.ts](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/src/api/api-impl.ts) ) obtains presigned URLs from UploadThing but does not proxy file data. Clients upload directly to S3-compatible storage, eliminating server bandwidth bottlenecks.
3. **WebSocket RPC**: The `makeWebSocketRpcServer` function ([src/rpc-server.ts](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/src/rpc-server.ts) ) implements bidirectional RPC using NDJSON serialization, enabling both request-response and server-push patterns over a single connection.
4. **Event-Driven Sync**: The `filesEventStream` ([src/api/event-stream.ts](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/src/api/event-stream.ts) ) broadcasts file arrival events to all connected clients, handled by `FileSync` service ([src/api/file-sync.ts](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/src/api/file-sync.ts) ) to resolve the eventual consistency challenge between upload and database availability.
5. **Effect Services**: Core business logic is implemented as Effect services (`ApiImpl`, `FileSync`) with dependency injection via Effect Layers, enabling comprehensive testing with mock implementations.

**Sources:** [README.md L5-L12](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/README.md#L5-L12)

 [package.json L9-L11](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/package.json#L9-L11)

## Monorepo Structure

The repository is organized as a pnpm workspace monorepo with three packages:

```mermaid
flowchart TD

ServerSrc["src/"]
ApiDir["api/<br>business logic"]
DbDir["db/<br>migrations + queries"]
RpcServerFile["rpc-server.ts"]
ClientSrc["src/"]
RoutesDir["routes/<br>TanStack Router"]
AtomsDir["atoms/<br>state management"]
ComponentsDir["components/<br>UI components"]
WorkersDir["workers/<br>Web Workers"]
RpcInterface["src/rpc.ts<br>Api type definition"]
SchemasDef["src/schemas.ts<br>S.Schema definitions"]
TypesDef["src/types.ts<br>shared types"]
Root["Root workspace<br>package.json"]
Domain["domain/<br>@example/domain"]
Client["client/<br>@example/client"]
Server["server/<br>@example/server"]

Root --> Domain
Root --> Client
Root --> Server

subgraph Packages ["packages/"]
    Domain
    Client
    Server
    Client --> Domain
    Server --> Domain
end

subgraph ServerContents ["Server Package Contents"]
    ServerSrc
    ApiDir
    DbDir
    RpcServerFile
    ServerSrc --> ApiDir
    ServerSrc --> DbDir
    ServerSrc --> RpcServerFile
end

subgraph ClientContents ["Client Package Contents"]
    ClientSrc
    RoutesDir
    AtomsDir
    ComponentsDir
    WorkersDir
    ClientSrc --> RoutesDir
    ClientSrc --> AtomsDir
    ClientSrc --> ComponentsDir
    ClientSrc --> WorkersDir
end

subgraph DomainContents ["Domain Package Contents"]
    RpcInterface
    SchemasDef
    TypesDef
end
```

### Package Responsibilities

| Package | Path | Exports | Dependencies |
| --- | --- | --- | --- |
| **@example/domain** | `packages/domain/` | RPC interface (`Api`), schemas (`S.*`), shared types | `effect`, `@effect/schema` |
| **@example/client** | `packages/client/` | React application, bundled static assets | `@example/domain`, `react`, `@tanstack/react-router`, `@effect-atom/atom-react` |
| **@example/server** | `packages/server/` | Node.js server executable | `@example/domain`, `@effect/platform-node`, `@effect/sql-pg`, `uploadthing` |

The domain package acts as the single source of truth for types and contracts. Both client and server depend on it but do not depend on each other, ensuring clean separation of concerns.

**Build Order:** The monorepo build sequence ([package.json L13](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/package.json#L13-L13)

) is: `domain` → `client` + `server` (parallel), ensuring the shared contract is compiled before dependent packages.

**Sources:** [package.json L9-L13](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/package.json#L9-L13)

 [README.md L39-L46](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/README.md#L39-L46)

## Environment Configuration Overview

The application requires the following environment variables for operation:

| Variable | Scope | Purpose | Example |
| --- | --- | --- | --- |
| `DATABASE_URL` | Server | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/effect-files-example` |
| `PORT` | Server | HTTP server port | `3001` |
| `API_URL` | Server | Server's public URL (for UploadThing callbacks) | `http://localhost:3001` |
| `UPLOADTHING_SECRET` | Server | UploadThing API key for presigned URLs | `sk_live_xxxxx` |
| `OTLP_URL` | Server | OpenTelemetry collector endpoint | `http://localhost:4318/v1/traces` |
| `VITE_API_URL` | Client | WebSocket RPC server URL | `http://localhost:3001` |

A template is provided at [.env.example L1-L14](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.env.example#L1-L14)

 For detailed configuration instructions, see [Environment Configuration](/lucas-barake/effect-file-manager/2.1-environment-configuration).

**Sources:** [.env.example L1-L14](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.env.example#L1-L14)

 [README.md L22-L24](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/README.md#L22-L24)

## Development Workflow Overview

The typical development workflow involves:

1. **Infrastructure Setup**: Start PostgreSQL and Jaeger via Docker Compose
2. **Database Migration**: Run database migrations to create schema
3. **Server Start**: Launch the Node.js server with WebSocket RPC endpoint
4. **Client Start**: Launch the Vite development server with HMR

```mermaid
flowchart TD

DevSetup["Developer<br>environment setup"]
Docker["docker compose up -d<br>PostgreSQL + Jaeger"]
Migrate["pnpm db:migrate<br>create schema"]
ServerDev["pnpm dev:server<br>:3001 WebSocket RPC"]
ClientDev["pnpm dev:client<br>:5173 React app"]

DevSetup --> Docker
Docker --> Migrate
Migrate --> ServerDev
Migrate --> ClientDev
ServerDev --> Docker
ClientDev --> ServerDev
```

**Available Scripts** (from [package.json L12-L28](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/package.json#L12-L28)

):

| Script | Command | Purpose |
| --- | --- | --- |
| `pnpm dev:server` | Starts server in watch mode | Development server with auto-reload |
| `pnpm dev:client` | Starts Vite dev server | Client with HMR at [http://localhost:5173](http://localhost:5173) |
| `pnpm db:migrate` | Runs database migrations | Create/update database schema |
| `pnpm build` | Builds all packages | Production build of domain, client, server |
| `pnpm test` | Runs Vitest suite | Execute all unit and integration tests |
| `pnpm lint` | Runs OxLint + ESLint | Code quality checks |

For detailed setup instructions, see [Running Locally](/lucas-barake/effect-file-manager/2.2-running-locally). For infrastructure details, see [Infrastructure & Observability](/lucas-barake/effect-file-manager/9-infrastructure-and-observability).

**Sources:** [README.md L14-L37](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/README.md#L14-L37)

 [package.json L12-L28](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/package.json#L12-L28)

## Effect-TS Patterns Overview

The codebase extensively uses Effect-TS patterns throughout its architecture:

### Core Effect Patterns Used

| Pattern | Implementation | Purpose |
| --- | --- | --- |
| **Effect Type** | `Effect<A, E, R>` | Lazy, composable computations with success type `A`, error type `E`, and requirements `R` |
| **Services** | `Context.Tag` + `Layer.succeed` | Dependency injection for testability (e.g., `Api`, `FileSync`, `ImageCompressionClient`) |
| **Layers** | `Layer.provide`, `Layer.merge` | Composable dependency resolution and resource management |
| **Schema Validation** | `@effect/schema` | Runtime type validation with compile-time types from schemas |
| **Streams** | `Stream<A, E, R>` | Reactive data sources (e.g., `filesEventStreamAtom` for real-time sync) |
| **Runtime** | Custom Effect runtimes | Execute Effect programs with specific Layer context |

For comprehensive details on Effect-TS integration, see [Effect-TS Integration](/lucas-barake/effect-file-manager/3.2-effect-ts-integration). For state management patterns, see [State Management with Effect Atoms](/lucas-barake/effect-file-manager/5-state-management-with-effect-atoms).

**Sources:** [README.md L5-L12](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/README.md#L5-L12)

## Observability and Tracing

The application implements distributed tracing using OpenTelemetry:

* **Server Instrumentation**: The server integrates `@effect/opentelemetry` ([package.json L62](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/package.json#L62-L62) ) to emit trace spans for RPC calls, database queries, and business logic operations
* **Jaeger Backend**: Traces are exported to Jaeger at `http://localhost:16686` via OTLP endpoint configured in `OTLP_URL` ([.env.example L7](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.env.example#L7-L7) )
* **Trace Propagation**: Spans automatically propagate through Effect-based call chains, providing complete request traces from WebSocket RPC through database queries

This enables debugging of issues like upload synchronization delays or performance bottlenecks in the file upload pipeline.

For infrastructure setup, see [Infrastructure & Observability](/lucas-barake/effect-file-manager/9-infrastructure-and-observability).

**Sources:** [.env.example L6-L7](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.env.example#L6-L7)

 [package.json L62](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/package.json#L62-L62)

 [README.md L12](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/README.md#L12-L12)

## Related Documentation

* **[Getting Started](/lucas-barake/effect-file-manager/2-getting-started)**: Environment setup, local development, and first-time configuration
* **[Architecture Overview](/lucas-barake/effect-file-manager/3-architecture-overview)**: Deep dive into monorepo structure and Effect-TS patterns
* **[File Upload System](/lucas-barake/effect-file-manager/4-file-upload-system)**: The core upload pipeline implementation with state machine details
* **[State Management with Effect Atoms](/lucas-barake/effect-file-manager/5-state-management-with-effect-atoms)**: Client-side reactive state architecture
* **[Real-time Synchronization](/lucas-barake/effect-file-manager/6-real-time-synchronization)**: WebSocket event streams and FileSync service