import { z } from "zod";
import type { ApplicationDto } from "./applications.js";

export const sourceKinds = ["GREENHOUSE", "LEVER", "ASHBY", "REMOTIVE"] as const;
export const sourceKindSchema = z.enum(sourceKinds);
export type SourceKind = z.infer<typeof sourceKindSchema>;

export const createSourceSchema = z.object({
  kind: sourceKindSchema,
  /** Board token / company slug, e.g. "vercel" for boards.greenhouse.io/vercel. Remotive uses a category. */
  identifier: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-zA-Z0-9._-]+$/, "Only letters, numbers, dots, dashes and underscores"),
  label: z.string().trim().min(1).max(80),
});
export type CreateSourceInput = z.infer<typeof createSourceSchema>;

export interface SourceDto {
  id: string;
  kind: SourceKind;
  identifier: string;
  label: string;
  lastSyncedAt: string | null;
  lastError: string | null;
  jobCount: number;
}

export const verdicts = ["STRONG", "GOOD", "STRETCH", "SKIP"] as const;
export const verdictSchema = z.enum(verdicts);
export type Verdict = z.infer<typeof verdictSchema>;

/** What the model returns when scoring a job. Score and verdict are derived from the checklist, not guessed. */
export const fitAssessmentSchema = z.object({
  roleSeniority: z.enum(["junior", "mid", "senior", "lead", "unclear"]),
  requirements: z
    .array(
      z.object({
        requirement: z.string().max(200),
        mustHave: z.boolean(),
        met: z.enum(["yes", "partly", "no"]),
        evidence: z.string().max(300).describe("Quote or fact from the profile, or empty if not met"),
      }),
    )
    .max(15),
  score: z.number().int().min(0).max(100),
  verdict: verdictSchema,
  summary: z.string().max(600).describe("Two or three sentences a recruiter would agree with"),
});
export type FitAssessment = z.infer<typeof fitAssessmentSchema>;

export interface MatchDto {
  score: number;
  verdict: Verdict;
  summary: string;
  roleSeniority: FitAssessment["roleSeniority"];
  requirements: FitAssessment["requirements"];
  profileVersion: number;
  createdAt: string;
}

export const applicationStatuses = ["SAVED", "DRAFTED", "APPLIED", "INTERVIEWING", "OFFER", "REJECTED"] as const;
export const applicationStatusSchema = z.enum(applicationStatuses);
export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;

export interface JobSummaryDto {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  url: string;
  postedAt: string | null;
  sourceKind: SourceKind;
  filteredOut: string | null;
  match: Pick<MatchDto, "score" | "verdict" | "summary"> | null;
  applicationStatus: ApplicationStatus | null;
}

export interface JobDetailDto extends Omit<JobSummaryDto, "match"> {
  description: string;
  applyUrl: string;
  match: MatchDto | null;
  application: ApplicationDto | null;
}

export const jobListQuerySchema = z.object({
  verdict: verdictSchema.optional(),
  // Query strings are text: "false" must mean false (z.coerce.boolean would turn it into true).
  includeFiltered: z.enum(["true", "false"]).default("false").transform((v) => v === "true"),
  q: z.string().trim().max(80).optional(),
});
export type JobListQuery = z.infer<typeof jobListQuerySchema>;
