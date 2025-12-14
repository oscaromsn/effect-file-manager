# Architecture Overview

> **Relevant source files**
> * [README.md](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/README.md)
> * [package.json](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/package.json)
> * [packages/client/package.json](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/package.json)
> * [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx)

## Purpose and Scope

This document explains the high-level architecture of the Effect File Manager, covering the monorepo structure, client-server communication patterns, Effect-TS integration, and how major systems interact. For detailed information about specific subsystems, see:

* Monorepo package details: [Monorepo Structure](/lucas-barake/effect-file-manager/3.1-monorepo-structure)
* Effect-TS patterns and conventions: [Effect-TS Integration](/lucas-barake/effect-file-manager/3.2-effect-ts-integration)
* File upload pipeline internals: [File Upload System](/lucas-barake/effect-file-manager/4-file-upload-system)
* Client state management: [State Management with Effect Atoms](/lucas-barake/effect-file-manager/5-state-management-with-effect-atoms)
* Real-time synchronization mechanisms: [Real-time Synchronization](/lucas-barake/effect-file-manager/6-real-time-synchronization)

**Sources:** [README.md L1-L51](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/README.md#L1-L51)

 [package.json L1-L69](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/package.json#L1-L69)

---

## System Architecture

The application follows a three-tier monorepo architecture with typed RPC communication over WebSocket. The core architectural pattern separates concerns into shared contracts (domain), client presentation (React), and server business logic (Node.js).

### Package Dependency Graph

```

```

**Sources:** [package.json L9-L11](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/package.json#L9-L11)

 [README.md L39-L46](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/README.md#L39-L46)

---

## Communication Architecture

Communication between client and server uses `@effect/rpc` with WebSocket transport and NDJSON serialization. The `@example/domain` package defines RPC interfaces that both sides implement, ensuring type safety across the network boundary.

### RPC Client-Server Stack

```

```

The `DomainRpcClient` service wraps the RPC client and is injected as a dependency throughout the client application. On the server, RPC implementations are registered in the router and automatically handle schema validation.

**Sources:** [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L1-L10](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L1-L10)

 [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L41-L64](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L41-L64)

---

## Effect-TS Service Layer

The application uses Effect-TS Services for dependency injection and composable business logic. Services are defined using the `Effect.Service` class and wired together with `Layer` composition.

### Client Services Dependency Graph

```

```

All services are composed into a single `runtime` using `makeAtomRuntime`, which provides them to both atom definitions and runtime functions.

**Code Entity Mapping:**

* `Api` class: [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L41-L64](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L41-L64)
* `FileSync` class: [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L132-L200](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L132-L200)
* `FilePicker` class: [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L202-L245](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L202-L245)
* `ImageCompressionClient` class: [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L78-L86](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L78-L86)
* `runtime` definition: [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L247-L256](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L247-L256)

**Sources:** [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L41-L256](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L41-L256)

---

## State Management Architecture

The client uses `@effect-atom/atom-react` for reactive state management. Atoms represent observable state, and "runtime functions" created with `runtime.fn` orchestrate state changes across multiple atoms with access to Effect services.

### Core Atom Hierarchy

```

```

The `filesAtom` serves as the single source of truth for file/folder data. It's a writable atom that accepts `FileCacheUpdate` tagged enum variants for optimistic updates. The `uploadAtom` family creates isolated state machines per upload, each emitting a stream of `UploadPhase` values.

**Code Entity Mapping:**

* `filesAtom`: [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L556-L694](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L556-L694)
* `selectedFilesAtom`: [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L258-L261](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L258-L261)
* `activeUploadsAtom`: [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L267](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L267-L267)
* `uploadAtom`: [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L399-L401](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L399-L401)
* `startUploadAtom`: [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L407-L436](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L407-L436)
* `cancelUploadAtom`: [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L442-L452](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L442-L452)
* `deleteFilesAtom`: [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L511-L533](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L511-L533)
* `moveFilesAtom`: [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L741-L780](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L741-L780)
* `createFolderAtom`: [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L725-L735](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L725-L735)

**Sources:** [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L258-L780](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L258-L780)

---

## Upload Pipeline Flow

The file upload system is the most complex subsystem, coordinating compression, presigned URL acquisition, direct S3 upload, and synchronization confirmation.

### Upload State Machine

```

```

Each upload creates an isolated state machine via `uploadAtom(uploadId)`. The state machine is implemented using `Stream.unfoldEffect` with a `transition` function that handles each state.

**State Transition Logic:**

1. **Idle → Compressing/Uploading**: Checks file size and type [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L289-L305](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L289-L305)
2. **Compressing → Uploading**: Iterative compression up to 3 attempts [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L307-L351](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L307-L351)
3. **Uploading → Syncing**: Posts to presigned URL, receives `fileKey` [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L353-L373](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L353-L373)
4. **Syncing → Done**: `FileSync.waitForFile` blocks until confirmation [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L375-L381](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L375-L381)

**Sources:** [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L273-L397](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L273-L397)

---

## Real-time Synchronization

File synchronization uses a dual mechanism: event-based updates via `filesEventStreamAtom` and polling via `FileSync` service.

### Synchronization Flow Diagram

```

```

The `FileSync` service maintains a `Map<string, Deferred>` tracking pending uploads. Event stream updates provide immediate feedback, while the 5-second polling ensures reliability if events are missed.

**Code Entity Mapping:**

* `completionSignals` Map: [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L140-L147](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L140-L147)
* `waitForFile` method: [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L156-L169](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L156-L169)
* `signalFileArrived` method: [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L149-L154](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L149-L154)
* Polling loop: [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L171-L191](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L171-L191)
* Event stream handler: [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L700-L719](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L700-L719)

**Sources:** [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L132-L200](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L132-L200)

 [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L700-L719](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L700-L719)

---

## Component-Atom Interaction Pattern

React components interact with atoms through the `useAtom` and `useAtomValue` hooks from `@effect-atom/atom-react`. Runtime functions are called imperatively from event handlers.

### Typical Interaction Pattern

| Component Action | Atom Operation | Effect |
| --- | --- | --- |
| User clicks "Upload" button | Calls `startUploadAtom()` | Creates `uploadAtom(id)`, updates `activeUploadsAtom` |
| Component observes upload progress | `useAtomValue(uploadAtom(id))` | Receives `Stream<[UploadPhase, UploadState]>` |
| User selects file | Calls `toggleFileSelectionAtom(fileId)` | Updates `selectedFilesAtom` |
| User deletes files | Calls `deleteFilesAtom()` | Makes RPC call, updates `filesAtom` optimistically |
| Server broadcasts file event | `filesEventStreamAtom` handler fires | Updates `filesAtom`, signals `FileSync` |

Runtime functions created with `runtime.fn` have access to:

* `Registry.AtomRegistry` for reading/writing atom values
* All services provided to the runtime (Api, FileSync, etc.)
* Full Effect ecosystem (error handling, interruption, concurrency)

**Sources:** [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L407-L780](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L407-L780)

---

## Error Handling Strategy

The architecture uses Effect's typed error handling throughout:

1. **Transport Errors**: RPC errors (`RpcClientError`, `Unauthorized`) are caught and converted to UI-friendly errors
2. **Upload Errors**: `ImageTooLargeAfterCompression` error type for compression failures [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L92-L98](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L92-L98)
3. **Transient Failures**: Automatic retry with exponential backoff for HTTP requests [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L276-L282](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L276-L282)
4. **Interruption**: Upload cancellation via `Atom.Interrupt` [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L446](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L446-L446)
5. **Fatal Errors**: Die on auth/client errors that indicate programmer mistakes [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L388-L393](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L388-L393)

All errors are type-safe and handled explicitly in the Effect pipeline, preventing uncaught exceptions.

**Sources:** [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L92-L98](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L92-L98)

 [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L276-L282](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L276-L282)

 [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L388-L393](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L388-L393)

---

## Key Architectural Decisions

| Decision | Rationale | Implementation |
| --- | --- | --- |
| Monorepo with shared domain | Type safety across client-server boundary | pnpm workspaces, `@example/domain` package |
| Effect-TS throughout | Composable error handling, testability, typed DI | All services use `Effect.Service` |
| Atom-based state management | Reactive updates, granular subscriptions | `@effect-atom/atom-react` |
| WebSocket RPC with NDJSON | Bidirectional communication, streaming support | `@effect/rpc` with WebSocket transport |
| Direct client-to-S3 uploads | Server scalability, reduced bandwidth | UploadThing presigned URLs |
| Dual sync mechanism (events + polling) | Reliability despite network issues | `FileSync` service with polling fallback |
| Atom families for uploads | Isolated state per upload, concurrent operations | `uploadAtom(id)` family |

**Sources:** [README.md L1-L51](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/README.md#L1-L51)

 [package.json L9-L11](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/package.json#L9-L11)

 [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L1-L780](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L1-L780)