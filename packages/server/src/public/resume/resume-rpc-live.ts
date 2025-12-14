import { Policy } from "@example/domain";
import {
  FileNotFoundError,
  LimitExceededError,
  ParsingFailedError,
  ResumeRpc,
  type ParseEvent,
  type ResumeAnalysis,
  type ResumeData,
  type PartialResumeData,
} from "@example/domain/api/resume/resume-rpc";
import { b } from "@/baml_client";
import type { Resume as BamlResume } from "@/baml_client/types";
import type { partial_types } from "@/baml_client/partial_types";
import baml from "@boundaryml/baml";
const { Pdf } = baml;
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Stream from "effect/Stream";
import { FilesRepo } from "../files/files-repo";
import { ResumeRepo } from "./resume-repo";
import { calculateMatrix, calculateBaseScore } from "./scoring-logic";

const MAX_RESUMES_PER_USER = 10;

// --- BAML to Domain Type Mappers ---

const mapExperience = (exp: BamlResume["experiences"][number]) => ({
  company: exp.company,
  title: exp.title,
  employmentType: exp.employment_type ?? null,
  startMonth: exp.start_month ?? null,
  startYear: exp.start_year ?? null,
  endMonth: exp.end_month ?? null,
  endYear: exp.end_year ?? null,
  isCurrent: exp.is_current,
  description: exp.description ?? null,
  technologies: [...exp.technologies],
});

const mapEducation = (edu: BamlResume["education"][number]) => ({
  institution: edu.institution,
  degree: edu.degree,
  fieldOfStudy: edu.field_of_study ?? null,
  level: edu.level,
  status: edu.status,
  startYear: edu.start_year ?? null,
  endYear: edu.end_year ?? null,
});

const mapSkill = (skill: BamlResume["skills"][number]) => ({
  name: skill.name,
  category: skill.category,
  yearsExperience: skill.years_experience ?? null,
});

const mapLanguage = (lang: BamlResume["languages"][number]) => ({
  name: lang.name,
  proficiency: lang.proficiency,
});

const mapCertification = (cert: BamlResume["certifications"][number]) => ({
  name: cert.name,
  issuer: cert.issuer ?? null,
  year: cert.year ?? null,
  expirationYear: cert.expiration_year ?? null,
});

// --- Partial Type Mappers for Streaming ---

type PartialExperience = partial_types.Resume["experiences"][number];
type PartialEducation = partial_types.Resume["education"][number];
type PartialSkill = partial_types.Resume["skills"][number];
type PartialLanguage = partial_types.Resume["languages"][number];
type PartialCertification = partial_types.Resume["certifications"][number];

const mapPartialExperience = (exp: PartialExperience) => ({
  company: exp.company ?? "",
  title: exp.title ?? "",
  employmentType: exp.employment_type ?? null,
  startMonth: exp.start_month ?? null,
  startYear: exp.start_year ?? null,
  endMonth: exp.end_month ?? null,
  endYear: exp.end_year ?? null,
  isCurrent: exp.is_current ?? false,
  description: exp.description ?? null,
  technologies: [...(exp.technologies ?? [])],
});

const mapPartialEducation = (edu: PartialEducation) => ({
  institution: edu.institution ?? "",
  degree: edu.degree ?? "",
  fieldOfStudy: edu.field_of_study ?? null,
  level: edu.level ?? "",
  status: edu.status ?? "",
  startYear: edu.start_year ?? null,
  endYear: edu.end_year ?? null,
});

const mapPartialSkill = (skill: PartialSkill) => ({
  name: skill.name ?? "",
  category: skill.category ?? "",
  yearsExperience: skill.years_experience ?? null,
});

const mapPartialLanguage = (lang: PartialLanguage) => ({
  name: lang.name ?? "",
  proficiency: lang.proficiency ?? "",
});

const mapPartialCertification = (cert: PartialCertification) => ({
  name: cert.name ?? "",
  issuer: cert.issuer ?? null,
  year: cert.year ?? null,
  expirationYear: cert.expiration_year ?? null,
});

const mapPartialResume = (partial: partial_types.Resume): PartialResumeData => ({
  name: partial.contact?.name ?? null,
  email: partial.contact?.email ?? null,
  phone: partial.contact?.phone ?? null,
  location: partial.contact?.location ?? null,
  linkedinUrl: partial.contact?.linkedin_url ?? null,
  githubUrl: partial.contact?.github_url ?? null,
  summary: partial.summary ?? null,
  experience: (partial.experiences ?? []).map(mapPartialExperience),
  education: (partial.education ?? []).map(mapPartialEducation),
  skills: (partial.skills ?? []).map(mapPartialSkill),
  languages: (partial.languages ?? []).map(mapPartialLanguage),
  certifications: (partial.certifications ?? []).map(mapPartialCertification),
});

const mapFinalResume = (result: BamlResume): Omit<ResumeData, "scoringMatrix"> => ({
  name: result.contact.name,
  email: result.contact.email ?? null,
  phone: result.contact.phone ?? null,
  location: result.contact.location ?? null,
  linkedinUrl: result.contact.linkedin_url ?? null,
  githubUrl: result.contact.github_url ?? null,
  summary: result.summary ?? null,
  experience: result.experiences.map(mapExperience),
  education: result.education.map(mapEducation),
  skills: result.skills.map(mapSkill),
  languages: result.languages.map(mapLanguage),
  certifications: result.certifications.map(mapCertification),
});

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
                  // Stream partial results with rich data
                  for await (const partial of bamlStream) {
                    emit.single({
                      _tag: "Partial",
                      data: mapPartialResume(partial),
                    });
                  }

                  // Get final response
                  const finalResult = await bamlStream.getFinalResponse();

                  // Calculate scoring matrix
                  const scoringMatrix = calculateMatrix(finalResult);
                  const baseScore = calculateBaseScore(finalResult);

                  // Map BAML types to domain types
                  const parsedData: ResumeData = {
                    ...mapFinalResume(finalResult),
                    scoringMatrix,
                  };

                  // Save to database
                  const analysis: ResumeAnalysis = await Effect.runPromise(
                    resumeRepo
                      .create({
                        userId: user.userId,
                        fileId: file.id,
                        fileName: file.name,
                        parsedData,
                        score: baseScore,
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
