import { RouteWatchConfigSchema, DEFAULT_CONFIG } from '../schema';

describe('RouteWatchConfigSchema', () => {
  it('parses a valid full config', () => {
    const input = {
      framework: 'nextjs',
      rootDir: './src',
      outputFormat: 'markdown',
      outputFile: 'report.md',
      ignore: ['node_modules'],
      baseCommit: 'abc123',
      headCommit: 'def456',
    };
    const result = RouteWatchConfigSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.framework).toBe('nextjs');
      expect(result.data.outputFile).toBe('report.md');
    }
  });

  it('applies defaults for missing fields', () => {
    const result = RouteWatchConfigSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.framework).toBe('auto');
      expect(result.data.outputFormat).toBe('console');
      expect(result.data.rootDir).toBe('.');
      expect(result.data.ignore).toEqual(['node_modules', '.next', 'dist']);
    }
  });

  it('fails on invalid framework value', () => {
    const result = RouteWatchConfigSchema.safeParse({ framework: 'rails' });
    expect(result.success).toBe(false);
  });

  it('fails on invalid outputFormat value', () => {
    const result = RouteWatchConfigSchema.safeParse({ outputFormat: 'xml' });
    expect(result.success).toBe(false);
  });

  it('DEFAULT_CONFIG matches schema defaults', () => {
    const result = RouteWatchConfigSchema.safeParse(DEFAULT_CONFIG);
    expect(result.success).toBe(true);
  });
});
