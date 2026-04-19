export interface IndexStats {
  totalPaths: number;
  totalMethods: number;
  totalTypes: number;
  pathCounts: Record<string, number>;
  methodCounts: Record<string, number>;
  typeCounts: Record<string, number>;
}

export function buildIndexStats(
  byPath: Map<string, unknown[]>,
  byMethod: Map<string, unknown[]>,
  byType: Map<string, unknown[]>
): IndexStats {
  const pathCounts: Record<string, number> = {};
  for (const [k, v] of byPath) pathCounts[k] = v.length;

  const methodCounts: Record<string, number> = {};
  for (const [k, v] of byMethod) methodCounts[k] = v.length;

  const typeCounts: Record<string, number> = {};
  for (const [k, v] of byType) typeCounts[k] = v.length;

  return {
    totalPaths: byPath.size,
    totalMethods: byMethod.size,
    totalTypes: byType.size,
    pathCounts,
    methodCounts,
    typeCounts,
  };
}
