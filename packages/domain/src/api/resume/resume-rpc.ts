import * as Rpc from "@effect/rpc/Rpc";
import * as RpcGroup from "@effect/rpc/RpcGroup";
import * as Schema from "effect/Schema";
import { UploadedFileId } from "../files/files-rpc.js";
import { CurrentUserRpcMiddleware } from "../../policy.js";

// --- Context Scoring Types ---

export const PositionType = Schema.Literal(
  "FRONTEND",
  "BACKEND",
  "FULLSTACK",
  "DEVOPS",
  "TECH_LEAD"
);
export type PositionType = typeof PositionType.Type;

export const CompanyProfile = Schema.Literal(
  "STARTUP_EARLY",
  "SCALEUP",
  "ENTERPRISE",
  "CONSULTORIA"
);
export type CompanyProfile = typeof CompanyProfile.Type;

export const ContextScore = Schema.Struct({
  score: Schema.Number,
  dealbreakers: Schema.Array(Schema.String),
});
export type ContextScore = typeof ContextScore.Type;

export const ScoringMatrix = Schema.Record({
  key: PositionType,
  value: Schema.Record({
    key: CompanyProfile,
    value: ContextScore,
  }),
});
export type ScoringMatrix = typeof ScoringMatrix.Type;

// Constants for iteration
export const POSITION_TYPES: readonly PositionType[] = [
  "FRONTEND",
  "BACKEND",
  "FULLSTACK",
  "DEVOPS",
  "TECH_LEAD",
] as const;

export const COMPANY_PROFILES: readonly CompanyProfile[] = [
  "STARTUP_EARLY",
  "SCALEUP",
  "ENTERPRISE",
  "CONSULTORIA",
] as const;

// --- Domain Models ---

export const ResumeId = Schema.UUID.pipe(Schema.brand("ResumeId"));
export type ResumeId = typeof ResumeId.Type;

// Rich structured types for resume data
export const Experience = Schema.Struct({
  company: Schema.String,
  title: Schema.String,
  employmentType: Schema.NullOr(Schema.String),
  startMonth: Schema.NullOr(Schema.Number),
  startYear: Schema.NullOr(Schema.Number),
  endMonth: Schema.NullOr(Schema.Number),
  endYear: Schema.NullOr(Schema.Number),
  isCurrent: Schema.Boolean,
  description: Schema.NullOr(Schema.String),
  technologies: Schema.Array(Schema.String),
});
export type Experience = typeof Experience.Type;

export const Education = Schema.Struct({
  institution: Schema.String,
  degree: Schema.String,
  fieldOfStudy: Schema.NullOr(Schema.String),
  level: Schema.String,
  status: Schema.String,
  startYear: Schema.NullOr(Schema.Number),
  endYear: Schema.NullOr(Schema.Number),
});
export type Education = typeof Education.Type;

export const Skill = Schema.Struct({
  name: Schema.String,
  category: Schema.String,
  yearsExperience: Schema.NullOr(Schema.Number),
});
export type Skill = typeof Skill.Type;

export const Language = Schema.Struct({
  name: Schema.String,
  proficiency: Schema.String,
});
export type Language = typeof Language.Type;

export const Certification = Schema.Struct({
  name: Schema.String,
  issuer: Schema.NullOr(Schema.String),
  year: Schema.NullOr(Schema.Number),
  expirationYear: Schema.NullOr(Schema.Number),
});
export type Certification = typeof Certification.Type;

export class ResumeData extends Schema.Class<ResumeData>("ResumeData")({
  name: Schema.String,
  email: Schema.NullOr(Schema.String),
  phone: Schema.NullOr(Schema.String),
  location: Schema.NullOr(Schema.String),
  linkedinUrl: Schema.NullOr(Schema.String),
  githubUrl: Schema.NullOr(Schema.String),
  summary: Schema.NullOr(Schema.String),
  experience: Schema.Array(Experience),
  education: Schema.Array(Education),
  skills: Schema.Array(Skill),
  languages: Schema.Array(Language),
  certifications: Schema.Array(Certification),
  scoringMatrix: ScoringMatrix,
}) {}

// Partial resume data for streaming (all fields optional except arrays)
export const PartialResumeData = Schema.Struct({
  name: Schema.optionalWith(Schema.NullOr(Schema.String), { exact: true }),
  email: Schema.optionalWith(Schema.NullOr(Schema.String), { exact: true }),
  phone: Schema.optionalWith(Schema.NullOr(Schema.String), { exact: true }),
  location: Schema.optionalWith(Schema.NullOr(Schema.String), { exact: true }),
  linkedinUrl: Schema.optionalWith(Schema.NullOr(Schema.String), { exact: true }),
  githubUrl: Schema.optionalWith(Schema.NullOr(Schema.String), { exact: true }),
  summary: Schema.optionalWith(Schema.NullOr(Schema.String), { exact: true }),
  experience: Schema.Array(Experience),
  education: Schema.Array(Education),
  skills: Schema.Array(Skill),
  languages: Schema.Array(Language),
  certifications: Schema.Array(Certification),
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
