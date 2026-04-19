import { RouteChange } from '../diff/types';

export interface ZipPair {
  left: RouteChange;
  right: RouteChange;
}

export interface ZipResult {
  pairs: ZipPair[];
  leftOnly: RouteChange[];
  rightOnly: RouteChange[];
}

function changeKey(c: RouteChange): string {
  return `${c.method}:${c.path}`;
}

export function zipChanges(
  left: RouteChange[],
  right: RouteChange[]
): ZipResult {
  const rightMap = new Map(right.map(c => [changeKey(c), c]));
  const leftMap = new Map(left.map(c => [changeKey(c), c]));

  const pairs: ZipPair[] = [];
  const leftOnly: RouteChange[] = [];
  const rightOnly: RouteChange[] = [];

  for (const l of left) {
    const r = rightMap.get(changeKey(l));
    if (r) {
      pairs.push({ left: l, right: r });
    } else {
      leftOnly.push(l);
    }
  }

  for (const r of right) {
    if (!leftMap.has(changeKey(r))) {
      rightOnly.push(r);
    }
  }

  return { pairs, leftOnly, rightOnly };
}

export function formatZipText(result: ZipResult): string {
  const lines: string[] = [
    `Zip result: ${result.pairs.length} paired, ${result.leftOnly.length} left-only, ${result.rightOnly.length} right-only`,
  ];
  for (const { left, right } of result.pairs) {
    lines.push(`  PAIR  [${left.method}] ${left.path} | [${right.method}] ${right.path}`);
  }
  for (const c of result.leftOnly) {
    lines.push(`  LEFT  [${c.method}] ${c.path}`);
  }
  for (const c of result.rightOnly) {
    lines.push(`  RIGHT [${c.method}] ${c.path}`);
  }
  return lines.join('\n');
}
