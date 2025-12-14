import { useAtom } from "@effect-atom/atom-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import {
  selectedPositionAtom,
  selectedCompanyAtom,
  POSITION_TYPES,
  COMPANY_PROFILES,
  type PositionType,
  type CompanyProfile,
} from "../resume-atoms";

const POSITION_LABELS: Record<PositionType, string> = {
  FRONTEND: "Frontend",
  BACKEND: "Backend",
  FULLSTACK: "Full Stack",
  DEVOPS: "DevOps",
  TECH_LEAD: "Tech Lead",
};

const COMPANY_LABELS: Record<CompanyProfile, string> = {
  STARTUP_EARLY: "Startup",
  SCALEUP: "Scale-up",
  ENTERPRISE: "Enterprise",
  CONSULTORIA: "Consultoria",
};

export const ContextFilters = () => {
  const [position, setPosition] = useAtom(selectedPositionAtom);
  const [company, setCompany] = useAtom(selectedCompanyAtom);

  return (
    <div className="space-y-4 mb-6 p-4 bg-muted/30 rounded-lg border">
      {/* Position Type Selector */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Position Type
        </label>
        <div className="flex flex-wrap gap-1">
          {POSITION_TYPES.map((p) => (
            <Button
              key={p}
              variant={position === p ? "default" : "outline"}
              size="sm"
              onClick={() => setPosition(p)}
              className={cn("text-xs h-7")}
            >
              {POSITION_LABELS[p]}
            </Button>
          ))}
        </div>
      </div>

      {/* Company Profile Selector */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Company Profile
        </label>
        <div className="flex flex-wrap gap-1">
          {COMPANY_PROFILES.map((c) => (
            <Button
              key={c}
              variant={company === c ? "secondary" : "outline"}
              size="sm"
              onClick={() => setCompany(c)}
              className={cn("text-xs h-7")}
            >
              {COMPANY_LABELS[c]}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
