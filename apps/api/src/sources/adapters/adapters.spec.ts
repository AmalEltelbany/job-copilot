import { ashbyAdapter } from './ashby.js';
import { greenhouseAdapter } from './greenhouse.js';
import { leverAdapter } from './lever.js';
import { remotiveAdapter } from './remotive.js';
import { SourceFetchError } from './types.js';

/** A fetch stub that serves one JSON body and records the URL it was asked for. */
function stubFetch(body: unknown, status = 200) {
  const calls: string[] = [];
  const impl = (async (url: string | URL | Request) => {
    calls.push(String(url));
    return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
  return { impl, calls };
}

describe('job source adapters', () => {
  it('normalises Greenhouse jobs and un-escapes their HTML', async () => {
    const { impl, calls } = stubFetch({
      jobs: [
        {
          id: 123,
          title: 'Backend Engineer',
          absolute_url: 'https://boards.greenhouse.io/acme/jobs/123',
          first_published: '2026-10-01T10:00:00Z',
          location: { name: 'Remote - EMEA' },
          content: '&lt;p&gt;Build APIs in &lt;strong&gt;Node.js&lt;/strong&gt; &amp;amp; Postgres.&lt;/p&gt;',
        },
      ],
      meta: { total: 1 },
    });
    const [job] = await greenhouseAdapter(impl).fetchJobs('acme', 'Acme');
    expect(calls[0]).toBe('https://boards-api.greenhouse.io/v1/boards/acme/jobs?content=true');
    expect(job).toMatchObject({ externalId: '123', company: 'Acme', remote: true, description: 'Build APIs in Node.js & Postgres.' });
    expect(job.postedAt?.toISOString()).toBe('2026-10-01T10:00:00.000Z');
  });

  it('normalises Lever postings, including their requirement lists', async () => {
    const { impl } = stubFetch([
      {
        id: 'abc',
        text: 'Full-Stack Engineer',
        hostedUrl: 'https://jobs.lever.co/acme/abc',
        applyUrl: 'https://jobs.lever.co/acme/abc/apply',
        createdAt: 1_760_000_000_000,
        workplaceType: 'remote',
        categories: { location: 'Cairo' },
        descriptionPlain: 'Join us.',
        lists: [{ text: 'Requirements', content: '<li>React</li><li>NestJS</li>' }],
      },
    ]);
    const [job] = await leverAdapter(impl).fetchJobs('acme', 'Acme');
    expect(job).toMatchObject({ externalId: 'abc', remote: true, applyUrl: 'https://jobs.lever.co/acme/abc/apply' });
    expect(job.description).toContain('Requirements\n• React\n• NestJS');
  });

  it('skips unlisted Ashby jobs', async () => {
    const { impl } = stubFetch({
      jobs: [
        { id: '1', title: 'Engineer', jobUrl: 'https://jobs.ashbyhq.com/acme/1', isListed: true, isRemote: false, location: 'Cairo' },
        { id: '2', title: 'Hidden', jobUrl: 'https://jobs.ashbyhq.com/acme/2', isListed: false },
      ],
    });
    const jobs = await ashbyAdapter(impl).fetchJobs('acme', 'Acme');
    expect(jobs.map((j) => j.externalId)).toEqual(['1']);
  });

  it('takes the company from each Remotive posting', async () => {
    const { impl } = stubFetch({
      jobs: [{ id: 9, url: 'https://remotive.com/9', title: 'Dev', company_name: 'Globex', candidate_required_location: 'Worldwide', description: '<p>Hi</p>' }],
    });
    const [job] = await remotiveAdapter(impl).fetchJobs('software-dev', 'Remotive');
    expect(job).toMatchObject({ company: 'Globex', remote: true, location: 'Worldwide', description: 'Hi' });
  });

  it('reports a missing board clearly', async () => {
    const { impl } = stubFetch({ error: 'not found' }, 404);
    await expect(greenhouseAdapter(impl).fetchJobs('nope', 'Nope')).rejects.toBeInstanceOf(SourceFetchError);
  });

  it('rejects responses in an unexpected shape instead of storing garbage', async () => {
    const { impl } = stubFetch({ unexpected: true });
    await expect(greenhouseAdapter(impl).fetchJobs('acme', 'Acme')).rejects.toThrow();
  });
});
