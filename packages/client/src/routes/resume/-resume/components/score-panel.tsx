import { useAtomValue } from "@effect-atom/atom-react";
import { Award, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import * as Arr from "effect/Array";
import * as Option from "effect/Option";
import {
  activeParsingAtom,
  parsingPhaseAtom,
  selectedResumeIdAtom,
  resumeListAtom,
  localResumesAtom,
  getScoreTierColor,
  getScoreTierLabel,
} from "../resume-atoms";

const ScoreDisplay = ({ score }: { score: number }) => {
  const tierColor = getScoreTierColor(score);
  const tierLabel = getScoreTierLabel(score);

  return (
    <div className="text-center space-y-4">
      <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-secondary">
        <span className={cn("text-4xl font-bold", tierColor)}>{score}</span>
      </div>

      <div className="space-y-1">
        <p className={cn("text-lg font-semibold", tierColor)}>{tierLabel}</p>
        <p className="text-xs text-muted-foreground">
          Based on {score >= 1000 ? "7+" : score >= 800 ? "3-6" : "< 3"} work experiences
        </p>
      </div>

      <div className="pt-4 border-t">
        <h4 className="text-sm font-medium mb-2">Score Breakdown</h4>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Entry Level ({"<"}3 exp)</span>
            <span className="text-red-600">300</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Experienced (3-6 exp)</span>
            <span className="text-yellow-600">800</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Expert (7+ exp)</span>
            <span className="text-green-600">1000</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ScorePanel = () => {
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

  // Show loading state during parsing
  if (activeParsing !== null && parsingPhase._tag !== "Complete") {
    return (
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-secondary">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">Calculating score...</p>
      </div>
    );
  }

  // Show parsed result score
  if (parsingPhase._tag === "Complete") {
    return <ScoreDisplay score={parsingPhase.analysis.score} />;
  }

  // Show selected resume score
  if (selectedResume !== null) {
    return <ScoreDisplay score={selectedResume.score} />;
  }

  // Empty state
  return (
    <div className="text-center space-y-4">
      <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-secondary">
        <Award className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">
        Select a resume to see the score
      </p>
    </div>
  );
};
