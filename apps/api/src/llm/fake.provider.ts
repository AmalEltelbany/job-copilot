import type { CandidateProfile, ClaimCheck, FitAssessment, Verdict } from '@copilot/shared';
import type { JobForLlm, LlmProvider, LlmResult, LlmUsage } from './llm.types.js';
import { SAMPLE_PROFILE } from '../demo/fixtures.js';

const USAGE: LlmUsage = { model: 'fake', inputTokens: 0, outputTokens: 0, cacheReadTokens: 0 };

const verdictFor = (score: number): Verdict => (score >= 80 ? 'STRONG' : score >= 60 ? 'GOOD' : score >= 40 ? 'STRETCH' : 'SKIP');

/**
 * Deterministic stand-in for the model: keyword overlap instead of judgment.
 * Used by tests, offline development and demo accounts, so none of them spend API credits.
 */
export class FakeProvider implements LlmProvider {
  async extractProfile(): Promise<LlmResult<CandidateProfile>> {
    return { value: SAMPLE_PROFILE, usage: USAGE };
  }

  async assessFit(profile: CandidateProfile, job: JobForLlm): Promise<LlmResult<FitAssessment>> {
    const text = `${job.title} ${job.description}`.toLowerCase();
    const requirements = profile.skills
      .filter((skill) => text.includes(skill.toLowerCase()))
      .slice(0, 8)
      .map((skill) => ({ requirement: skill, mustHave: true, met: 'yes' as const, evidence: `Listed skill: ${skill}` }));
    const seniorTitle = /\b(senior|sr\.?)\b/i.test(job.title);
    const seniorityPenalty = seniorTitle && profile.seniority === 'junior' ? 30 : 0;
    const score = Math.max(0, Math.min(100, 30 + requirements.length * 12 - seniorityPenalty));
    return {
      value: {
        roleSeniority: seniorTitle ? 'senior' : 'mid',
        requirements,
        score,
        verdict: verdictFor(score),
        summary: requirements.length
          ? `Matches ${requirements.length} of the candidate's skills: ${requirements.map((r) => r.requirement).join(', ')}.`
          : 'Little overlap with the candidate profile.',
      },
      usage: USAGE,
    };
  }

  async draftCoverLetter(profile: CandidateProfile, job: JobForLlm): Promise<LlmResult<string>> {
    const latest = profile.experience[0];
    const sentence = (text: string) => (/[.!?]$/.test(text) ? text : `${text}.`);
    const jobText = job.description.toLowerCase();
    const overlap = profile.skills.filter((skill) => jobText.includes(skill.toLowerCase())).slice(0, 4);
    const headline = profile.headline.charAt(0).toLowerCase() + profile.headline.slice(1);

    const letter = [
      `Dear ${job.company} team,`,
      `I'd like to apply for the ${job.title} role. I'm a ${headline} with ${profile.yearsOfExperience} years of professional experience${latest ? `, most recently as ${latest.title} at ${latest.company}` : ''}.`,
      latest?.highlights.length ? `Some of the work I'm proudest of: ${latest.highlights.slice(0, 2).map(sentence).join(' ')}` : '',
      overlap.length
        ? `Your posting mentions ${overlap.join(', ')}, which I use every day. I'd be glad to talk about how I could help ${job.company}.`
        : `I'd be glad to talk about how I could help ${job.company}.`,
      `Best regards,\n${profile.fullName}`,
    ]
      .filter(Boolean)
      .join('\n\n');
    return { value: letter, usage: USAGE };
  }

  async checkClaims(profile: CandidateProfile, coverLetter: string): Promise<LlmResult<ClaimCheck>> {
    // Treats "N years" as the only checkable claim: enough to exercise the verify-and-revise loop in tests.
    const claims = [...coverLetter.matchAll(/(\d+(?:\.\d+)?) years/g)].map((m) => {
      const supported = Number(m[1]) <= profile.yearsOfExperience;
      return {
        claim: m[0],
        supported,
        evidence: supported ? `Profile: ${profile.yearsOfExperience} years` : `Profile says ${profile.yearsOfExperience} years`,
      };
    });
    return { value: { claims }, usage: USAGE };
  }
}
