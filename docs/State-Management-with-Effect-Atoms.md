# State Management with Effect Atoms

> **Relevant source files**
> * [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts)
> * [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx)

## Purpose and Scope

This document explains the reactive state management system built with `@effect-atom/atom-react` in the client application. It covers the core atoms (`filesAtom`, `activeUploadsAtom`, `selectedFilesAtom`, `uploadAtom`), runtime functions that orchestrate state changes, and the integration between atoms and Effect services. For details on the upload state machine logic, see [Upload State Machine](/lucas-barake/effect-file-manager/4.1-upload-state-machine). For testing strategies specific to atoms, see [Testing State Management](/lucas-barake/effect-file-manager/5.3-testing-state-management).

**Sources:** [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L1-L781](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L1-L781)

---

## Atom Runtime and Layer Composition

The state management system is initialized through `makeAtomRuntime`, which creates a runtime that provides all necessary Effect services to atom computations.

```

```

**Runtime Initialization**

The `runtime` object is created by merging six layers into a single runtime context:

[packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L247-L256](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L247-L256)

This runtime provides access to:

* `Api` service for RPC calls
* `FetchHttpClient` for HTTP operations
* `FilePicker` for file selection dialogs
* `EventStream` for real-time updates
* `FileSync` for upload synchronization
* `ImageCompressionClient` for Web Worker-based compression

**Runtime Function Pattern**

Runtime functions are created via `runtime.fn`, which wraps Effect computations so they can be called from React components. These functions have access to all services in the runtime layer:

| Function | Purpose | Returns |
| --- | --- | --- |
| `runtime.fn` | Creates a function that runs an Effect with the runtime | Function returning the Effect result |
| `runtime.atom` | Creates an atom that streams values from an Effect | Atom holding streamed values |

**Sources:** [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L247-L256](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L247-L256)

---

## Core Atoms

### filesAtom

`filesAtom` is the source of truth for file and folder data. It combines remote data from the API with local cache updates for optimistic UI rendering.

```

```

**Structure**

[packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L556-L694](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L556-L694)

The atom consists of three functions:

1. **Read function**: Mounts the event stream atom and returns the remote atom value
2. **Write function**: Accepts `FileCacheUpdate` actions to modify local state
3. **Refresh function**: Re-fetches remote data

**FileCacheUpdate Actions**

[packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L539-L554](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L539-L554)

| Action | Fields | Purpose |
| --- | --- | --- |
| `DeleteFolders` | `folderIds: FolderId[]` | Removes folders from local cache |
| `DeleteFiles` | `fileIds: UploadedFileId[]` | Removes files from local cache |
| `CreateFolder` | `folder: Folder.WithUploadedFiles` | Adds new folder to local cache |
| `MoveFiles` | `fileIds`, `fromFolderId`, `toFolderId` | Updates file locations in cache |
| `AddFile` | `file: UploadedFile`, `folderId` | Adds file to root or folder |

**Update Logic**

The write function applies cache updates based on the action tag. For example, `DeleteFiles` filters out matching file IDs from both root files and all folder file arrays: [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L594-L605](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L594-L605)

**Sources:** [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L539-L694](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L539-L694)

---

### activeUploadsAtom

`activeUploadsAtom` holds ephemeral metadata for uploads currently in progress, used to render the pending upload UI.

[packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L267](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L267-L267)

**Structure**

```

```

**Lifecycle**

1. **Addition**: When `startUploadAtom` is called, it appends a new `ActiveUpload` entry [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L420-L429](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L420-L429)
2. **Removal**: When upload completes (enters "Done" state) or is cancelled, the entry is filtered out [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L447-L450](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L447-L450)

This separation ensures the persistent `filesAtom` is not polluted with transient upload state.

**Sources:** [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L108-L114](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L108-L114)

 [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L267](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L267-L267)

---

### selectedFilesAtom

`selectedFilesAtom` tracks user selections in the file list UI, enabling bulk operations (delete, move).

[packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L258-L261](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L258-L261)

**Structure**

```

```

**Selection Operations**

| Function | Purpose | Implementation |
| --- | --- | --- |
| `toggleFileSelectionAtom` | Toggle individual file | Adds if absent, removes if present [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L458-L469](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L458-L469) |
| `toggleFolderSelectionAtom` | Toggle folder + contents | Toggles folder ID and all file IDs within [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L471-L495](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L471-L495) |
| `clearSelectionAtom` | Clear all selections | Resets both arrays to empty [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L497-L505](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L497-L505) |

**Sources:** [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L258-L261](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L258-L261)

 [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L458-L505](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L458-L505)

---

## Atom Family: uploadAtom

`uploadAtom` is an **atom family** that creates isolated state machines for each upload operation. Each family member is identified by a unique `uploadId` string.

```

```

**Family Declaration**

[packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L399-L401](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L399-L401)

The atom family creates a new atom instance for each `uploadId`. Each instance runs `makeUploadStream` which returns a stream of `[UploadPhase, UploadState]` tuples.

**Upload State Types**

[packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L121-L128](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L121-L128)

| State | Fields | Meaning |
| --- | --- | --- |
| `Idle` | `input: UploadInput` | Upload not yet started |
| `Compressing` | `input: UploadInput` | Image compression in progress |
| `Uploading` | `input: UploadInput`, `fileToUpload: File` | HTTP upload to S3 in progress |
| `Syncing` | `input: UploadInput`, `fileKey: string` | Waiting for backend confirmation |
| `Done` | (empty) | Upload complete |

**Upload Phase Types**

[packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L100-L106](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L100-L106)

The `UploadPhase` enum is returned to the UI for display purposes, while `UploadState` contains the full state machine data.

**Stream Construction**

[packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L273-L397](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L273-L397)

The stream is constructed via `Stream.unfoldEffect`, which repeatedly calls the `transition` function. Each state transition returns `Option.some([phase, nextState])` or `Option.none()` to signal completion.

**State Transition Logic**

The `transition` function implements state machine logic:

* **Idle → Compressing or Uploading**: Checks file size and type [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L289-L305](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L289-L305)
* **Compressing → Uploading**: Performs iterative compression using `Effect.iterate` [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L307-L351](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L307-L351)
* **Uploading → Syncing**: Initiates upload via API, posts to presigned URL [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L353-L373](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L353-L373)
* **Syncing → Done**: Waits for `FileSync.waitForFile` [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L375-L381](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L375-L381)

**Sources:** [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L100-L128](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L100-L128)

 [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L273-L401](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L273-L401)

---

## Runtime Functions as Controllers

Runtime functions orchestrate operations across multiple atoms and services. They act as controllers that coordinate state changes.

```

```

### startUploadAtom

[packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L407-L436](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L407-L436)

**Operation Sequence:**

1. Opens file picker via `FilePicker.open`
2. Generates unique `uploadId` via `crypto.randomUUID()`
3. Appends entry to `activeUploadsAtom`
4. Sets `uploadAtom(uploadId)` with file and folder ID to start the stream

### cancelUploadAtom

[packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L442-L452](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L442-L452)

**Operation Sequence:**

1. Sets `uploadAtom(uploadId)` to `Atom.Interrupt` to cancel the stream
2. Filters the upload out of `activeUploadsAtom`

### deleteFilesAtom

[packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L511-L533](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L511-L533)

**Operation Sequence:**

1. Reads selected file and folder IDs from `selectedFilesAtom`
2. Calls `Api.deleteFiles` and `Api.deleteFolders` concurrently
3. Updates `filesAtom` with `DeleteFolders` and `DeleteFiles` actions
4. Refreshes `selectedFilesAtom` to clear selections

### createFolderAtom

[packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L725-L735](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L725-L735)

**Operation Sequence:**

1. Calls `Api.createFolder` with folder name
2. Updates `filesAtom` with `CreateFolder` action containing the new folder
3. Returns the created `Folder` object

### moveFilesAtom

[packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L741-L780](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L741-L780)

**Operation Sequence:**

1. Reads current `filesAtom` state to determine source folder
2. Calls `Api.moveFiles` with file IDs and destination folder ID
3. Updates `filesAtom` with `MoveFiles` action
4. Refreshes `selectedFilesAtom` to clear selections

**Sources:** [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L407-L780](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L407-L780)

---

## Service Integration

Atoms integrate with Effect services through the runtime layer. Services are accessed within atom computations using Effect's dependency injection.

```

```

### Api Service

[packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L41-L64](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L41-L64)

The `Api` service wraps the RPC client with typed methods for file operations. It depends on `DomainRpcClient.Default` and exposes methods like:

* `list()`: Streams file list
* `initiateUpload(payload)`: Obtains presigned URL
* `deleteFiles(payload)`: Deletes files by ID
* `createFolder(payload)`: Creates folder
* `moveFiles(payload)`: Moves files to folder

### FilePicker Service

[packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L202-L245](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L202-L245)

The `FilePicker` service manages a hidden `<input type="file">` element and provides an `open()` method that returns `Effect<Option<File>>`. The input element is created as an acquired resource and cleaned up on scope exit.

### FileSync Service

[packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L132-L200](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L132-L200)

The `FileSync` service coordinates upload completion:

* Maintains a `completionSignals` map of upload keys to `Deferred` values
* `waitForFile(uploadthingKey, uploadId)`: Creates a deferred and awaits it
* `signalFileArrived(uploadthingKey)`: Completes the deferred when event arrives
* Polls `Api.getFilesByKeys` every 5 seconds for files added >5 seconds ago

**Polling Logic:** [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L171-L191](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L171-L191)

The polling ensures files are eventually confirmed even if WebSocket events are missed.

### ImageCompressionClient Service

[packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L70-L86](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L70-L86)

The `ImageCompressionClient` wraps an RPC client that communicates with a Web Worker via `ImageCompressionRpc`. It provides a `client.compress()` method for compressing images.

**Sources:** [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L41-L245](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L41-L245)

---

## Event Stream Subscription

`filesEventStreamAtom` subscribes to real-time `FilesEvent` messages from the server and updates `filesAtom` when files arrive.

[packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L700-L719](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L700-L719)

**Operation:**

1. Filters event stream to only `FilesEvent` messages via `Schema.is(FilesEvent)`
2. When a file arrives, calls `FileSync.signalFileArrived()` to wake waiting uploads
3. Updates `filesAtom` with `AddFile` action to insert the file into cache

This atom is mounted by `filesAtom`'s read function [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L576](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L576-L576)

 ensuring it stays active whenever `filesAtom` is being observed.

**Sources:** [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L700-L719](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L700-L719)

---

## Testing with Mock Layers

The test suite demonstrates how Effect's `Layer.mock` enables comprehensive testing of atom logic without real dependencies.

```

```

### Mock Factory Pattern

[packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L206-L235](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L206-L235)

The `makeTestLayer` function composes all mock layers and returns both the merged layer and arrays for inspecting calls/events.

**Example Mock: Api Service**

[packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L44-L103](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L44-L103)

The `makeApiMock` factory:

* Tracks method calls in a `calls` array
* Returns configurable responses (e.g., presigned URL)
* Supports failure injection via `shouldFail` option
* Uses `Layer.mock` to create a mock service implementation

### Test Registry Pattern

Tests create a `Registry` with initial values that provide the test layer:

[packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L255-L257](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L255-L257)

This initializes the `runtime.layer` atom with the test layer, making all mock services available to atom computations.

### Test Example: Upload Flow

[packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L251-L285](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L251-L285)

This test:

1. Creates a test file and mocks
2. Mounts `uploadAtom(uploadId)`
3. Sets the atom with file and folder ID to start upload
4. Advances fake timers to progress the upload
5. Triggers file arrival via `triggerFileArrival()`
6. Asserts upload reaches "Done" state
7. Verifies API and HTTP calls occurred

### Test Example: Concurrent Uploads

[packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L314-L357](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L314-L357)

This test verifies that:

* Multiple uploads can run simultaneously
* Cancelling one upload doesn't affect others
* Each upload has isolated state

**Sources:** [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L1-L420](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L1-L420)

---

## Atom Lifecycle and Registry

The `Registry` manages atom instances and their lifecycles. Key operations:

| Operation | Purpose | Example |
| --- | --- | --- |
| `registry.mount(atom)` | Subscribe to atom, returns unmount function | [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L261](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L261-L261) |
| `registry.get(atom)` | Read current atom value | [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L266](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L266-L266) |
| `registry.set(atom, value)` | Update atom value | [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L263](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L263-L263) |
| `registry.refresh(atom)` | Force re-evaluation | [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L531](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L531-L531) |

**Atom Results**

Atoms return `Result<T>` values that can be in one of several states:

| Result Type | Check Function | Meaning |
| --- | --- | --- |
| `Success` | `Result.isSuccess(result)` | Atom evaluated successfully |
| `Failure` | `Result.isFailure(result)` | Atom evaluation failed |
| `Interrupted` | `Result.isInterrupted(result)` | Atom evaluation was interrupted |

**Sources:** [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L266-L279](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L266-L279)

 [packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts L308-L309](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.test.ts#L308-L309)

---

## Summary Table: Atoms and Their Roles

| Atom | Type | Purpose | Key Operations |
| --- | --- | --- | --- |
| `filesAtom` | Writable | Master file/folder list from API + cache updates | Read: Get file tree, Write: Apply `FileCacheUpdate`, Refresh: Re-fetch from API |
| `activeUploadsAtom` | Simple | Ephemeral list of uploads in progress | Append on start, filter on complete/cancel |
| `selectedFilesAtom` | Simple | Current UI selection state | Toggle file/folder IDs, clear all |
| `uploadAtom(id)` | Family | Per-upload state machine stream | Set input to start, Interrupt to cancel |
| `filesEventStreamAtom` | Event Stream | Subscribe to real-time file events | Auto-mounted by `filesAtom` |
| `startUploadAtom` | Runtime Function | Initiate upload with file picker | Returns `Effect<void>` |
| `cancelUploadAtom` | Runtime Function | Cancel an in-progress upload | Returns `Effect<void>` |
| `deleteFilesAtom` | Runtime Function | Delete selected files/folders | Returns `Effect<void>` |
| `createFolderAtom` | Runtime Function | Create new folder | Returns `Effect<Folder>` |
| `moveFilesAtom` | Runtime Function | Move files to folder | Returns `Effect<void>` |

**Sources:** [packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx L1-L781](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/packages/client/src/routes/files/-files/files-atoms/files-atoms.tsx#L1-L781)