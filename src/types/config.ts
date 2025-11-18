import { z } from 'zod';

/**
 * Zod schema for boundary rule validation
 */
export const BoundaryRuleSchema = z.object({
  name: z.string().min(1, 'Boundary rule name cannot be empty'),
  from: z.string().min(1, 'Boundary rule "from" pattern cannot be empty'),
  to: z.string().min(1, 'Boundary rule "to" pattern cannot be empty'),
  message: z.string().optional(),
});

/**
 * Zod schema for monorepo map configuration
 */
export const MonorepoMapConfigSchema = z.object({
  rootPatterns: z
    .array(z.string().min(1))
    .min(1, 'At least one root pattern is required'),
  boundaryRules: z.array(BoundaryRuleSchema).optional().default([]),
  detectCycles: z.boolean().optional().default(true),
  exclude: z.array(z.string()).optional().default(['node_modules', 'dist', 'build', '.next']),
  rootDir: z.string().optional(),
});

/**
 * TypeScript types derived from zod schemas
 */
export type BoundaryRule = z.infer<typeof BoundaryRuleSchema>;
export type MonorepoMapConfig = z.infer<typeof MonorepoMapConfigSchema>;

export const defaultConfig: MonorepoMapConfig = {
  rootPatterns: ['packages/*', 'apps/*'],
  boundaryRules: [],
  detectCycles: true,
  exclude: ['node_modules', 'dist', 'build', '.next'],
};
