export interface ClampOptions {
  min?: number;
  max?: number;
  field?: 'path' | 'method' | 'params';
}

export interface ClampResult {
  changes: import('../diff/types').RouteChange[];
  clamped: number;
  original: number;
  min: number | undefined;
  max: number | undefined;
}

export function buildClampResult(
  changes: import('../diff/types').RouteChange[],
  original: number,
  options: ClampOptions
): ClampResult {
  return {
    changes,
    clamped: original - changes.length,
    original,
    min: options.min,
    max: options.max,
  };
}
