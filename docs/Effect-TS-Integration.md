# Effect-TS Integration

> **Relevant source files**
> * [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts)
> * [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx)

This document explains how Effect-TS is used throughout the Effect File Manager codebase to provide functional programming patterns, type-safe dependency injection, composable error handling, and resource management. Effect-TS serves as the foundational layer for both client and server applications, enabling testable, maintainable code through explicit dependency management and effect composition.

For details on the state management system built on top of Effect-TS, see [State Management with Effect Atoms](/lucas-barake/effect-file-manager/5-state-management-with-effect-atoms). For information on the RPC communication layer, see [Architecture Overview](/lucas-barake/effect-file-manager/3-architecture-overview).

## Core Effect-TS Patterns

The codebase uses Effect-TS primarily for four patterns: Services with dependency injection, composable error handling, resource management via scoped effects, and Layer-based composition.

### Service Definition Pattern

Effect Services encapsulate business logic and external dependencies. Each service declares its dependencies explicitly and provides scoped lifecycle management.

```

```

**Sources:** [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L41-L64](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L41-L64)

 [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L78-L86](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L78-L86)

 [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L132-L200](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L132-L200)

 [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L202-L245](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L202-L245)

### Service Implementation Examples

**Api Service**

The `Api` service wraps the RPC client and provides typed methods for file operations. It declares `DomainRpcClient.Default` as its dependency.

| Property | Value |
| --- | --- |
| Service Tag | `@example/client/routes/files/-files/files-atoms/Api` |
| Dependencies | `DomainRpcClient.Default` |
| Lifecycle | `effect` (non-scoped) |
| Purpose | Type-safe wrapper for RPC file operations |

Implementation: [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L41-L64](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L41-L64)

**FileSync Service**

The `FileSync` service manages the synchronization phase after file upload, handling both event-based and polling-based file arrival detection.

| Property | Value |
| --- | --- |
| Service Tag | `@example/client/routes/files/-files/files-atoms/FileSync` |
| Dependencies | `Api.Default` |
| Lifecycle | `scoped` (manages long-lived resources) |
| Purpose | Coordinates file arrival confirmation via dual mechanism |

Key responsibilities:

* Maintains `completionSignals` map for deferred file arrivals
* Forks a background effect for 5-second polling [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L171-L191](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L171-L191)
* Exposes `waitForFile` method that returns when file is confirmed
* Cleans up `activeUploadsAtom` when file arrives [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L165-L169](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L165-L169)

**FilePicker Service**

The `FilePicker` service wraps the browser file input API in an Effect, using `acquireRelease` for resource management.

| Property | Value |
| --- | --- |
| Service Tag | `@example/client/routes/files/-files/files-atoms/FilePicker` |
| Dependencies | None |
| Lifecycle | `scoped` (manages DOM element lifecycle) |
| Resource Pattern | `Effect.acquireRelease` for input element |

The service creates a hidden file input element on acquisition and removes it on release [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L206-L219](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L206-L219)

 The `open` method returns `Effect.async<Option.Option<File>>`, integrating browser events into the Effect system [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L222-L241](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L222-L241)

**Sources:** [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L41-L245](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L41-L245)

## Dependency Injection via Layers

Effect Layers compose dependencies into runtime environments. The codebase uses `Layer.mergeAll` to combine service layers and provides mock layers for testing.

```

```

**Sources:** [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L247-L256](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L247-L256)

 [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L204-L235](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L204-L235)

### Production Layer Composition

The production runtime merges all service layers using `Layer.mergeAll`:

[packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L247-L256](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L247-L256)

This layer is wrapped by `makeAtomRuntime` to provide the runtime for atom-based effects. The runtime exposes two key methods:

* `runtime.fn`: Creates atom runtime functions that can access services
* `runtime.atom`: Creates atoms that run effects with service access

**Sources:** [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L247-L256](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L247-L256)

### Test Layer Composition

Test layers use `Layer.mock` to provide controlled implementations. The `makeTestLayer` factory [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L206-L235](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L206-L235)

 creates isolated test environments by:

1. Mocking `Api` service with call tracking [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L44-L103](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L44-L103)
2. Mocking `HttpClient` for upload requests [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L105-L125](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L105-L125)
3. Mocking `FilePicker` with predetermined file selection [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L127-L131](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L127-L131)
4. Mocking `FileSync` with manual trigger control [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L133-L164](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L133-L164)
5. Mocking `EventStream` for event capture [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L166-L180](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L166-L180)
6. Mocking `ImageCompressionClient` using RpcTest [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L182-L200](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L182-L200)

**Sources:** [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L44-L235](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L44-L235)

## Error Handling Patterns

Effect-TS provides typed error channels. The codebase uses `Effect.catchTags` for granular error handling and custom error types via `Data.TaggedError`.

### Custom Error Types

[packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L92-L98](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L92-L98)

The `ImageTooLargeAfterCompression` error type extends `Data.TaggedError`, providing:

* Type-safe error construction
* Automatic `_tag` field for discriminated unions
* Structured error data with `fileName`, `originalSizeBytes`, `compressedSizeBytes`

### Selective Error Recovery

The upload state machine catches specific errors while propagating others:

[packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L388-L394](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L388-L394)

| Error Type | Handling Strategy |
| --- | --- |
| `Unauthorized` | Die (fatal, halt execution) |
| `RpcClientError` | Die (network/protocol issue) |
| `RequestError` | Die (client-side request failure) |
| `ResponseError` | Die (server response issue) |
| Others | Propagate to caller |

This pattern ensures transient errors (like compression failures) can be caught by callers, while infrastructure errors terminate the upload.

**Sources:** [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L92-L98](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L92-L98)

 [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L388-L394](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L388-L394)

### Retry Policies

The `HttpClient` is configured with transient retry using `Schedule.exponential`:

[packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L276-L282](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L276-L282)

| Configuration | Value |
| --- | --- |
| Retry attempts | 3 |
| Initial delay | 250 milliseconds |
| Backoff multiplier | 1.5 |
| Trigger | Transient failures only |

This applies exponential backoff (250ms, 375ms, 562.5ms) for retryable HTTP errors during S3 upload.

**Sources:** [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L276-L282](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L276-L282)

## Effect.gen Generator Syntax

The codebase consistently uses `Effect.gen` for sequential effectful operations. This generator-based syntax provides imperative-style control flow while maintaining referential transparency.

```

```

### Example: Upload State Transition

The upload state machine uses `Effect.gen` extensively:

[packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L273-L397](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L273-L397)

Key patterns demonstrated:

* **Service acquisition**: `const api = yield* Api` [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L275](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L275-L275)
* **Nested generators**: Each state transition case uses `Effect.gen` [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L287](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L287-L287)
* **Async operation integration**: `yield* Effect.promise(() => file.arrayBuffer())` [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L312](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L312-L312)
* **Effect iteration**: `yield* Effect.iterate(...)` for compression retries [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L310-L333](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L310-L333)

**Sources:** [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L273-L397](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L273-L397)

## Integration with Atom State Management

Effect-TS integrates with `@effect-atom/atom-react` through runtime functions that bridge atoms and effects. The `runtime` object provides `fn` and `atom` methods that inject the service layer.

```

```

**Sources:** [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L247-L256](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L247-L256)

 [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L399-L401](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L399-L401)

 [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L407-L436](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L407-L436)

### Runtime Function Pattern

Runtime functions created with `runtime.fn` have access to both the service layer and the atom registry. They use `Effect.fn` or `Effect.fnUntraced` to define their logic:

| Function Type | Use Case | Tracing |
| --- | --- | --- |
| `Effect.fn` | Operations that may fail (API calls, validation) | Yes |
| `Effect.fnUntraced` | Simple state updates, synchronous operations | No |

Example with service access:

[packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L407-L436](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L407-L436)

This function:

1. Yields `Registry.AtomRegistry` to access atom state
2. Yields `FilePicker` service to open file picker
3. Yields `Effect.flatten` to handle `Option.Option<File>`
4. Updates `activeUploadsAtom` and `uploadAtom` via registry

**Sources:** [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L407-L436](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L407-L436)

### Stream-Based Atoms

Atoms can be backed by Effect Streams. The `filesAtom` uses `runtime.atom` to create a stream-based atom:

[packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L557-L572](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L557-L572)

The pattern:

1. `Stream.unwrap` unwraps an Effect that produces a Stream
2. Inner `Effect.gen` acquires services
3. `Stream.scan` accumulates results over time
4. Atom automatically manages subscription lifecycle

**Sources:** [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L557-L572](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L557-L572)

## Testing with Effect Mocks

Effect's Layer system enables comprehensive testing through mock implementations. Test mocks provide call tracking, controlled behavior, and failure injection.

### Mock Service Implementation Pattern

Mock services use `Layer.mock` with a mock implementation object:

[packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L44-L103](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L44-L103)

Mock structure:

* `_tag`: Service identifier for type safety
* Methods: Mock implementations returning Effects
* Side effects: Call tracking via mutable arrays
* Configurable behavior: `shouldFail` option for error simulation

### Test Layer Injection

Tests inject mock layers via `Registry.make` with initial values:

[packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L255-L257](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L255-L257)

The `Atom.initialValue(runtime.layer, testLayer)` pattern replaces the production layer with the test layer for that registry instance. This enables:

* Isolated test execution (each test gets its own registry)
* Full service control (mocks define all behavior)
* Assertion capabilities (call tracking in mocks)

**Sources:** [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L44-L103](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L44-L103)

 [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L255-L257](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L255-L257)

### Concurrent Upload Testing

Effect mocks enable testing concurrent independent effects:

[packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L314-L357](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L314-L357)

This test:

1. Creates two separate upload atoms with different IDs
2. Mounts both atoms in the same registry
3. Sets both atoms simultaneously
4. Verifies both enter Uploading/Syncing state independently
5. Interrupts one upload with `Atom.Interrupt`
6. Confirms the other upload continues unaffected

The test demonstrates that the atom family pattern with Effect isolation prevents interference between concurrent operations.

**Sources:** [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L314-L357](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L314-L357)

### Deferred-Based Synchronization Testing

The `FileSync` mock uses `Deferred` for test control:

[packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L133-L164](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L133-L164)

Pattern:

1. `waitForFile` creates a Deferred and stores it in a map keyed by uploadthing key
2. Test code calls `triggerFileArrival(key)` to resolve the Deferred
3. Upload atom resumes from awaiting the Deferred

This provides deterministic control over asynchronous timing in tests:

[packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L251-L285](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L251-L285)

Line 273: `await Effect.runPromise(triggerFileArrival(TEST_FILE_KEY))` explicitly triggers file arrival, allowing the test to verify the upload completes.

**Sources:** [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L133-L164](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L133-L164)

 [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L251-L285](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L251-L285)

## Resource Management Patterns

Effect-TS provides `Effect.acquireRelease` for deterministic resource cleanup. Resources are scoped to service lifecycles or specific effect scopes.

### Service Scoped Resources

Services declared with `scoped` field manage long-lived resources:

[packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L202-L245](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L202-L245)

The `FilePicker` service:

* Acquires: Creates DOM input element [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L207-L214](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L207-L214)
* Uses: Provides `open` method that attaches event listeners
* Releases: Removes input element when scope ends [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L215-L218](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L215-L218)

The scope is tied to the atom registry lifecycle, ensuring cleanup when the application unmounts.

### Forked Background Effects

`Effect.forkScoped` runs background effects that terminate when the parent scope ends:

[packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L171-L191](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L171-L191)

This polling effect:

* Runs every 5 seconds via `Schedule.spaced`
* Checks `completionSignals` map for files awaiting confirmation
* Queries files older than 5 seconds
* Automatically terminates when `FileSync` service scope ends

The `forkScoped` ensures the background fiber doesn't outlive the service, preventing resource leaks.

**Sources:** [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L202-L245](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L202-L245)

 [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L171-L191](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L171-L191)

## Key Effect-TS Constructs Used

| Construct | Purpose | Primary Usage |
| --- | --- | --- |
| `Effect.Service` | Define injectable services | All service definitions |
| `Effect.gen` | Generator-based effect composition | All effectful logic |
| `Layer.mergeAll` | Compose dependency layers | Runtime construction |
| `Layer.mock` | Provide test implementations | Test suites |
| `Effect.catchTags` | Selective error handling | Upload state machine |
| `Effect.acquireRelease` | Resource management | FilePicker DOM element |
| `Effect.forkScoped` | Background effects | FileSync polling |
| `Effect.iterate` | Iterative computations | Image compression retries |
| `Schedule.exponential` | Retry policies | HTTP client retries |
| `Stream.unfoldEffect` | State machine streams | Upload state transitions |
| `Data.TaggedError` | Typed error classes | Custom errors |
| `Deferred` | Asynchronous coordination | File arrival signaling |

**Sources:** [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L1-L781](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L1-L781)

 [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L1-L421](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L1-L421)