import { SAMPLE_PROFILE } from '../demo/fixtures.js';
import { prefilter, type PrefilterJob } from './prefilter.js';

const job = (overrides: Partial<PrefilterJob>): PrefilterJob => ({
  title: 'Backend Engineer',
  location: 'Cairo, Egypt',
  remote: false,
  description: 'We use TypeScript and PostgreSQL.',
  ...overrides,
});

describe('prefilter', () => {
  it('lets a matching engineering role through', () => {
    expect(prefilter(SAMPLE_PROFILE, job({}))).toBeNull();
  });

  it.each([
    ['Software Engineering Intern', 'Internship or graduate role'],
    ['Principal Engineer', 'Seniority well above your level'],
    ['Director of Engineering', 'Seniority well above your level'],
    ['Account Executive', 'Not an engineering role'],
  ])('skips "%s"', (title, reason) => {
    expect(prefilter(SAMPLE_PROFILE, job({ title }))).toBe(reason);
  });

  it('keeps senior roles for a mid-level candidate (a stretch, for the model to judge)', () => {
    expect(prefilter(SAMPLE_PROFILE, job({ title: 'Senior Backend Engineer' }))).toBeNull();
  });

  it('drops senior roles for a junior candidate', () => {
    expect(prefilter({ ...SAMPLE_PROFILE, seniority: 'junior' }, job({ title: 'Senior Backend Engineer' }))).toBe(
      'Seniority well above your level',
    );
  });

  it('skips on-site jobs elsewhere, but keeps remote ones when the candidate is open to remote', () => {
    expect(prefilter(SAMPLE_PROFILE, job({ location: 'Berlin, Germany' }))).toBe('Location: Berlin, Germany');
    expect(prefilter(SAMPLE_PROFILE, job({ location: 'Berlin, Germany', remote: true }))).toBeNull();
    expect(prefilter({ ...SAMPLE_PROFILE, openToRemote: false }, job({ location: 'Anywhere', remote: true }))).toBe('Location: Anywhere');
  });

  it('matches skills on word boundaries', () => {
    const profile = { ...SAMPLE_PROFILE, skills: ['Go'] };
    expect(prefilter(profile, job({ description: 'A good team and good coffee.' }))).toBe('No overlap with your skills');
    expect(prefilter(profile, job({ description: 'Services written in Go.' }))).toBeNull();
  });
});
