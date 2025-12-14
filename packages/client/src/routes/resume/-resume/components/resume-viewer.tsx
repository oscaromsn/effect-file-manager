import { useAtomValue } from "@effect-atom/atom-react";
import { AlertCircle, Briefcase, Loader2, Mail, Sparkles, User } from "lucide-react";
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
import type { ResumeData } from "@example/domain/api/resume/resume-rpc";

type ResumeContentProps = {
  data: PartialResumeData | ResumeData;
  isStreaming?: boolean;
};

const ResumeContent = ({ data, isStreaming }: ResumeContentProps) => {
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

        {data.email && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>{data.email}</span>
          </div>
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
          <ul className="space-y-2 ml-7">
            {data.experience.map((exp, idx) => (
              <li key={idx} className="text-sm border-l-2 border-primary/30 pl-3 py-1">
                {exp}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground ml-7 italic">
            {isStreaming ? "Extracting experience..." : "No experience listed"}
          </p>
        )}
      </div>

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
              >
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground ml-7 italic">
            {isStreaming ? "Extracting skills..." : "No skills listed"}
          </p>
        )}
      </div>
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
