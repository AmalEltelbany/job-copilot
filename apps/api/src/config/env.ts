import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4100),
    DATABASE_URL: z.string().min(1),
    JWT_SECRET: z.string().min(16),
    LLM_PROVIDER: z.enum(['claude', 'fake']).default('claude'),
    ANTHROPIC_API_KEY: z.string().optional(),
    CLAUDE_MODEL: z.string().default('claude-opus-5-5'),
    LLM_DAILY_LIMIT: z.coerce.number().int().positive().default(150),
    /**
     * Comma-separated emails allowed to use the real model. Empty means everyone.
     * On a public deployment, list only your own so strangers can't spend your API credit.
     */
    REAL_LLM_EMAILS: z
      .string()
      .default('')
      .transform((v) => v.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)),
  })
  .refine((env) => env.LLM_PROVIDER !== 'claude' || !!env.ANTHROPIC_API_KEY, {
    message: 'ANTHROPIC_API_KEY is required when LLM_PROVIDER=claude',
    path: ['ANTHROPIC_API_KEY'],
  });

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Invalid environment: ${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}
