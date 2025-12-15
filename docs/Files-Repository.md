# Files Repository

> **Relevant source files**
> * [packages/server/src/public/files/files-repo.ts](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/src/public/files/files-repo.ts)

## Purpose and Scope

The Files Repository (`FilesRepo`) is the data access layer for file and folder operations in TalentScore. This service provides type-safe SQL queries for CRUD operations on files and folders, enforcing multi-tenant isolation and ownership validation at the database level. For the overall file management system architecture, see [File Management System](/oscaromsn/TalentScore/4.5-file-management-system). For the RPC API that consumes this repository, see the server implementation in `packages/server/src/public/files/` directory.

**Sources:** [packages/server/src/public/files/files-repo.ts L1-L476](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/src/public/files/files-repo.ts#L1-L476)

---

## Service Architecture

`FilesRepo` is implemented as an Effect Service that depends on the PostgreSQL database layer (`PgLive`). All methods return `Effect` types that include automatic span tracing for observability.

```

```

**Sources:** [packages/server/src/public/files/files-repo.ts L11-L16](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/src/public/files/files-repo.ts#L11-L16)

 [packages/server/src/public/files/files-repo.ts L464-L475](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/src/public/files/files-repo.ts#L464-L475)

---

## Paginated List Query

The `listPaginated` method implements a complex SQL query using Common Table Expressions (CTEs) to efficiently fetch root-level files and folders with their nested files in a single round-trip.

### Query Structure

```mermaid
flowchart TD

Request["Request<br>userId, offset, limit"]
CTE1["CTE: counts<br>Total folder count"]
CTE2["CTE: page_folders<br>Paginated folder page"]
RootFilesQuery["Root Files Subquery<br>folder_id IS NULL"]
FoldersQuery["Folders Subquery<br>LEFT JOIN LATERAL for files"]
Result["Result<br>{rootFiles, folders, total, hasNext}"]
json_agg_root["json_agg for root files<br>ORDER BY updated_at DESC"]
json_agg_folders["json_agg for folders<br>ORDER BY updated_at DESC"]
json_agg_folder_files["json_agg for folder files<br>ORDER BY updated_at DESC"]

Request --> CTE1
Request --> CTE2
CTE1 --> Result
CTE2 --> FoldersQuery
Request --> RootFilesQuery
RootFilesQuery --> Result
FoldersQuery --> Result
RootFilesQuery --> json_agg_root
FoldersQuery --> json_agg_folders
FoldersQuery --> json_agg_folder_files

subgraph subGraph0 ["JSON Aggregation"]
    json_agg_root
    json_agg_folders
    json_agg_folder_files
end
```

### CTE Breakdown

| CTE Name | Purpose | Key Columns |
| --- | --- | --- |
| `counts` | Calculate total folder count for pagination | `total_folders::int` |
| `page_folders` | Select current page of folders | `id, user_id, name, created_at, updated_at` |

### JSON Aggregation Strategy

The query uses `json_agg` with `json_build_object` to construct nested JSON structures directly in PostgreSQL:

1. **Root Files**: Files where `folder_id IS NULL`, aggregated into JSON array ordered by `updated_at DESC`
2. **Folders**: Page of folders from `page_folders` CTE
3. **Folder Files**: For each folder, a `LEFT JOIN LATERAL` subquery aggregates its files into a JSON array

The `COALESCE(..., '[]')` pattern ensures empty arrays instead of `NULL` when no records exist.

**Sources:** [packages/server/src/public/files/files-repo.ts L18-L168](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/src/public/files/files-repo.ts#L18-L168)

### Pagination Metadata

```mermaid
flowchart TD

Input["offset, limit"]
Calculation["hasNext = <br>(offset + limit) < total"]
Output["Result includes:<br>total, offset, limit, hasNext"]

Input --> Calculation
Calculation --> Output
```

The `hasNext` boolean enables infinite scroll patterns by comparing `(offset + limit)` against the total folder count.

**Sources:** [packages/server/src/public/files/files-repo.ts L153-L163](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/src/public/files/files-repo.ts#L153-L163)

---

## Folder Management

### Creating Folders

The `insertFolder` method creates a new folder and returns the complete `Folder` record with generated ID and timestamps.

| Parameter | Type | Description |
| --- | --- | --- |
| `userId` | `UserId` | Owner of the folder |
| `name` | `String` | Folder name |

**Returns:** `Folder` with `id`, `name`, `createdAt`, `updatedAt`

**Sources:** [packages/server/src/public/files/files-repo.ts L170-L194](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/src/public/files/files-repo.ts#L170-L194)

### Deleting Folders

The `deleteFolders` method implements a two-phase delete:

```mermaid
sequenceDiagram
  participant Caller
  participant deleteFolders
  participant PostgreSQL
  participant UploadThing

  Caller->>deleteFolders: folderIds, userId
  deleteFolders->>PostgreSQL: SELECT uploadthing_key FROM files
  PostgreSQL-->>deleteFolders: WHERE folder_id IN (folderIds)
  deleteFolders->>PostgreSQL: Array of uploadthing keys
  note over PostgreSQL: CASCADE deletes files
  deleteFolders-->>Caller: DELETE FROM file_folders
  Caller->>UploadThing: WHERE id IN (folderIds)
```

This pattern enables the caller to clean up external storage after successful database deletion.

**Sources:** [packages/server/src/public/files/files-repo.ts L318-L354](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/src/public/files/files-repo.ts#L318-L354)

---

## File Management

### Inserting Files

The `insertFile` method handles two scenarios:

1. **Root-level files** (`folderId === null`): Direct insert without ownership check
2. **Folder files** (`folderId !== null`): Insert with CTE-based ownership validation

```mermaid
flowchart TD

insertFile["insertFile(req)"]
CheckFolderId["req.folderId === null?"]
DirectInsert["Direct INSERT<br>folder_id = NULL"]
FolderInsert["INSERT with CTE<br>folder_check validates ownership"]
Result["RETURNING UploadedFile"]
FolderCTE["WITH folder_check AS<br>SELECT id, user_id<br>WHERE id = folderId<br>AND user_id = userId"]
ConditionalInsert["INSERT...SELECT<br>FROM folder_check"]

insertFile --> CheckFolderId
CheckFolderId --> DirectInsert
CheckFolderId --> FolderInsert
DirectInsert --> Result
FolderInsert --> Result
FolderInsert --> FolderCTE

subgraph subGraph0 ["Folder Validation (CTE)"]
    FolderCTE
    ConditionalInsert
    FolderCTE --> ConditionalInsert
end
```

The CTE pattern ensures that files can only be inserted into folders owned by the requesting user. If the folder doesn't exist or is owned by another user, the `INSERT...SELECT` returns zero rows.

**Sources:** [packages/server/src/public/files/files-repo.ts L196-L293](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/src/public/files/files-repo.ts#L196-L293)

### Deleting Files

The `deleteFiles` method deletes files and returns their UploadThing keys for external cleanup:

```

```

The `userId` filter ensures multi-tenant isolation at the SQL level.

**Sources:** [packages/server/src/public/files/files-repo.ts L295-L316](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/src/public/files/files-repo.ts#L295-L316)

### Moving Files

The `moveFiles` method updates the `folder_id` of files, with conditional logic based on the target:

| Target | SQL Logic |
| --- | --- |
| Root level (`folderId === null`) | `UPDATE SET folder_id = NULL` |
| Specific folder | `UPDATE SET folder_id = folderId` with `EXISTS` subquery validating folder ownership |

```mermaid
flowchart TD

moveFiles["moveFiles(req)"]
CheckNull["req.folderId === null?"]
MoveToRoot["UPDATE files<br>SET folder_id = NULL<br>WHERE id IN (fileIds)<br>AND user_id = userId"]
MoveToFolder["UPDATE files<br>SET folder_id = folderId<br>WHERE id IN (fileIds)<br>AND user_id = userId<br>AND EXISTS (folder ownership check)"]
ExistsSubquery["EXISTS (<br>SELECT 1 FROM file_folders<br>WHERE id = folderId<br>AND user_id = userId<br>)"]

moveFiles --> CheckNull
CheckNull --> MoveToRoot
CheckNull --> MoveToFolder
MoveToFolder --> ExistsSubquery

subgraph subGraph0 ["Ownership Validation"]
    ExistsSubquery
end
```

The `EXISTS` subquery prevents moving files into folders owned by other users.

**Sources:** [packages/server/src/public/files/files-repo.ts L356-L395](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/src/public/files/files-repo.ts#L356-L395)

---

## Query by Keys

### Batch File Retrieval

The `getFilesByKeys` method fetches files by their UploadThing keys and returns them in the same order as the input array, with `null` for missing keys.

```mermaid
sequenceDiagram
  participant Caller
  participant getFilesByKeys
  participant PostgreSQL
  participant Map

  Caller->>getFilesByKeys: [key1, key2, key3], userId
  loop [Empty array]
    getFilesByKeys-->>Caller: []
    getFilesByKeys->>PostgreSQL: SELECT * FROM files
    PostgreSQL-->>getFilesByKeys: WHERE uploadthing_key IN (keys)
    getFilesByKeys->>Map: AND user_id = userId
    getFilesByKeys->>Map: Array of UploadedFile
  end
  getFilesByKeys-->>Caller: Create Map<key, file>
```

This method is critical for the upload synchronization flow, where the client polls for files to appear after direct S3 upload.

**Key Implementation Details:**

1. **Empty array optimization**: Returns immediately if input is empty [packages/server/src/public/files/files-repo.ts L402-L404](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/src/public/files/files-repo.ts#L402-L404)
2. **Order preservation**: Uses a `Map` to match results back to input order [packages/server/src/public/files/files-repo.ts L431-L435](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/src/public/files/files-repo.ts#L431-L435)
3. **Null for missing**: Returns `null` for keys not found in database

**Sources:** [packages/server/src/public/files/files-repo.ts L397-L436](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/src/public/files/files-repo.ts#L397-L436)

### Single File Lookup

The `findById` method retrieves a single file by its database ID:

```

```

Returns `SqlError` if the file doesn't exist or belongs to another user.

**Sources:** [packages/server/src/public/files/files-repo.ts L438-L462](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/src/public/files/files-repo.ts#L438-L462)

---

## Multi-Tenant Security Model

Every repository method enforces tenant isolation through SQL-level filtering on `user_id`. This ensures that users can only access their own data, even if they somehow obtain valid IDs for other users' resources.

```mermaid
flowchart TD

Request["moveFiles request<br>{fileIds, folderId, userId}"]
FileCheck["WHERE id IN (fileIds)<br>AND user_id = userId"]
FolderCheck["WHERE folder.id = folderId<br>AND folder.user_id = userId"]
Update["UPDATE succeeds only if<br>both checks pass"]
PolicyLayer["Policy Layer<br>CurrentUser context"]
RepositoryLayer["Repository Layer<br>user_id filtering"]
DatabaseLayer["Database Layer<br>Row-level isolation"]

subgraph subGraph1 ["Example: moveFiles"]
    Request
    FileCheck
    FolderCheck
    Update
    Request --> FileCheck
    Request --> FolderCheck
    FileCheck --> Update
    FolderCheck --> Update
end

subgraph subGraph0 ["Security Layers"]
    PolicyLayer
    RepositoryLayer
    DatabaseLayer
    PolicyLayer --> RepositoryLayer
    RepositoryLayer --> DatabaseLayer
end
```

### Security Patterns by Method

| Method | Security Mechanism |
| --- | --- |
| `listPaginated` | Filters folders and files by `user_id` in all CTEs |
| `insertFolder` | Directly inserts with provided `userId` |
| `insertFile` | CTE validates folder ownership before insert (if folderId provided) |
| `deleteFiles` | `WHERE user_id = userId` prevents deleting others' files |
| `deleteFolders` | Joins with folders table to ensure ownership |
| `moveFiles` | `EXISTS` subquery validates destination folder ownership |
| `getFilesByKeys` | `WHERE user_id = userId` filters results |
| `findById` | `WHERE user_id = userId` enforces ownership |

**Sources:** All methods in [packages/server/src/public/files/files-repo.ts L18-L462](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/src/public/files/files-repo.ts#L18-L462)

---

## Type Safety and Error Handling

### Effect SQL Schema Integration

All SQL queries use `SqlSchema` helpers for compile-time type safety:

```mermaid
flowchart TD

Request["Request Schema<br>Effect.Schema"]
Execute["SQL Query<br>Tagged template"]
Result["Result Schema<br>Effect.Schema"]
Validate["Runtime Validation"]
Effect["Effect"]

Request --> Execute
Execute --> Validate
Result --> Validate
Validate --> Effect
```

### Schema Composition

The repository uses domain schemas directly:

| Schema | Source | Purpose |
| --- | --- | --- |
| `UserId` | `@example/domain/policy` | User identification |
| `FolderId` | `@example/domain/api/files/files-rpc` | Folder IDs |
| `UploadedFileId` | `@example/domain/api/files/files-rpc` | File IDs |
| `UploadedFile` | `@example/domain/api/files/files-rpc` | File data model |
| `Folder` | `@example/domain/api/files/files-rpc` | Folder data model |
| `Folder.WithUploadedFiles` | `@example/domain/api/files/files-rpc` | Folder with nested files |

**Sources:** [packages/server/src/public/files/files-repo.ts L4-L5](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/src/public/files/files-repo.ts#L4-L5)

### Error Handling Strategy

All methods use `.pipe(Effect.orDie)`, which converts SQL errors into defects. This is appropriate for repository operations where SQL errors indicate programmer errors (malformed queries) or infrastructure failures (database down), not recoverable business logic errors.

### Observability

Every method is wrapped with `Effect.withSpan("FilesRepo.methodName")` for distributed tracing integration with OpenTelemetry/Jaeger.

**Example trace spans:**

* `FilesRepo.listPaginated`
* `FilesRepo.insertFile`
* `FilesRepo.deleteFiles`
* `FilesRepo.moveFiles`

**Sources:** All methods include `.pipe(..., Effect.withSpan(...))` [packages/server/src/public/files/files-repo.ts L167-L394](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/src/public/files/files-repo.ts#L167-L394)