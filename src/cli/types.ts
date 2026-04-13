export interface RunOptions {
  /** Starting git ref (commit, branch, tag). Defaults to HEAD~1. */
  from?: string;
  /** Ending git ref (commit, branch, tag). Defaults to HEAD. */
  to?: string;
  /** Output format for the report. Defaults to 'text'. */
  format?: 'text' | 'json' | 'markdown';
  /** File path patterns to include when scanning for routes. */
  include?: string[];
  /** Working directory for the git repository. Defaults to process.cwd(). */
  cwd?: string;
}

export interface CliArgs {
  from: string;
  to: string;
  format: 'text' | 'json' | 'markdown';
  config?: string;
  cwd?: string;
}
