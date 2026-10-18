import type { CandidateProfile, ClaimCheck, FitAssessment } from '@copilot/shared';

export interface JobForLlm {
  title: string;
  company: string;
  location: string;
  remote: boolean;
  description: string;
}

export interface LlmUsage {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
}

export interface LlmResult<T> {
  value: T;
  usage: LlmUsage;
}

/**
 * Everything the app asks a model to do. Two implementations: Claude for real use,
 * and a deterministic fake for tests, offline development and demo accounts.
 */
export interface LlmProvider {
  extractProfile(pdf: Buffer): Promise<LlmResult<CandidateProfile>>;
  assessFit(profile: CandidateProfile, job: JobForLlm): Promise<LlmResult<FitAssessment>>;
  draftCoverLetter(
    profile: CandidateProfile,
    job: JobForLlm,
    fit: FitAssessment | null,
    /** Claims a previous draft made that the profile doesn't support; the new draft must drop or fix them. */
    rejectedClaims: string[],
  ): Promise<LlmResult<string>>;
  checkClaims(profile: CandidateProfile, coverLetter: string): Promise<LlmResult<ClaimCheck>>;
}

/** The model declined or returned something unusable. Not worth retrying with the same input. */
export class LlmOutputError extends Error {}
