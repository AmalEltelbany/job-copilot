import type { SourceKind } from '@copilot/shared';

/** Every source is normalised into this shape before it touches the database. */
export interface NormalizedJob {
  externalId: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  url: string;
  applyUrl: string;
  description: string;
  postedAt: Date | null;
}

export interface SourceAdapter {
  kind: SourceKind;
  fetchJobs(identifier: string, label: string): Promise<NormalizedJob[]>;
}

export class SourceFetchError extends Error {}

export async function fetchJson(url: string, fetchImpl: typeof fetch = fetch): Promise<unknown> {
  const res = await fetchImpl(url, {
    headers: { accept: 'application/json', 'user-agent': 'job-copilot (personal job search tool)' },
    signal: AbortSignal.timeout(15_000),
  });
  if (res.status === 404) throw new SourceFetchError('Board not found. Check the company identifier.');
  if (!res.ok) throw new SourceFetchError(`Job board returned ${res.status}`);
  return res.json();
}

/** Job boards return HTML descriptions; the model and the UI only need readable text. */
export function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
      .replace(/<\s*(br|\/p|\/div|\/li|\/h[1-6])\s*\/?>/gi, '\n')
      .replace(/<li[^>]*>/gi, '• ')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, '&');
}

export const looksRemote = (...values: (string | null | undefined)[]) =>
  values.some((v) => !!v && /\bremote\b|anywhere|work from home/i.test(v));
