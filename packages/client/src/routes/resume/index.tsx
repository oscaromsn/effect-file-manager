import { useAtomValue } from "@effect-atom/atom-react";
import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import * as Arr from "effect/Array";
import * as Option from "effect/Option";
import {
  activeParsingAtom,
  parsingPhaseAtom,
  selectedResumeIdAtom,
  resumeListAtom,
  localResumesAtom,
} from "./-resume/resume-atoms";
import { ResumeViewer } from "./-resume/components/resume-viewer";
import { ScorePanel } from "./-resume/components/score-panel";

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center h-full text-center p-8">
    <FileText className="h-16 w-16 text-muted-foreground mb-4" />
    <h3 className="text-lg font-medium">No Resume Selected</h3>
    <p className="text-sm text-muted-foreground mt-1">
      Upload a PDF resume or select one from history to view details.
    </p>
  </div>
);

const ResumePage = () => {
  const activeParsing = useAtomValue(activeParsingAtom);
  const parsingPhase = useAtomValue(parsingPhaseAtom);
  const selectedId = useAtomValue(selectedResumeIdAtom);
  const resumeListResult = useAtomValue(resumeListAtom);
  const localResumes = useAtomValue(localResumesAtom);

  // Compute selectedResume from ID
  const selectedResume = (() => {
    if (selectedId === null) return null;
    const fromLocal = Arr.findFirst(localResumes, (r) => r.id === selectedId);
    if (Option.isSome(fromLocal)) return fromLocal.value;
    if (resumeListResult._tag === "Success") {
      const fromList = Arr.findFirst(resumeListResult.value, (r) => r.id === selectedId);
      if (Option.isSome(fromList)) return fromList.value;
    }
    return null;
  })();

  const hasContent = activeParsing !== null || selectedResume !== null;

  if (!hasContent && parsingPhase._tag === "Idle") {
    return <EmptyState />;
  }

  return (
    <div className="flex h-full">
      {/* Center Pane - Resume Content */}
      <div className="flex-1 border-r overflow-y-auto p-6">
        <ResumeViewer />
      </div>

      {/* Right Pane - Score */}
      <div className="w-64 p-6">
        <ScorePanel />
      </div>
    </div>
  );
};

export const Route = createFileRoute("/resume/")({
  component: ResumePage,
});
