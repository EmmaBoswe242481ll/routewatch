import { RouteChange } from '../diff/types';

export interface CappingConfig {
  maxChanges?: number;
  maxAdded?: number;
  maxRemoved?: number;
  maxModified?: number;
}

export interface CappingResult {
  changes: RouteChange[];
  totalBefore: number;
  totalAfter: number;
  capped: boolean;
  cappedBy: string | null;
}

export function capChanges(
  changes: RouteChange[],
  config: CappingConfig
): CappingResult {
  const totalBefore = changes.length;
  let result = [...changes];
  let cappedBy: string | null = null;

  if (config.maxAdded !== undefined) {
    const added = result.filter(c => c.type === 'added');
    if (added.length > config.maxAdded) {
      const excess = added.slice(config.maxAdded).map(c => c.route.path + c.route.method);
      result = result.filter(
        c => c.type !== 'added' || !excess.includes(c.route.path + c.route.method)
      );
      cappedBy = 'maxAdded';
    }
  }

  if (config.maxRemoved !== undefined) {
    const removed = result.filter(c => c.type === 'removed');
    if (removed.length > config.maxRemoved) {
      const excess = removed.slice(config.maxRemoved).map(c => c.route.path + c.route.method);
      result = result.filter(
        c => c.type !== 'removed' || !excess.includes(c.route.path + c.route.method)
      );
      cappedBy = cappedBy ?? 'maxRemoved';
    }
  }

  if (config.maxModified !== undefined) {
    const modified = result.filter(c => c.type === 'modified');
    if (modified.length > config.maxModified) {
      const excess = modified.slice(config.maxModified).map(c => c.route.path + c.route.method);
      result = result.filter(
        c => c.type !== 'modified' || !excess.includes(c.route.path + c.route.method)
      );
      cappedBy = cappedBy ?? 'maxModified';
    }
  }

  if (config.maxChanges !== undefined && result.length > config.maxChanges) {
    result = result.slice(0, config.maxChanges);
    cappedBy = cappedBy ?? 'maxChanges';
  }

  return {
    changes: result,
    totalBefore,
    totalAfter: result.length,
    capped: result.length < totalBefore,
    cappedBy,
  };
}

export function formatCapText(result: CappingResult): string {
  if (!result.capped) return `Capping: no changes removed (${result.totalAfter} total).`;
  return `Capping [${result.cappedBy}]: ${result.totalBefore} → ${result.totalAfter} changes.`;
}
