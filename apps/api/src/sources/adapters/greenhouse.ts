import { z } from 'zod';
import { fetchJson, htmlToText, looksRemote, type SourceAdapter } from './types.js';

// https://developers.greenhouse.io/job-board.html (public, no auth). `content` is HTML-escaped HTML.
const responseSchema = z.object({
  jobs: z.array(
    z.object({
      id: z.number(),
      title: z.string(),
      absolute_url: z.string(),
      updated_at: z.string().nullish(),
      first_published: z.string().nullish(),
      location: z.object({ name: z.string().nullish() }).nullish(),
      content: z.string().nullish(),
    }),
  ),
});

export function greenhouseAdapter(fetchImpl: typeof fetch = fetch): SourceAdapter {
  return {
    kind: 'GREENHOUSE',
    async fetchJobs(boardToken, label) {
      const data = responseSchema.parse(
        await fetchJson(`https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(boardToken)}/jobs?content=true`, fetchImpl),
      );
      return data.jobs.map((job) => {
        const location = job.location?.name ?? '';
        return {
          externalId: String(job.id),
          title: job.title,
          company: label,
          location,
          remote: looksRemote(location, job.title),
          url: job.absolute_url,
          applyUrl: job.absolute_url,
          // Greenhouse escapes the HTML, so the first pass decodes entities and the second strips the tags.
          description: htmlToText(htmlToText(job.content ?? '')),
          postedAt: parseDate(job.first_published ?? job.updated_at),
        };
      });
    },
  };
}

function parseDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
