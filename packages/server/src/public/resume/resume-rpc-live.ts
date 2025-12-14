import { Policy } from "@example/domain";
import {
  FileNotFoundError,
  LimitExceededError,
  ParsingFailedError,
  ResumeRpc,
  type ParseEvent,
  type ResumeAnalysis,
} from "@example/domain/api/resume/resume-rpc";
import { b } from "@/baml_client";
import baml from "@boundaryml/baml";
const { Pdf } = baml;
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Stream from "effect/Stream";
import { FilesRepo } from "../files/files-repo";
import { ResumeRepo } from "./resume-repo";

const MAX_RESUMES_PER_USER = 10;

const calculateScore = (experience: readonly string[]): number => {
  const count = experience.length;
  if (count < 3) return 300;
  if (count <= 6) return 800;
  return 1000;
};

export const ResumeRpcLive = ResumeRpc.toLayer(
  Effect.gen(function* () {
    const resumeRepo = yield* ResumeRepo;
    const filesRepo = yield* FilesRepo;

    return ResumeRpc.of({
      resume_list: Effect.fn(function* () {
        const user = yield* Policy.CurrentUser;
        return yield* resumeRepo.list({ userId: user.userId });
      }),

      resume_get: Effect.fn(function* (payload) {
        const user = yield* Policy.CurrentUser;
        return yield* resumeRepo.findById({
          resumeId: payload.resumeId,
          userId: user.userId,
        });
      }),

      resume_parse: (payload) =>
        Effect.gen(function* () {
          const user = yield* Policy.CurrentUser;

          // 1. Check limit (10 max)
          const count = yield* resumeRepo.countByUser({ userId: user.userId });
          if (count >= MAX_RESUMES_PER_USER) {
            return yield* Effect.fail(
              new LimitExceededError({
                message: `Maximum of ${MAX_RESUMES_PER_USER} resumes allowed per user.`,
              }),
            );
          }

          // 2. Get file info
          const fileOption = yield* filesRepo.findById({
            fileId: payload.fileId,
            userId: user.userId,
          });

          if (Option.isNone(fileOption)) {
            return yield* Effect.fail(new FileNotFoundError());
          }

          const file = fileOption.value;

          // 3. Validate file is a PDF
          if (file.mimeType !== "application/pdf") {
            return yield* Effect.fail(
              new ParsingFailedError({
                message: "File must be a PDF document.",
              }),
            );
          }

          // 4. Create BAML PDF object from URL
          const pdf = Pdf.fromUrl(file.uploadthingUrl);

          // 5. Stream BAML parsing results
          const bamlStream = b.stream.ExtractResume(pdf);

          return Stream.async<ParseEvent, LimitExceededError | FileNotFoundError | ParsingFailedError>(
            (emit) => {
              (async () => {
                try {
                  for await (const partial of bamlStream) {
                    emit.single({
                      _tag: "Partial",
                      data: {
                        name: partial.name ?? null,
                        email: partial.email ?? null,
                        experience: partial.experience ?? [],
                        skills: partial.skills ?? [],
                      },
                    });
                  }

                  // Get final response and save to database
                  const finalResult = await bamlStream.getFinalResponse();

                  const score = calculateScore(finalResult.experience);

                  // Save to database - run this in Effect context
                  const analysis: ResumeAnalysis = await Effect.runPromise(
                    resumeRepo
                      .create({
                        userId: user.userId,
                        fileId: file.id,
                        fileName: file.name,
                        parsedData: {
                          name: finalResult.name,
                          email: finalResult.email,
                          experience: [...finalResult.experience],
                          skills: [...finalResult.skills],
                        },
                        score,
                      })
                      .pipe(Effect.orDie),
                  );

                  emit.single({
                    _tag: "Complete",
                    analysis,
                  });

                  emit.end();
                } catch (error) {
                  emit.fail(
                    new ParsingFailedError({
                      message:
                        error instanceof Error
                          ? `Unable to parse resume: ${error.message}`
                          : "Unable to parse resume. Please ensure the file is a valid resume document.",
                    }),
                  );
                }
              })();
            },
            "unbounded",
          );
        }).pipe(Stream.unwrap),
    });
  }),
).pipe(Layer.provide([ResumeRepo.Default, FilesRepo.Default]));
