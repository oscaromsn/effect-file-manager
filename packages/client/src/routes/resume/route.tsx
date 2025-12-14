import { Button } from "@/components/ui/button";
import { useAtomSet, useAtomValue } from "@effect-atom/atom-react";
import { Outlet, createFileRoute } from "@tanstack/react-router";
import { FileUp, Loader2 } from "lucide-react";
import {
  activeParsingAtom,
  resumeListAtom,
  uploadPhaseAtom,
  uploadAndParseAtom,
} from "./-resume/resume-atoms";
import { ResumeHistoryList } from "./-resume/components/resume-history-list";

const ResumeLoadingBar = () => {
  return <div className="h-1 bg-primary rounded-full w-full animate-pulse" />;
};

const ResumeLayoutRoute = () => {
  const resumeListResult = useAtomValue(resumeListAtom);
  const activeParsing = useAtomValue(activeParsingAtom);
  const uploadPhase = useAtomValue(uploadPhaseAtom);
  const uploadAndParse = useAtomSet(uploadAndParseAtom);

  const isUploading = uploadPhase._tag === "Uploading" || uploadPhase._tag === "Syncing";
  const isDisabled = activeParsing !== null || isUploading;

  const handleUploadClick = () => {
    uploadAndParse(undefined);
  };

  const getButtonContent = () => {
    if (uploadPhase._tag === "Uploading") {
      return (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Uploading {uploadPhase.fileName}...
        </>
      );
    }
    if (uploadPhase._tag === "Syncing") {
      return (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Processing...
        </>
      );
    }
    if (activeParsing !== null) {
      return (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Parsing {activeParsing.fileName}...
        </>
      );
    }
    return (
      <>
        <FileUp className="h-4 w-4 mr-2" />
        Upload Resume PDF
      </>
    );
  };

  return (
    <div className="flex h-full">
      {/* Left Pane - Upload & History */}
      <div className="w-80 border-r flex flex-col p-4 gap-4">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Resume Parser</h2>
          <p className="text-xs text-muted-foreground">
            Upload PDF resumes to extract and score candidate data.
          </p>
        </div>

        <div>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleUploadClick}
            disabled={isDisabled}
          >
            {getButtonContent()}
          </Button>
          <p className="text-xs text-muted-foreground mt-1 text-center">
            Max 10 resumes total
          </p>
          {uploadPhase._tag === "Error" && (
            <p className="text-xs text-destructive mt-1 text-center">
              {uploadPhase.message}
            </p>
          )}
        </div>

        <div className="h-1">
          {resumeListResult.waiting ? <ResumeLoadingBar /> : null}
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          <h3 className="text-sm font-medium mb-2">History</h3>
          <ResumeHistoryList />
        </div>
      </div>

      {/* Center + Right Panes */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
};

export const Route = createFileRoute("/resume")({
  component: ResumeLayoutRoute,
});
