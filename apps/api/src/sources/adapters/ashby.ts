import { z } from 'zod';
import { fetchJson, htmlToText, looksRemote, type SourceAdapter } from './types.js';

// https://developers.ashbyhq.com/docs/public-job-posting-api (public, no auth)
const responseSchema = z.object({
  jobs: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      location: z.string().nullish(),
      isRemote: z.boolean().nullish(),
      jobUrl: z.string(),
      applyUrl: z.string().nullish(),
      publishedAt: z.string().nullish(),
      descriptionPlain: z.string().nullish(),
      descriptionHtml: z.string().nullish(),
      isListed: z.boolean().nullish(),
    }),
  ),
});

export function ashbyAdapter(fetchImpl: typeof fetch = fetch): SourceAdapter {
  return {
    kind: 'ASHBY',
    async fetchJobs(organization, label) {
      const data = responseSchema.parse(
        await fetchJson(`https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(organization)}`, fetchImpl),
      );
      return data.jobs
        .filter((job) => job.isListed !== false)
        .map((job) => ({
          externalId: job.id,
          title: job.title,
          company: label,
          location: job.location ?? '',
          remote: job.isRemote === true || looksRemote(job.location),
          url: job.jobUrl,
          applyUrl: job.applyUrl ?? job.jobUrl,
          description: job.descriptionPlain ?? htmlToText(job.descriptionHtml ?? ''),
          postedAt: job.publishedAt ? new Date(job.publishedAt) : null,
        }));
    },
  };
}
