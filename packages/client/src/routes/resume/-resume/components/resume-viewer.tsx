import { useAtomValue } from "@effect-atom/atom-react";
import {
  AlertCircle,
  Award,
  BookOpen,
  Briefcase,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  User,
} from "lucide-react";
import { Banner } from "@/components/ui/banner";
import * as Arr from "effect/Array";
import * as Option from "effect/Option";
import {
  activeParsingAtom,
  parsingPhaseAtom,
  selectedResumeIdAtom,
  resumeListAtom,
  localResumesAtom,
  type PartialResumeData,
} from "../resume-atoms";
import type { ResumeData, Experience, Education } from "@example/domain/api/resume/resume-rpc";

type ResumeContentProps = {
  data: PartialResumeData | ResumeData;
  isStreaming?: boolean;
};

const formatDateRange = (exp: Experience): string => {
  const startYear = exp.startYear;
  const endYear = exp.isCurrent ? "Present" : exp.endYear;

  if (!startYear) return "";
  if (!endYear) return String(startYear);
  return `${startYear} - ${endYear}`;
};

const ExperienceItem = ({ exp, isStreaming = false }: { exp: Experience; isStreaming?: boolean }) => {
  const dateRange = formatDateRange(exp);

  return (
    <div className="border-l-2 border-primary/30 pl-3 py-2">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium">{exp.title || (isStreaming ? "..." : "Untitled")}</p>
          <p className="text-sm text-muted-foreground">{exp.company || (isStreaming ? "..." : "Unknown")}</p>
        </div>
        {dateRange && (
          <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
            {dateRange}
          </span>
        )}
      </div>
      {exp.description && (
        <p className="text-sm mt-1 text-muted-foreground">{exp.description}</p>
      )}
      {exp.technologies.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {exp.technologies.map((tech, idx) => (
            <span
              key={idx}
              className="px-1.5 py-0.5 bg-secondary/50 text-secondary-foreground rounded text-xs"
            >
              {tech}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const EducationItem = ({ edu }: { edu: Education }) => {
  const dateStr = edu.endYear ? String(edu.endYear) : "";

  return (
    <div className="border-l-2 border-blue-500/30 pl-3 py-2">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium">{edu.degree}</p>
          <p className="text-sm text-muted-foreground">{edu.institution}</p>
          {edu.fieldOfStudy && (
            <p className="text-xs text-muted-foreground">{edu.fieldOfStudy}</p>
          )}
        </div>
        {dateStr && (
          <span className="text-xs text-muted-foreground ml-2">{dateStr}</span>
        )}
      </div>
      <div className="flex gap-2 mt-1">
        <span className="text-xs px-1.5 py-0.5 bg-blue-500/10 text-blue-600 rounded">
          {edu.level}
        </span>
        <span className="text-xs px-1.5 py-0.5 bg-muted text-muted-foreground rounded">
          {edu.status}
        </span>
      </div>
    </div>
  );
};

const ResumeContent = ({ data, isStreaming }: ResumeContentProps) => {
  const hasEducation = data.education && data.education.length > 0;
  const hasCertifications = data.certifications && data.certifications.length > 0;
  const hasLanguages = data.languages && data.languages.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-2xl font-bold">
            {data.name || (
              <span className="text-muted-foreground italic">
                {isStreaming ? "Extracting name..." : "Unknown"}
              </span>
            )}
          </h2>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {data.email && (
            <div className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              <span>{data.email}</span>
            </div>
          )}
          {data.phone && (
            <div className="flex items-center gap-1">
              <Phone className="h-4 w-4" />
              <span>{data.phone}</span>
            </div>
          )}
          {data.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{data.location}</span>
            </div>
          )}
        </div>

        {data.summary && (
          <p className="text-sm text-muted-foreground mt-2 border-l-2 border-muted pl-3">
            {data.summary}
          </p>
        )}
      </div>

      {/* Experience */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Experience</h3>
          {isStreaming && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {data.experience && data.experience.length > 0 ? (
          <div className="space-y-3 ml-7">
            {data.experience.map((exp, idx) => (
              <ExperienceItem key={idx} exp={exp} isStreaming={isStreaming ?? false} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground ml-7 italic">
            {isStreaming ? "Extracting experience..." : "No experience listed"}
          </p>
        )}
      </div>

      {/* Education */}
      {(hasEducation || isStreaming) && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Education</h3>
            {isStreaming && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {hasEducation ? (
            <div className="space-y-3 ml-7">
              {data.education.map((edu, idx) => (
                <EducationItem key={idx} edu={edu} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground ml-7 italic">
              {isStreaming ? "Extracting education..." : "No education listed"}
            </p>
          )}
        </div>
      )}

      {/* Skills */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Skills</h3>
          {isStreaming && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {data.skills && data.skills.length > 0 ? (
          <div className="flex flex-wrap gap-2 ml-7">
            {data.skills.map((skill, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
                title={skill.category}
              >
                {skill.name}
                {skill.yearsExperience && (
                  <span className="text-xs text-muted-foreground ml-1">
                    ({skill.yearsExperience}y)
                  </span>
                )}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground ml-7 italic">
            {isStreaming ? "Extracting skills..." : "No skills listed"}
          </p>
        )}
      </div>

      {/* Certifications */}
      {(hasCertifications || isStreaming) && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Certifications</h3>
            {isStreaming && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {hasCertifications ? (
            <div className="space-y-2 ml-7">
              {data.certifications.map((cert, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{cert.name}</span>
                    {cert.issuer && (
                      <span className="text-muted-foreground"> - {cert.issuer}</span>
                    )}
                  </div>
                  {cert.year && (
                    <span className="text-xs text-muted-foreground">{cert.year}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground ml-7 italic">
              {isStreaming ? "Extracting certifications..." : "No certifications listed"}
            </p>
          )}
        </div>
      )}

      {/* Languages */}
      {(hasLanguages || isStreaming) && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Languages</h3>
            {isStreaming && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {hasLanguages ? (
            <div className="flex flex-wrap gap-2 ml-7">
              {data.languages.map((lang, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-green-500/10 text-green-600 rounded-md text-sm"
                >
                  {lang.name}
                  <span className="text-xs text-green-500/70 ml-1">
                    ({lang.proficiency})
                  </span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground ml-7 italic">
              {isStreaming ? "Extracting languages..." : "No languages listed"}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export const ResumeViewer = () => {
  const activeParsing = useAtomValue(activeParsingAtom);
  const parsingPhase = useAtomValue(parsingPhaseAtom);
  const selectedId = useAtomValue(selectedResumeIdAtom);
  const resumeListResult = useAtomValue(resumeListAtom);
  const localResumes = useAtomValue(localResumesAtom);

  // Find selected resume from list or local cache
  const selectedResume = (() => {
    if (selectedId === null) return null;

    // Check local cache first (for newly parsed resumes)
    const fromLocal = Arr.findFirst(localResumes, (r) => r.id === selectedId);
    if (Option.isSome(fromLocal)) return fromLocal.value;

    // Check server list
    if (resumeListResult._tag === "Success") {
      const fromList = Arr.findFirst(resumeListResult.value, (r) => r.id === selectedId);
      if (Option.isSome(fromList)) return fromList.value;
    }

    return null;
  })();

  // Show error state (always visible regardless of selection)
  if (parsingPhase._tag === "Error") {
    return (
      <Banner variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <Banner.Title>Parsing Failed</Banner.Title>
        <Banner.Description>{parsingPhase.message}</Banner.Description>
      </Banner>
    );
  }

  // If user has selected a resume, show it (allows viewing other resumes while parsing)
  if (selectedResume !== null) {
    return <ResumeContent data={selectedResume.data} />;
  }

  // If no selection but parsing is active, show parsing content
  if (activeParsing !== null) {
    if (parsingPhase._tag === "Parsing") {
      return (
        <div className="space-y-4">
          <Banner variant="default">
            <Banner.Title className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Parsing {activeParsing.fileName}...
            </Banner.Title>
          </Banner>
          <ResumeContent data={parsingPhase.partial} isStreaming />
        </div>
      );
    }

    if (parsingPhase._tag === "Complete") {
      return <ResumeContent data={parsingPhase.analysis.data} />;
    }
  }

  // Empty state handled by parent
  return null;
};
