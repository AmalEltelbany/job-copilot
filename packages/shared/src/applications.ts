import { z } from "zod";
import { applicationStatusSchema, type ApplicationStatus } from "./jobs.js";

/** Verifier output: every claim in the letter, and whether the profile backs it up. */
export const claimCheckSchema = z.object({
  claims: z
    .array(
      z.object({
        claim: z.string().max(300),
        supported: z.boolean(),
        evidence: z.string().max(300).describe("The profile fact that supports it, or why it is not supported"),
      }),
    )
    .max(30),
});
export type ClaimCheck = z.infer<typeof claimCheckSchema>;

export interface ApplicationDto {
  id: string;
  jobId: string;
  status: ApplicationStatus;
  coverLetter: string;
  unsupportedClaims: ClaimCheck["claims"];
  draftAttempts: number;
  notes: string;
  appliedAt: string | null;
  updatedAt: string;
}

export interface ApplicationListItemDto extends ApplicationDto {
  job: { id: string; title: string; company: string; url: string };
}

export const updateApplicationSchema = z
  .object({
    status: applicationStatusSchema.optional(),
    coverLetter: z.string().max(8000).optional(),
    notes: z.string().max(4000).optional(),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), "Nothing to update");
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
