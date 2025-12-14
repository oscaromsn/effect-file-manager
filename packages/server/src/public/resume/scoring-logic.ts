import type { Resume as BamlResume } from "@/baml_client/types";
import { EducationLevel, EducationStatus } from "@/baml_client/types";
import {
  type PositionType,
  type CompanyProfile,
  type ScoringMatrix,
  type ContextScore,
  POSITION_TYPES,
  COMPANY_PROFILES,
} from "@example/domain/api/resume/resume-rpc";

// --- Dimension Weights Configuration ---

export interface DimensionWeights {
  readonly yearsExperience: number;
  readonly educationLevel: number;
  readonly skillMatch: number;
  readonly techRecency: number;
  readonly leadershipSignals: number;
  readonly certifications: number;
}

const BASE_WEIGHTS: DimensionWeights = {
  yearsExperience: 1.0,
  educationLevel: 1.0,
  skillMatch: 1.0,
  techRecency: 1.0,
  leadershipSignals: 1.0,
  certifications: 1.0,
};

export const POSITION_WEIGHTS: Record<PositionType, Partial<DimensionWeights>> = {
  FRONTEND: { skillMatch: 1.4, techRecency: 1.3, leadershipSignals: 0.7 },
  BACKEND: { skillMatch: 1.3, yearsExperience: 1.2, certifications: 1.1 },
  FULLSTACK: { skillMatch: 1.2, techRecency: 1.2, yearsExperience: 1.1 },
  DEVOPS: { certifications: 1.5, techRecency: 1.4, skillMatch: 1.2 },
  TECH_LEAD: { leadershipSignals: 2.0, yearsExperience: 1.5, skillMatch: 0.9 },
};

export const COMPANY_WEIGHTS: Record<CompanyProfile, Partial<DimensionWeights>> = {
  STARTUP_EARLY: { yearsExperience: 0.7, educationLevel: 0.5, techRecency: 1.3 },
  SCALEUP: { techRecency: 1.4, skillMatch: 1.3, leadershipSignals: 1.1 },
  ENTERPRISE: { educationLevel: 1.3, certifications: 1.5, yearsExperience: 1.2 },
  CONSULTORIA: { leadershipSignals: 1.2, skillMatch: 1.1, educationLevel: 1.1 },
};

// --- Raw Dimensions Interface ---

export interface RawDimensions {
  readonly yearsExperience: number; // 0-1 normalized (15 years = 1.0)
  readonly educationLevel: number; // 0-1 normalized
  readonly skillMatch: number; // 0-1 normalized (20 skills = 1.0)
  readonly techRecency: number; // 0-1 normalized
  readonly leadershipSignals: number; // 0 or 1
  readonly certifications: number; // 0-1 normalized (5 certs = 1.0)
}

// --- Education Level Rankings ---

const EDUCATION_RANK: Record<EducationLevel, number> = {
  [EducationLevel.ENSINO_MEDIO]: 0.3,
  [EducationLevel.TECNOLOGO]: 0.5,
  [EducationLevel.GRADUACAO]: 0.7,
  [EducationLevel.POS_GRADUACAO]: 0.8,
  [EducationLevel.MESTRADO]: 0.9,
  [EducationLevel.DOUTORADO]: 1.0,
};

// --- Leadership Title Keywords ---

const LEADERSHIP_TITLES = [
  "lead",
  "senior",
  "principal",
  "manager",
  "head",
  "director",
  "chief",
  "vp",
  "cto",
  "ceo",
  "architect",
];

// --- Core Functions ---

/**
 * Extracts and normalizes dimensions from a parsed resume.
 * All dimensions are normalized to 0-1 range.
 */
export const extractDimensions = (resume: BamlResume): RawDimensions => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Calculate total months of experience
  const totalMonths = resume.experiences.reduce((acc, exp) => {
    if (!exp.start_year) return acc;

    const startYear = exp.start_year;
    const startMonth = exp.start_month ?? 1;

    let endYear: number;
    let endMonth: number;

    if (exp.is_current) {
      endYear = currentYear;
      endMonth = currentMonth;
    } else {
      endYear = exp.end_year ?? startYear;
      endMonth = exp.end_month ?? 12;
    }

    const months = (endYear - startYear) * 12 + (endMonth - startMonth);
    return acc + Math.max(0, months);
  }, 0);

  // Calculate highest education level (only completed)
  const maxEducation = resume.education.reduce((max, edu) => {
    if (edu.status !== EducationStatus.COMPLETO) return max;
    return Math.max(max, EDUCATION_RANK[edu.level] ?? 0);
  }, 0);

  // Count recent technologies (from experiences in last 2 years)
  const recentTechCount = resume.experiences
    .filter((exp) => exp.is_current || (exp.end_year && exp.end_year >= currentYear - 2))
    .flatMap((exp) => exp.technologies).length;

  // Detect leadership signals from titles
  const hasLeadership = resume.experiences.some((exp) =>
    LEADERSHIP_TITLES.some((title) => exp.title.toLowerCase().includes(title))
  );

  return {
    yearsExperience: Math.min(totalMonths / 12 / 15, 1), // 15 years = max
    educationLevel: maxEducation,
    skillMatch: Math.min(resume.skills.length / 20, 1), // 20 skills = max
    techRecency: Math.min(recentTechCount / 10, 1), // 10 recent techs = max
    leadershipSignals: hasLeadership ? 1 : 0,
    certifications: Math.min(resume.certifications.length / 5, 1), // 5 certs = max
  };
};

/**
 * Resolves the final weights by combining base, position, and company weights.
 */
export const resolveWeights = (
  position: PositionType,
  company: CompanyProfile
): DimensionWeights => ({
  yearsExperience:
    BASE_WEIGHTS.yearsExperience *
    (POSITION_WEIGHTS[position].yearsExperience ?? 1) *
    (COMPANY_WEIGHTS[company].yearsExperience ?? 1),
  educationLevel:
    BASE_WEIGHTS.educationLevel *
    (POSITION_WEIGHTS[position].educationLevel ?? 1) *
    (COMPANY_WEIGHTS[company].educationLevel ?? 1),
  skillMatch:
    BASE_WEIGHTS.skillMatch *
    (POSITION_WEIGHTS[position].skillMatch ?? 1) *
    (COMPANY_WEIGHTS[company].skillMatch ?? 1),
  techRecency:
    BASE_WEIGHTS.techRecency *
    (POSITION_WEIGHTS[position].techRecency ?? 1) *
    (COMPANY_WEIGHTS[company].techRecency ?? 1),
  leadershipSignals:
    BASE_WEIGHTS.leadershipSignals *
    (POSITION_WEIGHTS[position].leadershipSignals ?? 1) *
    (COMPANY_WEIGHTS[company].leadershipSignals ?? 1),
  certifications:
    BASE_WEIGHTS.certifications *
    (POSITION_WEIGHTS[position].certifications ?? 1) *
    (COMPANY_WEIGHTS[company].certifications ?? 1),
});

/**
 * Calculates the final score (0-1000) from dimensions and weights.
 */
export const calculateScore = (
  dimensions: RawDimensions,
  weights: DimensionWeights
): number => {
  const weighted =
    dimensions.yearsExperience * weights.yearsExperience +
    dimensions.educationLevel * weights.educationLevel +
    dimensions.skillMatch * weights.skillMatch +
    dimensions.techRecency * weights.techRecency +
    dimensions.leadershipSignals * weights.leadershipSignals +
    dimensions.certifications * weights.certifications;

  const totalWeight =
    weights.yearsExperience +
    weights.educationLevel +
    weights.skillMatch +
    weights.techRecency +
    weights.leadershipSignals +
    weights.certifications;

  const normalized = weighted / totalWeight;
  return Math.round(normalized * 1000);
};

/**
 * Detects dealbreakers based on context and dimensions.
 */
export const detectDealbreakers = (
  dimensions: RawDimensions,
  position: PositionType,
  company: CompanyProfile
): string[] => {
  const dealbreakers: string[] = [];

  // Enterprise companies typically require certifications
  if (company === "ENTERPRISE" && dimensions.certifications < 0.2) {
    dealbreakers.push("missing_certification");
  }

  // Tech Lead requires leadership experience
  if (position === "TECH_LEAD" && dimensions.leadershipSignals < 0.5) {
    dealbreakers.push("no_leadership_experience");
  }

  // Scale-ups need recent tech stack
  if (company === "SCALEUP" && dimensions.techRecency < 0.3) {
    dealbreakers.push("outdated_tech_stack");
  }

  // Non-entry positions need some experience
  if (position !== "TECH_LEAD" && dimensions.yearsExperience < 0.1) {
    dealbreakers.push("insufficient_experience");
  }

  return dealbreakers;
};

/**
 * Computes the complete scoring matrix for all position/company combinations.
 * Returns a 5x4 matrix of scores and dealbreakers.
 */
export const calculateMatrix = (resume: BamlResume): ScoringMatrix => {
  const dimensions = extractDimensions(resume);

  const matrix: Record<string, Record<string, ContextScore>> = {};

  for (const position of POSITION_TYPES) {
    matrix[position] = {};
    for (const company of COMPANY_PROFILES) {
      const weights = resolveWeights(position, company);
      const score = calculateScore(dimensions, weights);
      const dealbreakers = detectDealbreakers(dimensions, position, company);
      matrix[position][company] = { score, dealbreakers };
    }
  }

  return matrix as ScoringMatrix;
};

/**
 * Calculates a single "base" score using FULLSTACK + SCALEUP context.
 * Used for the ResumeAnalysis.score field.
 */
export const calculateBaseScore = (resume: BamlResume): number => {
  return calculateMatrix(resume).FULLSTACK.SCALEUP.score;
};
