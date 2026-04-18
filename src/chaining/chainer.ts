import { RouteChange } from '../parsers/types';

export interface ChainStep<T> {
  name: string;
  transform: (changes: RouteChange[]) => T extends RouteChange[] ? T : RouteChange[];
}

export interface ChainResult {
  steps: string[];
  input: number;
  output: number;
  changes: RouteChange[];
}

export function createChain(changes: RouteChange[]): ChainBuilder {
  return new ChainBuilder(changes);
}

export class ChainBuilder {
  private changes: RouteChange[];
  private appliedSteps: string[] = [];

  constructor(changes: RouteChange[]) {
    this.changes = [...changes];
  }

  pipe(name: string, fn: (changes: RouteChange[]) => RouteChange[]): this {
    const before = this.changes.length;
    this.changes = fn(this.changes);
    this.appliedSteps.push(`${name}(${before}->${this.changes.length})`);
    return this;
  }

  build(): ChainResult {
    return {
      steps: this.appliedSteps,
      input: this.appliedSteps.length > 0
        ? parseInt(this.appliedSteps[0].match(/(\d+)->/)?.[1] ?? '0')
        : this.changes.length,
      output: this.changes.length,
      changes: this.changes,
    };
  }
}

export function formatChainText(result: ChainResult): string {
  const lines: string[] = [
    `Chain: ${result.input} -> ${result.output} changes`,
    `Steps (${result.steps.length}):`,
    ...result.steps.map(s => `  - ${s}`),
  ];
  return lines.join('\n');
}
