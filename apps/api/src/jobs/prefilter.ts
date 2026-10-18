import type { CandidateProfile } from '@copilot/shared';

export interface PrefilterJob {
  title: string;
  location: string;
  remote: boolean;
  description: string;
}

const ENGINEERING_TITLE = /engineer|developer|programmer|software|full[- ]?stack|back[- ]?end|front[- ]?end|devops|sre\b|platform/i;
const TOO_JUNIOR = /\b(intern|internship|trainee|graduate program|working student)\b/i;
const TOO_SENIOR_FOR_ANYONE_BELOW_LEAD = /\b(principal|staff|director|head of|vp|vice president|chief|distinguished)\b/i;
const SENIOR = /\b(senior|sr\.?|lead)\b/i;

/**
 * Cheap rules that run before any model call. Returns why a job is skipped, or null if it should be scored.
 * Every job filtered here is a model call (and money) saved, so the rules only drop clear mismatches.
 */
export function prefilter(profile: CandidateProfile, job: PrefilterJob): string | null {
  if (!ENGINEERING_TITLE.test(job.title) && !profile.targetRoles.some((role) => titleOverlap(role, job.title))) {
    return 'Not an engineering role';
  }
  if (TOO_JUNIOR.test(job.title)) return 'Internship or graduate role';
  if (profile.seniority !== 'lead' && TOO_SENIOR_FOR_ANYONE_BELOW_LEAD.test(job.title)) {
    return 'Seniority well above your level';
  }
  if (profile.seniority === 'junior' && SENIOR.test(job.title)) return 'Seniority well above your level';

  if (!locationFits(profile, job)) return `Location: ${job.location}`;

  const text = `${job.title}\n${job.description}`.toLowerCase();
  if (!profile.skills.some((skill) => containsSkill(text, skill))) return 'No overlap with your skills';
  return null;
}

function locationFits(profile: CandidateProfile, job: PrefilterJob): boolean {
  if (job.remote) return profile.openToRemote;
  if (!job.location.trim()) return true; // unknown: let the model judge
  const jobLocation = job.location.toLowerCase();
  return profile.locations.some((place) =>
    place
      .toLowerCase()
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.length > 1)
      .some((part) => jobLocation.includes(part)),
  );
}

function titleOverlap(role: string, title: string) {
  const words = role.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
  return words.some((w) => title.toLowerCase().includes(w));
}

function containsSkill(text: string, skill: string) {
  const escaped = skill.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Word boundaries so "Go" doesn't match "good"; skills like "C#" or "Node.js" end in non-word characters.
  return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`, 'i').test(text);
}
