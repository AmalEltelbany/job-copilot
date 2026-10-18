import { z } from "zod";

export const registerSchema = z.object({
  email: z.email().max(254).transform((v) => v.toLowerCase()),
  name: z.string().trim().min(1).max(80),
  password: z.string().min(8).max(128),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.email().transform((v) => v.toLowerCase()),
  password: z.string().min(1).max(128),
});
export type LoginInput = z.infer<typeof loginSchema>;

export interface UserDto {
  id: string;
  email: string;
  name: string;
  isDemo: boolean;
}

export interface UsageDto {
  llmCallsToday: number;
  dailyLimit: number;
}

export interface DashboardDto {
  hasProfile: boolean;
  sources: number;
  jobs: number;
  scored: number;
  strongOrGood: number;
  pendingScoring: number;
  applications: Record<string, number>;
  usage: UsageDto;
}
