import type { ApplicationDto, ClaimCheck, FitAssessment, JobDetailDto, JobSummaryDto, MatchDto } from '@copilot/shared';
import type { Application, Job, JobSource, Match } from '../generated/prisma/client.js';

export function toMatchDto(match: Match): MatchDto {
  return {
    score: match.score,
    verdict: match.verdict,
    summary: match.summary,
    roleSeniority: match.roleSeniority as FitAssessment['roleSeniority'],
    requirements: match.requirements as FitAssessment['requirements'],
    profileVersion: match.profileVersion,
    createdAt: match.createdAt.toISOString(),
  };
}

export function toApplicationDto(app: Application): ApplicationDto {
  return {
    id: app.id,
    jobId: app.jobId,
    status: app.status,
    coverLetter: app.coverLetter,
    unsupportedClaims: app.unsupportedClaims as ClaimCheck['claims'],
    draftAttempts: app.draftAttempts,
    notes: app.notes,
    appliedAt: app.appliedAt?.toISOString() ?? null,
    updatedAt: app.updatedAt.toISOString(),
  };
}

type JobWithRelations = Job & { source: JobSource; match: Match | null; application: Application | null };

export function toJobSummaryDto(job: JobWithRelations): JobSummaryDto {
  return {
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    remote: job.remote,
    url: job.url,
    postedAt: job.postedAt?.toISOString() ?? null,
    sourceKind: job.source.kind,
    filteredOut: job.filteredOut,
    match: job.match ? { score: job.match.score, verdict: job.match.verdict, summary: job.match.summary } : null,
    applicationStatus: job.application?.status ?? null,
  };
}

export function toJobDetailDto(job: JobWithRelations): JobDetailDto {
  return {
    ...toJobSummaryDto(job),
    description: job.description,
    applyUrl: job.applyUrl,
    match: job.match ? toMatchDto(job.match) : null,
    application: job.application ? toApplicationDto(job.application) : null,
  };
}
