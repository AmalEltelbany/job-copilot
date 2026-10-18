import { z } from 'zod';
import { fetchJson, htmlToText, type SourceAdapter } from './types.js';

// https://remotive.com/api/remote-jobs (public; asks clients to fetch at most a few times a day)
const responseSchema = z.object({
  jobs: z.array(
    z.object({
      id: z.number(),
      url: z.string(),
      title: z.string(),
      company_name: z.string(),
      candidate_required_location: z.string().nullish(),
      publication_date: z.string().nullish(),
      description: z.string().nullish(),
    }),
  ),
});

export function remotiveAdapter(fetchImpl: typeof fetch = fetch): SourceAdapter {
  return {
    kind: 'REMOTIVE',
    async fetchJobs(category) {
      const data = responseSchema.parse(
        await fetchJson(`https://remotive.com/api/remote-jobs?category=${encodeURIComponent(category)}&limit=100`, fetchImpl),
      );
      return data.jobs.map((job) => ({
        externalId: String(job.id),
        title: job.title,
        company: job.company_name,
        location: job.candidate_required_location ?? 'Remote',
        remote: true,
        url: job.url,
        applyUrl: job.url,
        description: htmlToText(job.description ?? ''),
        postedAt: job.publication_date ? new Date(job.publication_date) : null,
      }));
    },
  };
}
