import { useAtomValue } from "@effect-atom/atom-react";
import { AlertTriangle, Award, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import * as Arr from "effect/Array";
import * as Option from "effect/Option";
import {
  activeParsingAtom,
  parsingPhaseAtom,
  selectedResumeIdAtom,
  resumeListAtom,
  localResumesAtom,
  selectedPositionAtom,
  selectedCompanyAtom,
  getScoreTierColor,
  getScoreTierLabel,
} from "../resume-atoms";
import { ContextFilters } from "./context-filters";

const DEALBREAKER_LABELS: Record<string, string> = {
  missing_certification: "Missing required certifications",
  no_leadership_experience: "No leadership experience detected",
  outdated_tech_stack: "Technology stack appears outdated",
  insufficient_experience: "Insufficient years of experience",
};

const formatDealbreaker = (key: string): string => {
  return DEALBREAKER_LABELS[key] ?? key.replace(/_/g, " ");
};

const ScoreDisplay = ({
  score,
  dealbreakers,
}: {
  score: number;
  dealbreakers: readonly string[];
}) => {
  const tierColor = getScoreTierColor(score);
  const tierLabel = getScoreTierLabel(score);

  return (
    <div className="space-y-4">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-secondary">
          <span className={cn("text-4xl font-bold", tierColor)}>{score}</span>
        </div>

        <div className="space-y-1">
          <p className={cn("text-lg font-semibold", tierColor)}>{tierLabel}</p>
          <p className="text-xs text-muted-foreground">
            Score based on selected context
          </p>
        </div>

        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Score Tiers</h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Needs Development ({"<"}500)</span>
              <span className="text-red-600">Low</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Potential Match (500-799)</span>
              <span className="text-yellow-600">Medium</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Strong Match (800+)</span>
              <span className="text-green-600">High</span>
            </div>
          </div>
        </div>
      </div>

      {dealbreakers.length > 0 && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <h4 className="text-sm font-semibold text-destructive flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4" />
            Dealbreakers
          </h4>
          <ul className="list-disc list-inside text-xs text-destructive/80 space-y-1">
            {dealbreakers.map((d) => (
              <li key={d}>{formatDealbreaker(d)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export const ScorePanel = () => {
  const activeParsing = useAtomValue(activeParsingAtom);
  const parsingPhase = useAtomValue(parsingPhaseAtom);
  const selectedId = useAtomValue(selectedResumeIdAtom);
  const resumeListResult = useAtomValue(resumeListAtom);
  const localResumes = useAtomValue(localResumesAtom);
  const position = useAtomValue(selectedPositionAtom);
  const company = useAtomValue(selectedCompanyAtom);

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
      <div>
        <ContextFilters />
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-secondary">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Calculating score...</p>
        </div>
      </div>
    );
  }

  // Show parsed result score
  if (parsingPhase._tag === "Complete") {
    const contextData = parsingPhase.analysis.data.scoringMatrix[position][company];
    return (
      <div>
        <ContextFilters />
        <ScoreDisplay score={contextData.score} dealbreakers={contextData.dealbreakers} />
      </div>
    );
  }

  // Show selected resume score
  if (selectedResume !== null) {
    const contextData = selectedResume.data.scoringMatrix[position][company];
    return (
      <div>
        <ContextFilters />
        <ScoreDisplay score={contextData.score} dealbreakers={contextData.dealbreakers} />
      </div>
    );
  }

  // Empty state
  return (
    <div>
      <ContextFilters />
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-secondary">
          <Award className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          Select a resume to see the score
        </p>
      </div>
    </div>
  );
};
