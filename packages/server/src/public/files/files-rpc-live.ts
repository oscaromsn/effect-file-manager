import { Policy } from "@example/domain";
import { FilesRpc, UploadedFile } from "@example/domain/api/files/files-rpc";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Stream from "effect/Stream";
import { EventStreamHub } from "../event-stream/event-stream-hub";
import { FilesRepo } from "./files-repo";
import { PendingUploads, UploadThingApi } from "./upload-thing-api";
import { UploadThingCallbackRoute } from "./upload-thing-callback-route";

export const FilesRpcLive = FilesRpc.toLayer(
  Effect.gen(function* () {
    const repo = yield* FilesRepo;
    const uploadThingApi = yield* UploadThingApi;
    const eventStreamHub = yield* EventStreamHub;

    return FilesRpc.of({
      files_initiateUpload: (payload) => uploadThingApi.initiateUpload(payload),

      files_createFolder: Effect.fn(function* (payload) {
        const currentUser = yield* Policy.CurrentUser;
        return yield* repo.insertFolder({
          userId: currentUser.userId,
          name: payload.folderName,
        });
      }),

      files_deleteFiles: Effect.fn(function* (payload) {
        const currentUser = yield* Policy.CurrentUser;
        const uploadthingKeys = yield* repo.deleteFiles({
          fileIds: payload.fileIds,
          userId: currentUser.userId,
        });
        if (uploadthingKeys.length > 0) {
          yield* uploadThingApi.deleteFiles(uploadthingKeys);
        }
      }),

      files_deleteFolders: Effect.fn(function* (payload) {
        const currentUser = yield* Policy.CurrentUser;
        const uploadthingKeys = yield* repo.deleteFolders({
          folderIds: payload.folderIds,
          userId: currentUser.userId,
        });
        if (uploadthingKeys.length > 0) {
          yield* uploadThingApi.deleteFiles(uploadthingKeys);
        }
      }),

      files_moveFiles: Effect.fn(function* (payload) {
        const currentUser = yield* Policy.CurrentUser;
        yield* repo.moveFiles({
          fileIds: payload.fileIds,
          folderId: payload.folderId,
          userId: currentUser.userId,
        });
      }),

      files_getFilesByKeys: Effect.fn(function* (payload) {
        const currentUser = yield* Policy.CurrentUser;

        // First check database
        const dbFiles = yield* repo.getFilesByKeys({
          uploadthingKeys: payload.uploadthingKeys,
          userId: currentUser.userId,
        });

        // For files not in DB, check UploadThing API and insert if found
        const results: (UploadedFile | null)[] = [];
        for (let i = 0; i < payload.uploadthingKeys.length; i++) {
          const key = payload.uploadthingKeys[i]!;
          const dbFile = dbFiles[i] ?? null;

          if (dbFile !== null) {
            results.push(dbFile);
            continue;
          }

          // Check if we have pending upload metadata
          const pending = PendingUploads.get(key);
          if (!pending || pending.userId !== currentUser.userId) {
            results.push(null);
            continue;
          }

          // Check UploadThing API if file is ready
          const utFile = yield* uploadThingApi.getFileByKey(key);
          if (!utFile) {
            results.push(null);
            continue;
          }

          // File is ready on UploadThing - insert into database
          yield* Effect.logInfo("Inserting file from polling (callback fallback)", { key });
          const file = yield* repo.insertFile({
            userId: pending.userId,
            folderId: pending.folderId,
            uploadthingKey: utFile.key,
            uploadthingUrl: utFile.url,
            name: utFile.name,
            size: pending.fileSize.toString(),
            mimeType: pending.mimeType,
            uploadedByUserId: pending.userId,
          });

          // Notify via event stream
          yield* eventStreamHub.notifyUser(pending.userId, {
            _tag: "Files.Uploaded",
            file,
          });

          // Clean up pending upload
          PendingUploads.delete(key);
          results.push(file);
        }

        return results;
      }),

      files_list: Effect.fnUntraced(function* () {
        const currentUser = yield* Policy.CurrentUser;
        const limit = 100;
        return Stream.paginateEffect(0, (offset) =>
          repo
            .listPaginated({
              userId: currentUser.userId,
              offset,
              limit,
            })
            .pipe(
              Effect.map(
                (result) =>
                  [
                    { rootFiles: result.rootFiles, folders: result.folders },
                    result.hasNext ? Option.some(offset + limit) : Option.none<number>(),
                  ] as const,
              ),
            ),
        );
      }, Stream.unwrap),
    });
  }),
).pipe(
  Layer.provide([FilesRepo.Default, UploadThingApi.Default, EventStreamHub.Default]),
  Layer.merge(UploadThingCallbackRoute),
);
