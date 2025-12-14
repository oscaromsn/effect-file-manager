import { makeAtomRuntime } from "@/lib/atom";
import { DomainRpcClient } from "@/lib/domain-rpc-client";
import { Atom, Registry } from "@effect-atom/atom-react";
import * as HttpBody from "@effect/platform/HttpBody";
import * as HttpClient from "@effect/platform/HttpClient";
import * as FetchHttpClient from "@effect/platform/FetchHttpClient";
import {
  GetResumeRpc,
  ParseResumeRpc,
  type ParseEvent,
  type PartialResumeData as DomainPartialResumeData,
  type ResumeAnalysis,
  type ResumeId,
  type PositionType,
  type CompanyProfile,
  POSITION_TYPES,
  COMPANY_PROFILES,
} from "@example/domain/api/resume/resume-rpc";
import {
  InitiateUploadRpc,
  GetFilesByKeysRpc,
  type UploadedFileId,
} from "@example/domain/api/files/files-rpc";
import * as Arr from "effect/Array";
import * as Data from "effect/Data";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Schedule from "effect/Schedule";
import * as Stream from "effect/Stream";

// Re-export for components
export type PartialResumeData = DomainPartialResumeData;
export type { ResumeAnalysis, PositionType, CompanyProfile };
export { POSITION_TYPES, COMPANY_PROFILES };

// ================================
// Api Service
// ================================

export class ResumeApi extends Effect.Service<ResumeApi>()(
  "@example/client/routes/resume/-resume/resume-atoms/ResumeApi",
  {
    dependencies: [DomainRpcClient.Default],
    effect: Effect.gen(function* () {
      const rpc = yield* DomainRpcClient;
      return {
        list: () => rpc.resume_list(),
        get: (payload: (typeof GetResumeRpc)["payloadSchema"]["Type"]) => rpc.resume_get(payload),
        parse: (payload: (typeof ParseResumeRpc)["payloadSchema"]["Type"]) =>
          rpc.resume_parse(payload),
        initiateUpload: (payload: (typeof InitiateUploadRpc)["payloadSchema"]["Type"]) =>
          rpc.files_initiateUpload(payload),
        getFilesByKeys: (payload: (typeof GetFilesByKeysRpc)["payloadSchema"]["Type"]) =>
          rpc.files_getFilesByKeys(payload),
      };
    }),
  },
) {}

// ================================
// FilePicker Service
// ================================

export class FilePicker extends Effect.Service<FilePicker>()(
  "@example/client/routes/resume/-resume/resume-atoms/FilePicker",
  {
    scoped: Effect.gen(function* () {
      const fileRef = yield* Effect.acquireRelease(
        Effect.sync(() => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "application/pdf,.pdf";
          input.style.display = "none";
          document.body.appendChild(input);
          return input;
        }),
        (input) =>
          Effect.sync(() => {
            input.remove();
          }),
      );

      return {
        open: Effect.async<Option.Option<File>>((resume) => {
          const changeHandler = (e: Event) => {
            const selectedFile = (e.target as HTMLInputElement).files?.[0];
            resume(Effect.succeed(Option.fromNullable(selectedFile)));
            fileRef.value = "";
          };

          const cancelHandler = () => {
            resume(Effect.succeed(Option.none()));
          };

          fileRef.addEventListener("change", changeHandler, { once: true });
          fileRef.addEventListener("cancel", cancelHandler, { once: true });
          fileRef.click();

          return Effect.sync(() => {
            fileRef.removeEventListener("change", changeHandler);
            fileRef.removeEventListener("cancel", cancelHandler);
          });
        }),
      };
    }),
  },
) {}

// ================================
// Runtime
// ================================

export const runtime = makeAtomRuntime(
  Layer.mergeAll(ResumeApi.Default, FetchHttpClient.layer, FilePicker.Default),
);

// ================================
// Resume List Atom
// ================================

export const resumeListAtom = runtime.atom(
  Effect.gen(function* () {
    const api = yield* ResumeApi;
    return yield* api.list();
  }),
);

// ================================
// Selected Resume State
// ================================

export const selectedResumeIdAtom = Atom.make<ResumeId | null>(null);

// ================================
// Context Filter State
// ================================

// Default: FULLSTACK + SCALEUP (general purpose defaults)
export const selectedPositionAtom = Atom.make<PositionType>("FULLSTACK");
export const selectedCompanyAtom = Atom.make<CompanyProfile>("SCALEUP");

// ================================
// Active Parsing State
// ================================

export type ParsingPhase = Data.TaggedEnum<{
  Idle: {};
  Parsing: { partial: PartialResumeData };
  Complete: { analysis: ResumeAnalysis };
  Error: { message: string };
}>;
const ParsingPhase = Data.taggedEnum<ParsingPhase>();

export type ActiveParsing = {
  readonly id: string;
  readonly fileId: UploadedFileId;
  readonly fileName: string;
};

export const activeParsingAtom = Atom.make<ActiveParsing | null>(null);
export const parsingPhaseAtom = Atom.make<ParsingPhase>(ParsingPhase.Idle());

// ================================
// Cached Resume Analysis (for local updates)
// ================================

export const localResumesAtom = Atom.make<ReadonlyArray<ResumeAnalysis>>([]);

// ================================
// Parse Resume Stream
// ================================

type ParseResumePayload = {
  readonly fileId: UploadedFileId;
  readonly fileName: string;
};

export const parseResumeAtom = runtime.fn(
  Effect.fn(function* (payload: ParseResumePayload) {
    const api = yield* ResumeApi;
    const registry = yield* Registry.AtomRegistry;

    const parsingId = crypto.randomUUID();

    // Set active parsing state
    registry.set(activeParsingAtom, {
      id: parsingId,
      fileId: payload.fileId,
      fileName: payload.fileName,
    });
    registry.set(parsingPhaseAtom, ParsingPhase.Idle());

    // Start the parsing stream
    const stream = api.parse({ fileId: payload.fileId });

    yield* Stream.runForEach(stream, (event: ParseEvent) =>
      Effect.sync(() => {
        if (event._tag === "Partial") {
          registry.set(parsingPhaseAtom, ParsingPhase.Parsing({ partial: event.data }));
        } else if (event._tag === "Complete") {
          registry.set(parsingPhaseAtom, ParsingPhase.Complete({ analysis: event.analysis }));
          // Add to local cache
          registry.set(
            localResumesAtom,
            Arr.prepend(registry.get(localResumesAtom), event.analysis),
          );
          // Select the new resume
          registry.set(selectedResumeIdAtom, event.analysis.id);
          // Clear active parsing
          registry.set(activeParsingAtom, null);
        }
      }),
    ).pipe(
      Effect.catchAll((error) =>
        Effect.sync(() => {
          const message =
            error && typeof error === "object" && "message" in error
              ? String(error.message)
              : "Failed to parse resume";
          registry.set(parsingPhaseAtom, ParsingPhase.Error({ message }));
          registry.set(activeParsingAtom, null);
        }),
      ),
    );
  }),
);

// ================================
// Selection Helpers
// ================================

export const selectResumeAtom = runtime.fn(
  Effect.fn(function* (resumeId: ResumeId) {
    const registry = yield* Registry.AtomRegistry;
    registry.set(selectedResumeIdAtom, resumeId);
    // Don't clear parsing state - parsing continues in background
    // User can view other resumes while parsing is in progress
  }),
);

export const clearSelectionAtom = runtime.fn(
  Effect.fn(function* (_: void) {
    const registry = yield* Registry.AtomRegistry;
    registry.set(selectedResumeIdAtom, null);
    // Don't clear parsing state - this just clears the selection
    // so the viewer falls through to showing parsing content if active
  }),
);

// ================================
// Helper: Get score tier color
// ================================

export const getScoreTierColor = (score: number): string => {
  if (score >= 800) return "text-green-600";
  if (score >= 500) return "text-yellow-600";
  return "text-red-600";
};

export const getScoreTierLabel = (score: number): string => {
  if (score >= 800) return "Strong Match";
  if (score >= 500) return "Potential Match";
  return "Needs Development";
};

// ================================
// Upload State
// ================================

export type UploadPhase = Data.TaggedEnum<{
  Idle: {};
  Uploading: { fileName: string };
  Syncing: { fileName: string };
  Error: { message: string };
}>;
const UploadPhase = Data.taggedEnum<UploadPhase>();

export const uploadPhaseAtom = Atom.make<UploadPhase>(UploadPhase.Idle());

// ================================
// Upload and Parse Resume
// ================================

export const uploadAndParseAtom = runtime.fn(
  Effect.fn(function* (_: void) {
    const api = yield* ResumeApi;
    const filePicker = yield* FilePicker;
    const registry = yield* Registry.AtomRegistry;
    const httpClient = (yield* HttpClient.HttpClient).pipe(
      HttpClient.filterStatusOk,
      HttpClient.retryTransient({
        times: 3,
        schedule: Schedule.exponential("250 millis", 1.5),
      }),
    );

    // Open file picker
    const selectedFile = yield* filePicker.open.pipe(
      Effect.flatten,
      Effect.catchTag("NoSuchElementException", () => Effect.interrupt),
    );

    // Validate PDF
    if (selectedFile.type !== "application/pdf") {
      registry.set(uploadPhaseAtom, UploadPhase.Error({ message: "Only PDF files are supported" }));
      return;
    }

    const fileName = selectedFile.name;

    try {
      // Phase 1: Upload
      registry.set(uploadPhaseAtom, UploadPhase.Uploading({ fileName }));

      const { presignedUrl, fields, fileKey } = yield* api.initiateUpload({
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        mimeType: selectedFile.type,
        folderId: null,
      });

      const formData = new FormData();
      for (const [key, value] of Object.entries(fields)) {
        formData.append(key, value);
      }
      formData.append("file", selectedFile);

      // v7 uses PUT, v6 used POST
      if (Object.keys(fields).length === 0) {
        yield* httpClient.put(presignedUrl, { body: HttpBody.formData(formData) });
      } else {
        yield* httpClient.post(presignedUrl, { body: HttpBody.formData(formData) });
      }

      // Phase 2: Wait for file sync
      registry.set(uploadPhaseAtom, UploadPhase.Syncing({ fileName }));

      // Poll for file to appear in database
      const file = yield* Effect.retry(
        Effect.gen(function* () {
          const files = yield* api.getFilesByKeys({ uploadthingKeys: [fileKey] });
          const found = files.find((f) => f !== null);
          if (!found) {
            return yield* Effect.fail("not_found" as const);
          }
          return found;
        }),
        {
          times: 20,
          schedule: Schedule.spaced("500 millis"),
        },
      );

      // Phase 3: Start parsing
      registry.set(uploadPhaseAtom, UploadPhase.Idle());

      const parsingId = crypto.randomUUID();
      registry.set(activeParsingAtom, {
        id: parsingId,
        fileId: file.id,
        fileName: file.name,
      });
      registry.set(parsingPhaseAtom, ParsingPhase.Idle());

      // Start the parsing stream
      const stream = api.parse({ fileId: file.id });

      yield* Stream.runForEach(stream, (event: ParseEvent) =>
        Effect.sync(() => {
          if (event._tag === "Partial") {
            registry.set(parsingPhaseAtom, ParsingPhase.Parsing({ partial: event.data }));
          } else if (event._tag === "Complete") {
            registry.set(parsingPhaseAtom, ParsingPhase.Complete({ analysis: event.analysis }));
            registry.set(
              localResumesAtom,
              Arr.prepend(registry.get(localResumesAtom), event.analysis),
            );
            registry.set(selectedResumeIdAtom, event.analysis.id);
            registry.set(activeParsingAtom, null);
          }
        }),
      ).pipe(
        Effect.catchAll((error) =>
          Effect.sync(() => {
            const message =
              error && typeof error === "object" && "message" in error
                ? String(error.message)
                : "Failed to parse resume";
            registry.set(parsingPhaseAtom, ParsingPhase.Error({ message }));
            registry.set(activeParsingAtom, null);
          }),
        ),
      );
    } catch {
      registry.set(uploadPhaseAtom, UploadPhase.Error({ message: "Upload failed" }));
    }
  }),
);
