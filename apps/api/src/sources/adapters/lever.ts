import { z } from 'zod';
import { fetchJson, htmlToText, looksRemote, type SourceAdapter } from './types.js';

// https://github.com/lever/postings-api (public, no auth)
const responseSchema = z.array(
  z.object({
    id: z.string(),
    text: z.string(),
    hostedUrl: z.string(),
    applyUrl: z.string().nullish(),
    createdAt: z.number().nullish(),
    workplaceType: z.string().nullish(),
    categories: z.object({ location: z.string().nullish(), team: z.string().nullish() }).nullish(),
    descriptionPlain: z.string().nullish(),
    description: z.string().nullish(),
    lists: z.array(z.object({ text: z.string(), content: z.string() })).nullish(),
    additionalPlain: z.string().nullish(),
  }),
);

export function leverAdapter(fetchImpl: typeof fetch = fetch): SourceAdapter {
  return {
    kind: 'LEVER',
    async fetchJobs(site, label) {
      const data = responseSchema.parse(
        await fetchJson(`https://api.lever.co/v0/postings/${encodeURIComponent(site)}?mode=json`, fetchImpl),
      );
      return data.map((posting) => {
        const location = posting.categories?.location ?? '';
        const lists = (posting.lists ?? []).map((l) => `${l.text}\n${htmlToText(l.content)}`).join('\n\n');
        return {
          externalId: posting.id,
          title: posting.text,
          company: label,
          location,
          remote: posting.workplaceType === 'remote' || looksRemote(location),
          url: posting.hostedUrl,
          applyUrl: posting.applyUrl ?? posting.hostedUrl,
          description: [posting.descriptionPlain ?? htmlToText(posting.description ?? ''), lists, posting.additionalPlain ?? '']
            .filter(Boolean)
            .join('\n\n')
            .trim(),
          postedAt: posting.createdAt ? new Date(posting.createdAt) : null,
        };
      });
    },
  };
}
