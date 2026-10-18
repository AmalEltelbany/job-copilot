import type { CandidateProfile } from '@copilot/shared';

/** A fictional candidate used by demo accounts and the fake provider. */
export const SAMPLE_PROFILE: CandidateProfile = {
  fullName: 'Sara Hassan',
  headline: 'Full-stack engineer (TypeScript, NestJS, React)',
  seniority: 'mid',
  yearsOfExperience: 3,
  skills: ['TypeScript', 'Node.js', 'NestJS', 'React', 'Next.js', 'PostgreSQL', 'Redis', 'Docker', 'REST APIs', 'Jest', 'AWS'],
  experience: [
    {
      title: 'Software Engineer',
      company: 'Nile Logistics',
      start: '2024-02',
      end: null,
      highlights: [
        'Built a shipment-tracking API in NestJS and PostgreSQL serving 40k requests per minute at peak',
        'Cut dashboard load time from 4.2s to 1.1s by moving reporting queries to materialised views',
        'Introduced contract tests between the web app and API, halving production incidents per release',
      ],
    },
    {
      title: 'Junior Full-Stack Developer',
      company: 'Pyramid Apps',
      start: '2022-07',
      end: '2024-01',
      highlights: ['Shipped a React booking flow used by 12 clinics', 'Wrote the Docker setup the whole team uses for local development'],
    },
  ],
  education: ['BSc Computer Engineering, Cairo University (2022)'],
  targetRoles: ['Full-Stack Engineer', 'Backend Engineer', 'Software Engineer'],
  locations: ['Cairo, Egypt'],
  openToRemote: true,
};

export interface SampleJob {
  externalId: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  description: string;
}

/** Fictional postings for the demo board: a mix of good fits, stretches and clear skips. */
export const SAMPLE_JOBS: SampleJob[] = [
  {
    externalId: 'demo-1',
    title: 'Full-Stack Engineer (TypeScript)',
    company: 'Lumen Pay',
    location: 'Remote (EMEA)',
    remote: true,
    description:
      'We are hiring a full-stack engineer with 2+ years of experience in TypeScript, Node.js and React. You will build payment dashboards on Next.js and APIs on NestJS backed by PostgreSQL and Redis. Experience with Docker and AWS is a plus.',
  },
  {
    externalId: 'demo-2',
    title: 'Backend Engineer, Platform',
    company: 'Oasis Health',
    location: 'Cairo, Egypt',
    remote: false,
    description:
      'Join our platform team building REST APIs in Node.js and NestJS. You know PostgreSQL well, have written Jest tests, and have shipped services with Docker. 3+ years of backend experience.',
  },
  {
    externalId: 'demo-3',
    title: 'Senior Software Engineer, Payments',
    company: 'Delta Commerce',
    location: 'Remote',
    remote: true,
    description:
      'Senior engineer with 6+ years building distributed systems in Go and Kafka. You have led teams, owned on-call for high-volume payment systems and designed event-driven architectures.',
  },
  {
    externalId: 'demo-4',
    title: 'Frontend Engineer (React)',
    company: 'Atlas Learning',
    location: 'Remote (Africa)',
    remote: true,
    description: 'Build our learning platform UI with React and Next.js in TypeScript. Bonus: accessibility and design systems experience.',
  },
  {
    externalId: 'demo-5',
    title: 'Machine Learning Engineer',
    company: 'Sphinx AI',
    location: 'Dubai, UAE',
    remote: false,
    description: 'Train and deploy deep learning models in PyTorch. 4+ years of ML engineering, MLOps on Kubernetes, and a strong research background.',
  },
  {
    externalId: 'demo-6',
    title: 'Software Engineering Intern',
    company: 'Lumen Pay',
    location: 'Cairo, Egypt',
    remote: false,
    description: 'Summer internship for students in their final year.',
  },
];
