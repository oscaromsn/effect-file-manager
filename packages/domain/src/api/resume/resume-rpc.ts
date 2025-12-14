import * as Rpc from "@effect/rpc/Rpc";
import * as RpcGroup from "@effect/rpc/RpcGroup";
import * as Schema from "effect/Schema";
import { UploadedFileId } from "../files/files-rpc.js";
import { CurrentUserRpcMiddleware } from "../../policy.js";

// --- Domain Models ---

export const ResumeId = Schema.UUID.pipe(Schema.brand("ResumeId"));
export type ResumeId = typeof ResumeId.Type;

export class ResumeData extends Schema.Class<ResumeData>("ResumeData")({
  name: Schema.String,
  email: Schema.String,
  experience: Schema.Array(Schema.String),
  skills: Schema.Array(Schema.String),
}) {}

export const PartialResumeData = Schema.Struct({
  name: Schema.optionalWith(Schema.NullOr(Schema.String), { exact: true }),
  email: Schema.optionalWith(Schema.NullOr(Schema.String), { exact: true }),
  experience: Schema.Array(Schema.String),
  skills: Schema.Array(Schema.String),
});
export type PartialResumeData = typeof PartialResumeData.Type;

export class ResumeAnalysis extends Schema.Class<ResumeAnalysis>("ResumeAnalysis")({
  id: ResumeId,
  fileId: UploadedFileId,
  fileName: Schema.String,
  data: ResumeData,
  score: Schema.Number,
  createdAt: Schema.DateTimeUtc,
}) {}

// --- Stream Event Types ---

export const ParseEvent = Schema.Union(
  Schema.TaggedStruct("Partial", {
    data: PartialResumeData,
  }),
  Schema.TaggedStruct("Complete", {
    analysis: ResumeAnalysis,
  }),
);
export type ParseEvent = typeof ParseEvent.Type;

// --- Error Types ---

export class LimitExceededError extends Schema.TaggedError<LimitExceededError>()(
  "LimitExceeded",
  {
    message: Schema.String,
  },
) {}

export class FileNotFoundError extends Schema.TaggedError<FileNotFoundError>()(
  "FileNotFound",
  {},
) {}

export class ParsingFailedError extends Schema.TaggedError<ParsingFailedError>()(
  "ParsingFailed",
  {
    message: Schema.String,
  },
) {}

// --- RPC Definitions ---

export class ParseResumeRpc extends Rpc.make("parse", {
  payload: Schema.Struct({
    fileId: UploadedFileId,
  }),
  stream: true,
  success: ParseEvent,
  error: Schema.Union(LimitExceededError, FileNotFoundError, ParsingFailedError),
}) {}

export class ListResumesRpc extends Rpc.make("list", {
  success: Schema.Array(ResumeAnalysis),
}) {}

export class GetResumeRpc extends Rpc.make("get", {
  payload: Schema.Struct({
    resumeId: ResumeId,
  }),
  success: Schema.NullOr(ResumeAnalysis),
}) {}

// --- RPC Group ---

export class ResumeRpc extends RpcGroup.make(
  ParseResumeRpc,
  ListResumesRpc,
  GetResumeRpc,
)
  .prefix("resume_")
  .middleware(CurrentUserRpcMiddleware) {}
