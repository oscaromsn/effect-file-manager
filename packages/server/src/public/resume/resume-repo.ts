import { PgLive } from "@/db/pg-live";
import * as SqlClient from "@effect/sql/SqlClient";
import * as SqlSchema from "@effect/sql/SqlSchema";
import { ResumeData, ResumeId } from "@example/domain/api/resume/resume-rpc";
import { UploadedFileId } from "@example/domain/api/files/files-rpc";
import { UserId } from "@example/domain/policy";
import * as Effect from "effect/Effect";
import { flow } from "effect/Function";
import * as Option from "effect/Option";
import * as Schema from "effect/Schema";

// Schema for parsing JSONB data field from database
// The JSONB comes as a string due to identity type parser
const ResumeAnalysisFromDb = Schema.Struct({
  id: ResumeId,
  fileId: UploadedFileId,
  fileName: Schema.String,
  data: Schema.parseJson(ResumeData),
  score: Schema.Number,
  createdAt: Schema.DateTimeUtc,
});

export class ResumeRepo extends Effect.Service<ResumeRepo>()(
  "@example/server/public/resume/resume-repo/ResumeRepo",
  {
    dependencies: [PgLive],
    effect: Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;

      const countByUser = flow(
        SqlSchema.single({
          Request: Schema.Struct({
            userId: UserId,
          }),
          Result: Schema.Struct({
            count: Schema.Number,
          }),
          execute: (req) => sql`
            SELECT
              COUNT(*)::int AS count
            FROM
              public.resumes
            WHERE
              user_id = ${req.userId}
          `,
        }),
        Effect.map((r) => r.count),
        Effect.orDie,
        Effect.withSpan("ResumeRepo.countByUser"),
      );

      const create = flow(
        SqlSchema.single({
          Request: Schema.Struct({
            userId: UserId,
            fileId: UploadedFileId,
            fileName: Schema.String,
            parsedData: ResumeData,
            score: Schema.Number,
          }),
          Result: ResumeAnalysisFromDb,
          execute: (req) => sql`
            INSERT INTO
              public.resumes (user_id, file_id, file_name, parsed_data, score)
            VALUES
              (
                ${req.userId},
                ${req.fileId},
                ${req.fileName},
                ${JSON.stringify(req.parsedData)}::jsonb,
                ${req.score}
              )
            RETURNING
              id,
              file_id AS "fileId",
              file_name AS "fileName",
              parsed_data AS data,
              score,
              created_at AS "createdAt"
          `,
        }),
        Effect.orDie,
        Effect.withSpan("ResumeRepo.create"),
      );

      const list = flow(
        SqlSchema.findAll({
          Request: Schema.Struct({
            userId: UserId,
          }),
          Result: ResumeAnalysisFromDb,
          execute: (req) => sql`
            SELECT
              id,
              file_id AS "fileId",
              file_name AS "fileName",
              parsed_data AS data,
              score,
              created_at AS "createdAt"
            FROM
              public.resumes
            WHERE
              user_id = ${req.userId}
            ORDER BY
              created_at DESC
          `,
        }),
        Effect.orDie,
        Effect.withSpan("ResumeRepo.list"),
      );

      const findById = (req: { resumeId: ResumeId; userId: UserId }) =>
        SqlSchema.findOne({
          Request: Schema.Struct({
            resumeId: ResumeId,
            userId: UserId,
          }),
          Result: ResumeAnalysisFromDb,
          execute: (req) => sql`
            SELECT
              id,
              file_id AS "fileId",
              file_name AS "fileName",
              parsed_data AS data,
              score,
              created_at AS "createdAt"
            FROM
              public.resumes
            WHERE
              id = ${req.resumeId}
              AND user_id = ${req.userId}
          `,
        })(req).pipe(
          Effect.map(Option.getOrNull),
          Effect.orDie,
          Effect.withSpan("ResumeRepo.findById"),
        );

      return {
        countByUser,
        create,
        list,
        findById,
      } as const;
    }),
  },
) {}
