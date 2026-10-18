/**
 * Runs the fit and fact-check prompts against real Claude and scores them against cases.ts.
 * Costs real money (a few cents per run): pnpm --filter api eval   (needs ANTHROPIC_API_KEY)
 */
import 'dotenv/config';
import { Anthropic } from '@anthropic-ai/sdk';
import { SAMPLE_PROFILE } from '../src/demo/fixtures.js';
import { ClaudeProvider } from '../src/llm/claude.provider.js';
import type { LlmUsage } from '../src/llm/llm.types.js';
import { claimCases, fitCases } from './cases.js';

const model = process.env.CLAUDE_MODEL ?? 'claude-opus-5-5';
const provider = new ClaudeProvider(new Anthropic(), model);
const usage: LlmUsage[] = [];
let failures = 0;

console.log(`Model: ${model}\n\nFit assessment`);
for (const testCase of fitCases) {
  const { value, usage: u } = await provider.assessFit(SAMPLE_PROFILE, testCase.job);
  usage.push(u);
  const pass = testCase.accept.includes(value.verdict);
  if (!pass) failures++;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${testCase.name}: ${value.verdict} (${value.score}), expected ${testCase.accept.join('/')}`);
}

console.log('\nFact-checking');
for (const testCase of claimCases) {
  const { value, usage: u } = await provider.checkClaims(SAMPLE_PROFILE, testCase.letter);
  usage.push(u);
  const flagged = value.claims.filter((c) => !c.supported).map((c) => c.claim.toLowerCase());
  const missed = testCase.mustFlag.filter((needle) => !flagged.some((claim) => claim.includes(needle.toLowerCase())));
  const falseAlarm = testCase.mustFlag.length === 0 && flagged.length > 0;
  const pass = missed.length === 0 && !falseAlarm;
  if (!pass) failures++;
  console.log(
    `${pass ? 'PASS' : 'FAIL'}  ${testCase.name}` +
      (missed.length ? ` (missed: ${missed.join(', ')})` : '') +
      (falseAlarm ? ` (false alarm: ${flagged.join('; ')})` : ''),
  );
}

const total = (key: keyof LlmUsage) => usage.reduce((sum, u) => sum + (u[key] as number), 0);
console.log(
  `\n${fitCases.length + claimCases.length - failures}/${fitCases.length + claimCases.length} passed. ` +
    `Tokens: ${total('inputTokens')} in (${total('cacheReadTokens')} from cache), ${total('outputTokens')} out.`,
);
process.exit(failures === 0 ? 0 : 1);
