import { EnvVars } from "@/lib/env-vars";
import { withResponseErrorLogging } from "@/lib/with-response-error-logging";
import * as FetchHttpClient from "@effect/platform/FetchHttpClient";
import * as HttpBody from "@effect/platform/HttpBody";
import * as HttpClient from "@effect/platform/HttpClient";
import * as HttpClientRequest from "@effect/platform/HttpClientRequest";
import * as HttpClientResponse from "@effect/platform/HttpClientResponse";
import { Policy } from "@example/domain";
import { FolderId } from "@example/domain/api/files/files-rpc";
import { UserId } from "@example/domain/policy";
import * as Effect from "effect/Effect";
import * as Redacted from "effect/Redacted";
import * as Schedule from "effect/Schedule";
import * as Schema from "effect/Schema";

export class UploadMetadata extends Schema.Class<UploadMetadata>("UploadMetadata")({
  userId: UserId,
  folderId: Schema.NullOr(FolderId),
}) {}

/** Pending uploads storage - for local dev when callbacks can't reach localhost */
export type PendingUpload = {
  fileKey: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  userId: UserId;
  folderId: FolderId | null;
  createdAt: Date;
};

const pendingUploads = new Map<string, PendingUpload>();

export const PendingUploads = {
  set: (upload: PendingUpload) => pendingUploads.set(upload.fileKey, upload),
  get: (fileKey: string) => pendingUploads.get(fileKey),
  delete: (fileKey: string) => pendingUploads.delete(fileKey),
};

const PrepareUploadResponse = Schema.Struct({
  key: Schema.String,
  url: Schema.String,
});

const ListFilesResponse = Schema.Struct({
  files: Schema.Array(
    Schema.Struct({
      id: Schema.String,
      key: Schema.String,
      name: Schema.String,
      status: Schema.String,
    }),
  ),
});

export type UploadedFileInfo = {
  key: string;
  name: string;
  url: string;
};

export class UploadThingApi extends Effect.Service<UploadThingApi>()(
  "@example/server/public/files/upload-thing-api/UploadThingApi",
  {
    dependencies: [FetchHttpClient.layer, EnvVars.Default],
    effect: Effect.gen(function* () {
      const envVars = yield* EnvVars;
      const baseClient = yield* HttpClient.HttpClient;

      // v7 API client (for prepareUpload, deleteFiles)
      const v7Client = baseClient.pipe(
        HttpClient.mapRequest((req) =>
          req.pipe(
            HttpClientRequest.prependUrl("https://api.uploadthing.com/v7"),
            HttpClientRequest.setHeader(
              "x-uploadthing-api-key",
              Redacted.value(envVars.UPLOADTHING_API_KEY),
            ),
          ),
        ),
        HttpClient.filterStatusOk,
        withResponseErrorLogging,
        HttpClient.retryTransient({
          times: 3,
          schedule: Schedule.exponential("250 millis", 1.5),
        }),
      );

      // v6 API client (for listFiles - not available in v7)
      const v6Client = baseClient.pipe(
        HttpClient.mapRequest((req) =>
          req.pipe(
            HttpClientRequest.prependUrl("https://api.uploadthing.com/v6"),
            HttpClientRequest.setHeader(
              "x-uploadthing-api-key",
              Redacted.value(envVars.UPLOADTHING_API_KEY),
            ),
          ),
        ),
        HttpClient.filterStatusOk,
        withResponseErrorLogging,
      );

      return {
        initiateUpload: (payload: {
          readonly fileName: string;
          readonly fileSize: number;
          readonly mimeType: string;
          readonly folderId: FolderId | null;
        }) =>
          Effect.gen(function* () {
            const currentUser = yield* Policy.CurrentUser;
            return yield* v7Client
              .post("/prepareUpload", {
                body: HttpBody.unsafeJson({
                  fileName: payload.fileName,
                  fileSize: payload.fileSize,
                  fileType: payload.mimeType,
                  callbackUrl: `${envVars.API_URL}/uploadThingCallback`,
                  callbackSlug: "upload",
                  metadata: new UploadMetadata({
                    userId: currentUser.userId,
                    folderId: payload.folderId,
                  }),
                }),
              })
              .pipe(
                Effect.flatMap(HttpClientResponse.schemaBodyJson(PrepareUploadResponse)),
                Effect.map((response) => {
                  // Store pending upload for polling (local dev fallback)
                  PendingUploads.set({
                    fileKey: response.key,
                    fileName: payload.fileName,
                    fileSize: payload.fileSize,
                    mimeType: payload.mimeType,
                    userId: currentUser.userId,
                    folderId: payload.folderId,
                    createdAt: new Date(),
                  });
                  return {
                    presignedUrl: response.url,
                    fileKey: response.key,
                    fields: {} as Record<string, string>,
                  };
                }),
                Effect.tapErrorTag("ParseError", (e) =>
                  Effect.logError("UploadThing response parse failed", e.issue.actual),
                ),
                Effect.orDie,
                Effect.withSpan("UploadThingApi.initiateUpload"),
              );
          }),

        deleteFiles: (fileKeys: string[]) =>
          v6Client
            .post("/deleteFiles", {
              body: HttpBody.unsafeJson({
                fileKeys,
              }),
            })
            .pipe(Effect.orDie, Effect.withSpan("UploadThingApi.deleteFiles")),

        /** Poll UploadThing API to check if file is uploaded */
        getFileByKey: (fileKey: string) =>
          v6Client
            .post("/listFiles", {
              body: HttpBody.unsafeJson({}),
            })
            .pipe(
              Effect.flatMap(HttpClientResponse.schemaBodyJson(ListFilesResponse)),
              Effect.map((response) => {
                const file = response.files.find((f) => f.key === fileKey && f.status === "Uploaded");
                if (!file) return null;
                return {
                  key: file.key,
                  name: file.name,
                  url: `https://utfs.io/f/${file.key}`,
                } satisfies UploadedFileInfo;
              }),
              Effect.orDie,
              Effect.withSpan("UploadThingApi.getFileByKey"),
            ),
      };
    }),
  },
) {}
