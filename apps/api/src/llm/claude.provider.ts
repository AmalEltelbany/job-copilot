import { Anthropic } from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z, type ZodType } from 'zod';
import { candidateProfileSchema, claimCheckSchema, fitAssessmentSchema, type CandidateProfile } from '@copilot/shared';
import { LlmOutputError, type JobForLlm, type LlmProvider, type LlmResult } from './llm.types.js';
import {
  ASSESS_FIT_SYSTEM,
  CHECK_CLAIMS_SYSTEM,
  DRAFT_LETTER_SYSTEM,
  EXTRACT_PROFILE_SYSTEM,
  jobBlock,
  profileBlock,
} from './prompts.js';

type Effort = 'low' | 'medium' | 'high';

const coverLetterSchema = z.object({ coverLetter: z.string().max(4000) });

/**
 * Claude implementation. Every call uses structured outputs, so the response is validated
 * against the same Zod schema the rest of the app uses; nothing parses free text.
 */
export class ClaudeProvider implements LlmProvider {
  constructor(
    private readonly client: Anthropic,
    private readonly model: string,
  ) {}

  async extractProfile(pdf: Buffer): Promise<LlmResult<CandidateProfile>> {
    return this.structured({
      schema: candidateProfileSchema,
      effort: 'medium',
      system: [{ type: 'text', text: EXTRACT_PROFILE_SYSTEM }],
      content: [
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdf.toString('base64') } },
        { type: 'text', text: 'Extract the candidate profile from this CV.' },
      ],
    });
  }

  assessFit(profile: CandidateProfile, job: JobForLlm) {
    return this.structured({
      schema: fitAssessmentSchema,
      // Scoring is a screening judgment run once per job; low effort keeps it fast and cheap.
      effort: 'low',
      system: this.withProfile(ASSESS_FIT_SYSTEM, profile),
      content: [{ type: 'text', text: `${jobBlock(job)}\n\nAssess this job for the candidate.` }],
    });
  }

  async draftCoverLetter(profile: CandidateProfile, job: JobForLlm, fit: Parameters<LlmProvider['draftCoverLetter']>[2], rejectedClaims: string[]) {
    const guidance = [
      fit ? `Screening notes for this job: ${fit.summary}` : '',
      rejectedClaims.length
        ? `A previous draft made these claims, which the profile does not support. Do not repeat them:\n${rejectedClaims.map((c) => `- ${c}`).join('\n')}`
        : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    const result = await this.structured({
      schema: coverLetterSchema,
      effort: 'medium',
      system: this.withProfile(DRAFT_LETTER_SYSTEM, profile),
      content: [{ type: 'text', text: `${jobBlock(job)}\n\n${guidance}\n\nWrite the cover letter.`.trim() }],
    });
    return { value: result.value.coverLetter, usage: result.usage };
  }

  checkClaims(profile: CandidateProfile, coverLetter: string) {
    return this.structured({
      schema: claimCheckSchema,
      // Catching an invented claim matters more than speed here.
      effort: 'medium',
      system: this.withProfile(CHECK_CLAIMS_SYSTEM, profile),
      content: [{ type: 'text', text: `<cover_letter>\n${coverLetter}\n</cover_letter>\n\nCheck every claim.` }],
    });
  }

  /** Stable instructions first, then the profile, with a cache breakpoint after it: one prefix shared by every job. */
  private withProfile(instructions: string, profile: CandidateProfile): Anthropic.Beta.BetaTextBlockParam[] {
    return [
      { type: 'text', text: instructions },
      { type: 'text', text: profileBlock(profile), cache_control: { type: 'ephemeral' } },
    ];
  }

  private async structured<T extends ZodType>(request: {
    schema: T;
    effort: Effort;
    system: Anthropic.Beta.BetaTextBlockParam[];
    content: Anthropic.Beta.BetaContentBlockParam[];
  }): Promise<LlmResult<z.infer<T>>> {
    const response = await this.client.beta.messages.parse({
      model: this.model,
      max_tokens: 16000,
      // If a safety classifier declines, the API retries on a fallback model inside the same call.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: request.effort, format: betaZodOutputFormat(request.schema) },
      system: request.system,
      messages: [{ role: 'user', content: request.content }],
    });

    if (response.stop_reason === 'refusal') {
      throw new LlmOutputError(`The model declined this request (${response.stop_details?.category ?? 'no category'})`);
    }
    if (response.stop_reason === 'max_tokens' || response.parsed_output == null) {
      throw new LlmOutputError('The model did not return a complete, valid response');
    }
    return {
      value: response.parsed_output as z.infer<T>,
      usage: {
        model: response.model,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
      },
    };
  }
}
