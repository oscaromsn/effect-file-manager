# Testing Strategy

> **Relevant source files**
> * [package.json](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/package.json)
> * [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts)

## Purpose and Scope

This document describes the testing strategy for the Effect File Manager codebase, with emphasis on testing Effect-based code using Vitest and the Effect mock layers pattern. It covers the testing framework setup, mock layer architecture, asynchronous testing patterns, and best practices for achieving reliable, isolated unit tests.

For information about the CI/CD pipeline that executes these tests, see [CI/CD Pipeline](/lucas-barake/effect-file-manager/8.2-cicd-pipeline). For details on the state management architecture being tested, see [State Management with Effect Atoms](/lucas-barake/effect-file-manager/5-state-management-with-effect-atoms).

**Sources:** [package.json L1-L68](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/package.json#L1-L68)

 [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L1-L421](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L1-L421)

---

## Testing Framework: Vitest with Effect Integration

The codebase uses **Vitest** as its primary testing framework, enhanced with `@effect/vitest` for seamless integration with Effect-TS primitives. This combination enables testing of Effect-based code while maintaining type safety and composability.

### Framework Configuration

| Component | Version | Purpose |
| --- | --- | --- |
| `vitest` | 3.1.1 | Core testing framework with fast execution |
| `@effect/vitest` | 0.27.0 | Effect-specific test utilities and matchers |
| `@effect/rpc/RpcTest` | 0.72.2 | RPC service mocking utilities |

The test runner is configured through workspace scripts in [package.json L21-L22](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/package.json#L21-L22)

:

```yaml
test: "vitest run"
test:watch: "vitest"
```

### Effect-Specific Test Utilities

The test file imports key utilities from `@effect/vitest` [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L7](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L7-L7)

:

* **`describe`**: Test suite grouping (Effect-aware)
* **`it`**: Individual test cases
* **`expect`**: Assertions
* **`beforeEach/afterEach`**: Lifecycle hooks

**Sources:** [package.json L30-L46](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/package.json#L30-L46)

 [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L7](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L7-L7)

---

## Effect Mock Layers Pattern

The core testing pattern in this codebase is the **Effect Mock Layers** pattern, which enables isolated testing of services by replacing dependencies with test doubles. This pattern leverages Effect's `Layer` abstraction to inject mock implementations without modifying production code.

### Service Mocking Architecture

```

```

**Diagram: Effect Mock Layers Testing Architecture**

This architecture isolates the system under test (`uploadAtom`) from its dependencies by injecting mock layers through the `Registry`. The production code remains unchanged; mocks are provided solely through the test layer composition.

**Sources:** [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L44-L103](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L44-L103)

 [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L206-L235](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L206-L235)

### Mock Factory Pattern

Each service has a dedicated mock factory function that returns both the mock layer and a mechanism to observe interactions. This pattern is demonstrated in `makeApiMock` [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L44-L103](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L44-L103)

:

#### Factory Structure

```

```

**Diagram: Mock Factory Pattern Structure**

#### Key Mock Factories

| Factory | Service | Key Features | Lines |
| --- | --- | --- | --- |
| `makeApiMock` | `Api` | Call tracking, configurable responses, failure simulation | [44-103](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/44-103) |
| `makeHttpClientMock` | `HttpClient.HttpClient` | URL tracking, HTTP status code control | [105-125](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/105-125) |
| `makeFilePickerMock` | `FilePicker` | File selection simulation | [127-131](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/127-131) |
| `makeFileSyncMock` | `FileSync` | Deferred-based file arrival signaling | [133-164](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/133-164) |
| `makeEventStreamMock` | `EventStream` | Event publishing observation | [166-180](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/166-180) |
| `makeImageCompressionMock` | `ImageCompressionClient` | RPC test client for image compression | [182-200](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/182-200) |

#### Example: Api Mock Implementation

The `makeApiMock` factory [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L44-L103](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L44-L103)

 demonstrates several critical patterns:

1. **Call Tracking**: Every method invocation is recorded in a `calls` array [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L52](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L52-L52)
2. **Configurable Responses**: The factory accepts options for customizing mock behavior [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L45-L50](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L45-L50)
3. **Failure Simulation**: Tests can trigger failures via `shouldFail` flag [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L62-L64](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L62-L64)
4. **Type Safety**: Mock uses `Layer.mock()` which enforces type compatibility with the real service

**Sources:** [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L44-L200](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L44-L200)

### Layer Composition for Tests

Test layers are composed by merging all mock layers into a single layer that replaces the production runtime. The `makeTestLayer` function [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L206-L235](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L206-L235)

 demonstrates this composition:

```

```

**Diagram: Test Layer Composition Flow**

The composed test layer is then injected into the `Registry` via `Atom.initialValue` [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L256-L257](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L256-L257)

:

```

```

This pattern ensures all dependencies required by `uploadAtom` are satisfied with test doubles, enabling complete isolation.

**Sources:** [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L206-L235](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L206-L235)

 [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L255-L257](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L255-L257)

---

## Testing Effect Atoms

Effect Atoms require a specialized testing approach due to their reactive, stream-based nature. The `@effect-atom/atom-react` library provides the `Registry` abstraction for testing atoms outside of React components.

### Registry-Based Testing

```

```

**Diagram: Registry-Based Atom Testing Flow**

#### Key Registry Methods

| Method | Purpose | Usage |
| --- | --- | --- |
| `Registry.make()` | Create test registry with initial layers | [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L255-L257](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L255-L257) |
| `r.mount(atom)` | Start atom execution, returns unmount function | [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L261](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L261-L261) |
| `r.set(atom, value)` | Trigger atom with input value or interrupt | [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L263](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L263-L263) |
| `r.get(atom)` | Retrieve current atom state as `Result` | [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L266](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L266-L266) |
| `unmount()` | Cleanup atom resources | [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L284](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L284-L284) |

**Sources:** [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L255-L284](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L255-L284)

### State Transitions Testing

Testing state machines like `uploadAtom` requires asserting on intermediate states. The test at [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L251-L285](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L251-L285)

 demonstrates this pattern:

1. **Initial Trigger**: Set atom with file input
2. **Intermediate State Check**: Assert `_tag` is "Uploading" or "Syncing"
3. **External Event**: Trigger file arrival via mock
4. **Final State Check**: Assert `_tag` is "Done"

The use of `Result` type enables exhaustive pattern matching:

```

```

**Sources:** [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L266-L279](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L266-L279)

### Interruption and Cancellation

Effect Atoms support interruption via `Atom.Interrupt`, enabling tests for cancellation logic [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L287-L312](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L287-L312)

:

```

```

This pattern is critical for testing upload cancellation, timeout handling, and resource cleanup.

**Sources:** [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L287-L312](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L287-L312)

 [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L368-L392](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L368-L392)

---

## Asynchronous Testing Patterns

Testing asynchronous Effect-based code requires coordination between Effect's execution model and Vitest's test runner. Three key patterns enable this coordination.

### Fake Timers

Vitest's fake timers provide deterministic control over time-based operations. Tests use `vitest.useFakeTimers()` and `vitest.useRealTimers()` to control time [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L242-L248](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L242-L248)

:

```

```

Time advancement is performed with `vitest.advanceTimersByTimeAsync()` [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L265](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L265-L265)

 allowing microtask queue processing:

```

```

This pattern is essential for testing the FileSync polling mechanism (5-second intervals) without waiting for real time to elapse.

**Sources:** [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L242-L248](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L242-L248)

 [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L265](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L265-L265)

### Deferred Synchronization

The `makeFileSyncMock` factory [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L133-L164](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L133-L164)

 uses `Deferred` to simulate asynchronous file arrival events:

```

```

**Diagram: Deferred-Based File Arrival Synchronization**

The test controls when the upload completes by calling `triggerFileArrival` [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L273](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L273-L273)

:

```

```

This pattern eliminates test flakiness by providing explicit synchronization points.

**Sources:** [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L133-L164](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L133-L164)

 [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L273](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L273-L273)

### Effect.runPromise

Tests use `Effect.runPromise` to execute Effect computations within the async test context [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L273](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L273-L273)

:

```

```

This utility bridges Effect's execution model with Promise-based test runners, ensuring proper error propagation and resource cleanup.

Combined with `Effect.yieldNow()` [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L306](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L306-L306)

 it enables precise control over Effect fiber scheduling during tests.

**Sources:** [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L273](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L273-L273)

 [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L306](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L306-L306)

---

## Test Organization

The test file demonstrates a clear organizational structure that promotes maintainability and readability.

### Test Constants

Global test constants centralize test data configuration [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L26-L38](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L26-L38)

:

```

```

This approach ensures consistent test data across all test cases and simplifies test setup.

**Sources:** [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L26-L38](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L26-L38)

### Test Suite Structure

Tests are organized hierarchically using `describe` blocks [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L241-L420](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L241-L420)

:

```
describe("files-atoms")
  ├── describe("uploadAtom")
  │   ├── it("completes upload flow for small text files")
  │   ├── it("cancels upload when Atom.Interrupt is set")
  │   └── it("handles multiple concurrent uploads independently")
  ├── describe("activeUploadsAtom")
  │   └── it("starts empty")
  ├── describe("cancelUploadAtom")
  │   └── it("Atom.Interrupt interrupts the upload")
  └── describe("error handling")
      └── it("sets failure state when API initiate upload fails")
```

This structure mirrors the production code structure, making it easy to locate relevant tests.

**Sources:** [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L241-L420](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L241-L420)

### Mock Factory Organization

Mock factories are defined in a dedicated section [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L44-L200](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L44-L200)

 with consistent structure:

1. **Call/Event Tracking**: Observable arrays or maps for assertions
2. **Layer Creation**: `Layer.mock()` or `Layer.scoped()` for service creation
3. **Return Object**: Tuple of layer and observables

This pattern is repeated for each service, creating a consistent API for test setup.

**Sources:** [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L44-L200](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L44-L200)

---

## Best Practices

### Isolation

Each test case creates its own `Registry` instance, ensuring no shared state between tests [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L255-L257](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L255-L257)

:

```

```

Tests demonstrating concurrent uploads [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L314-L357](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L314-L357)

 verify that separate atom instances maintain independent state:

```

```

This isolation prevents test pollution and enables parallel test execution.

### Determinism

The codebase achieves deterministic tests through:

1. **Fake Timers**: Eliminates timing-dependent behavior [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L242-L248](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L242-L248)
2. **Explicit Synchronization**: `Deferred` replaces event-driven timing [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L133-L164](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L133-L164)
3. **Fixed Test Data**: Constants like `TEST_FILE_KEY` ensure reproducibility [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L30](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L30-L30)

### Observability

Mock factories return observables that enable post-execution assertions [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L52](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L52-L52)

:

```

```

This pattern verifies not just final state, but also the interaction sequence between components, enabling comprehensive behavioral testing.

### Type Safety

All mocks use `Layer.mock()` with explicit service tags [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L54-L55](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L54-L55)

:

```

```

TypeScript ensures mock implementations match service interfaces, preventing tests from diverging from production behavior as the codebase evolves.

### Resource Cleanup

Every test that mounts an atom calls the returned `unmount()` function [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L284](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L284-L284)

:

```

```

This prevents resource leaks and ensures clean test teardown, particularly important for long-running test suites.

**Sources:** [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L241-L420](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L241-L420)

---

## Summary

The testing strategy for Effect File Manager demonstrates how Effect-TS patterns enable comprehensive, type-safe testing of complex asynchronous systems. Key takeaways:

| Aspect | Implementation | Benefits |
| --- | --- | --- |
| **Framework** | Vitest + @effect/vitest | Fast execution, Effect integration, familiar API |
| **Mocking** | Layer.mock() pattern | Type-safe, composable, no production code changes |
| **Atoms** | Registry-based testing | Isolated state, observable transitions, resource cleanup |
| **Async** | Fake timers + Deferred | Deterministic, no flakiness, explicit synchronization |
| **Organization** | Factories + composition | Reusable mocks, consistent structure, maintainable |

This approach scales well as the codebase grows, with new services easily integrated into the test layer composition pattern.

**Sources:** [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L1-L421](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L1-L421)

 [package.json L21-L22](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/package.json#L21-L22)