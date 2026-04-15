import { z } from 'zod';

export const RouteWatchConfigSchema = z.object({
  framework: z.enum(['nextjs', 'express', 'auto']).default('auto'),
  rootDir: z.string().default('.'),
  outputFormat: z.enum(['json', 'markdown', 'console']).default('console'),
  outputFile: z.string().optional(),
  ignore: z.array(z.string()).default(['node_modules', '.next', 'dist']),
  baseCommit: z.string().optional(),
  headCommit: z.string().optional(),
});

export type RouteWatchConfig = z.infer<typeof RouteWatchConfigSchema>;

export const DEFAULT_CONFIG: RouteWatchConfig = {
  framework: 'auto',
  rootDir: '.',
  outputFormat: 'console',
  ignore: ['node_modules', '.next', 'dist'],
};

/**
 * Parses and validates a partial config object, merging it with defaults.
 * Throws a descriptive error if the provided config is invalid.
 */
export function parseConfig(input: unknown): RouteWatchConfig {
  const result = RouteWatchConfigSchema.safeParse(input);
  if (!result.success) {
    const messages = result.error.errors
      .map((e) => `  - ${e.path.join('.')}: ${e.message}`)
      .join('\n');
    throw new Error(`Invalid RouteWatch configuration:\n${messages}`);
  }
  return result.data;
}
