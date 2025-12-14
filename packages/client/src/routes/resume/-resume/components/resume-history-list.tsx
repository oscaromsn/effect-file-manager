import { useAtomSet, useAtomValue } from "@effect-atom/atom-react";
import { Result } from "@effect-atom/atom-react";
import { FileText, Loader2 } from "lucide-react";
import * as Arr from "effect/Array";
import {
  resumeListAtom,
  localResumesAtom,
  selectedResumeIdAtom,
  selectResumeAtom,
  clearSelectionAtom,
  activeParsingAtom,
  selectedPositionAtom,
  selectedCompanyAtom,
  getScoreTierColor,
  type ResumeAnalysis,
  type PositionType,
  type CompanyProfile,
} from "../resume-atoms";
import { cn } from "@/lib/cn";

type ResumeItemProps = {
  resume: ResumeAnalysis;
  isSelected: boolean;
  onSelect: () => void;
  position: PositionType;
  company: CompanyProfile;
};

const ResumeItem = ({ resume, isSelected, onSelect, position, company }: ResumeItemProps) => {
  const contextScore = resume.data.scoringMatrix[position][company].score;

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left p-3 rounded-lg border transition-colors",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate text-sm">{resume.data.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {resume.fileName}
          </p>
        </div>
        <span className={cn("text-sm font-semibold", getScoreTierColor(contextScore))}>
          {contextScore}
        </span>
      </div>
    </button>
  );
};

type ParsingItemProps = {
  fileName: string;
  isViewing: boolean;
  onSelect: () => void;
};

const ParsingItem = ({ fileName, isViewing, onSelect }: ParsingItemProps) => (
  <button
    onClick={onSelect}
    className={cn(
      "w-full text-left p-3 rounded-lg border transition-colors",
      isViewing
        ? "border-primary bg-primary/10"
        : "border-primary/50 bg-primary/5 hover:border-primary",
    )}
  >
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0 flex-1">
        <p className="font-medium truncate text-sm italic text-muted-foreground">
          Parsing...
        </p>
        <p className="text-xs text-muted-foreground truncate">{fileName}</p>
      </div>
      <Loader2 className="h-4 w-4 animate-spin text-primary" />
    </div>
  </button>
);

export const ResumeHistoryList = () => {
  const resumeListResult = useAtomValue(resumeListAtom);
  const localResumes = useAtomValue(localResumesAtom);
  const selectedId = useAtomValue(selectedResumeIdAtom);
  const activeParsing = useAtomValue(activeParsingAtom);
  const position = useAtomValue(selectedPositionAtom);
  const company = useAtomValue(selectedCompanyAtom);
  const selectResume = useAtomSet(selectResumeAtom);
  const clearSelection = useAtomSet(clearSelectionAtom);

  // When no resume is selected, the viewer shows parsing content
  const isViewingParsing = selectedId === null && activeParsing !== null;

  return Result.builder(resumeListResult)
    .onSuccess((serverResumes) => {
      // Merge local and server resumes, removing duplicates
      // Local resumes take precedence (they're more recent)
      const serverIds = new Set(serverResumes.map((r) => r.id));
      const uniqueLocalResumes = Arr.filter(
        localResumes,
        (r) => !serverIds.has(r.id),
      );
      const allResumes = [...uniqueLocalResumes, ...serverResumes];

      const hasContent = allResumes.length > 0 || activeParsing !== null;

      if (!hasContent) {
        return (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No resumes yet</p>
          </div>
        );
      }

      return (
        <div className="space-y-2">
          {/* Show active parsing at the top */}
          {activeParsing !== null && (
            <ParsingItem
              fileName={activeParsing.fileName}
              isViewing={isViewingParsing}
              onSelect={() => clearSelection()}
            />
          )}

          {/* Show all resumes */}
          {allResumes.map((resume) => {
            const isSelected = selectedId === resume.id;
            return (
              <ResumeItem
                key={resume.id}
                resume={resume}
                isSelected={isSelected}
                onSelect={() => selectResume(resume.id)}
                position={position}
                company={company}
              />
            );
          })}
        </div>
      );
    })
    .onWaiting(() => (
      <div className="space-y-2">
        {/* Still show active parsing and local resumes while loading server data */}
        {activeParsing !== null && (
          <ParsingItem
            fileName={activeParsing.fileName}
            isViewing={isViewingParsing}
            onSelect={() => clearSelection()}
          />
        )}
        {localResumes.length > 0 ? (
          localResumes.map((resume) => (
            <ResumeItem
              key={resume.id}
              resume={resume}
              isSelected={selectedId === resume.id}
              onSelect={() => selectResume(resume.id)}
              position={position}
              company={company}
            />
          ))
        ) : (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    ))
    .onFailure(() => (
      <div className="text-center py-8 text-destructive">
        <p className="text-sm">Failed to load resumes</p>
      </div>
    ))
    .orNull();
};
