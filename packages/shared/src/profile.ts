import { z } from "zod";

export const seniorityLevels = ["junior", "mid", "senior", "lead"] as const;
export const senioritySchema = z.enum(seniorityLevels);
export type Seniority = z.infer<typeof senioritySchema>;

/**
 * The single source of truth about the candidate. Every generated sentence must be traceable to it,
 * so it only holds facts that are written in the CV (or that the user typed in themselves).
 */
export const candidateProfileSchema = z.object({
  fullName: z.string().min(1).max(120),
  headline: z.string().max(200).describe("One line, e.g. 'Full-stack engineer (TypeScript, NestJS, React)'"),
  seniority: senioritySchema.describe("Level the candidate can credibly apply for, judged from real experience"),
  yearsOfExperience: z.number().min(0).max(50).describe("Full-time professional years only; internships excluded"),
  skills: z.array(z.string().max(60)).max(60).describe("Technologies and practices that appear in the CV"),
  experience: z
    .array(
      z.object({
        title: z.string().max(120),
        company: z.string().max(120),
        start: z.string().max(20).describe("YYYY-MM"),
        end: z.string().max(20).nullable().describe("YYYY-MM, or null if current"),
        highlights: z.array(z.string().max(400)).max(12).describe("Achievements as written in the CV"),
      }),
    )
    .max(15),
  education: z.array(z.string().max(200)).max(5),
  targetRoles: z.array(z.string().max(80)).max(8).describe("Job titles to search for"),
  locations: z.array(z.string().max(80)).max(8).describe("Cities or countries the candidate can work in"),
  openToRemote: z.boolean(),
});
export type CandidateProfile = z.infer<typeof candidateProfileSchema>;

export interface ProfileDto {
  version: number;
  data: CandidateProfile;
  sourceFileName: string | null;
  updatedAt: string;
}
