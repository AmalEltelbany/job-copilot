import type { ClaimCheck } from '@copilot/shared';
import { SAMPLE_PROFILE } from '../demo/fixtures.js';
import type { LlmProvider, LlmResult } from '../llm/llm.types.js';
import { draftWithVerification } from './drafting.js';

const usage = { model: 'stub', inputTokens: 0, outputTokens: 0, cacheReadTokens: 0 };
const job = { title: 'Backend Engineer', company: 'Acme', location: 'Cairo', remote: false, description: 'Kafka, Go' };

/** A provider whose drafts and fact-checks follow a script, to drive the loop deterministically. */
function scripted(drafts: string[], checks: ClaimCheck[]) {
  const seenRejections: string[][] = [];
  const provider = {
    draftCoverLetter: async (_p, _j, _f, rejected) => {
      seenRejections.push(rejected);
      return { value: drafts.shift()!, usage };
    },
    checkClaims: async () => ({ value: checks.shift()!, usage }),
  } as Pick<LlmProvider, 'draftCoverLetter' | 'checkClaims'> as LlmProvider;
  const run = <T>(_: string, call: (p: LlmProvider) => Promise<LlmResult<T>>) => call(provider).then((r) => r.value);
  return { run, seenRejections };
}

const ok = (claim: string) => ({ claim, supported: true, evidence: 'profile' });
const invented = (claim: string) => ({ claim, supported: false, evidence: 'not in profile' });

describe('draftWithVerification', () => {
  it('returns the first draft when every claim checks out', async () => {
    const { run } = scripted(['Letter A'], [{ claims: [ok('3 years of NestJS')] }]);
    const outcome = await draftWithVerification(run, SAMPLE_PROFILE, job, null);
    expect(outcome).toEqual({ coverLetter: 'Letter A', unsupportedClaims: [], attempts: 1 });
  });

  it('rewrites once, telling the model which claims were invented', async () => {
    const { run, seenRejections } = scripted(
      ['Letter with Kafka', 'Honest letter'],
      [{ claims: [ok('NestJS'), invented('5 years of Kafka')] }, { claims: [ok('NestJS')] }],
    );
    const outcome = await draftWithVerification(run, SAMPLE_PROFILE, job, null);
    expect(outcome).toMatchObject({ coverLetter: 'Honest letter', unsupportedClaims: [], attempts: 2 });
    expect(seenRejections).toEqual([[], ['5 years of Kafka']]);
  });

  it('stops after two attempts and surfaces what is still unsupported', async () => {
    const { run } = scripted(
      ['Bad 1', 'Bad 2'],
      [{ claims: [invented('Led a team of 10')] }, { claims: [invented('Led a team of 8')] }],
    );
    const outcome = await draftWithVerification(run, SAMPLE_PROFILE, job, null);
    expect(outcome.attempts).toBe(2);
    expect(outcome.coverLetter).toBe('Bad 2');
    expect(outcome.unsupportedClaims.map((c) => c.claim)).toEqual(['Led a team of 8']);
  });
});
