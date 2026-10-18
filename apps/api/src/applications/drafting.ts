import type { CandidateProfile, ClaimCheck, FitAssessment } from '@copilot/shared';
import type { JobForLlm, LlmProvider, LlmResult } from '../llm/llm.types.js';

export const MAX_DRAFT_ATTEMPTS = 2;

export interface DraftOutcome {
  coverLetter: string;
  unsupportedClaims: ClaimCheck['claims'];
  attempts: number;
}

/**
 * Evaluator-optimizer loop: write a letter, have a separate call fact-check every claim against the profile,
 * and if anything is unsupported, rewrite once with those claims called out. Whatever is still unsupported
 * after that is shown to the user instead of being silently sent.
 */
export async function draftWithVerification(
  run: <T>(purpose: 'draft-letter' | 'check-claims', call: (p: LlmProvider) => Promise<LlmResult<T>>) => Promise<T>,
  profile: CandidateProfile,
  job: JobForLlm,
  fit: FitAssessment | null,
): Promise<DraftOutcome> {
  let rejected: string[] = [];
  let letter = '';
  let unsupported: ClaimCheck['claims'] = [];

  for (let attempt = 1; attempt <= MAX_DRAFT_ATTEMPTS; attempt++) {
    letter = await run('draft-letter', (p) => p.draftCoverLetter(profile, job, fit, rejected));
    const check = await run('check-claims', (p) => p.checkClaims(profile, letter));
    unsupported = check.claims.filter((c) => !c.supported);
    if (unsupported.length === 0) return { coverLetter: letter, unsupportedClaims: [], attempts: attempt };
    rejected = [...rejected, ...unsupported.map((c) => c.claim)];
  }
  return { coverLetter: letter, unsupportedClaims: unsupported, attempts: MAX_DRAFT_ATTEMPTS };
}
