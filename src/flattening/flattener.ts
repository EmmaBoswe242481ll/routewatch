import { RouteChange } from '../diff/types';

export interface FlatChange {
  path: string;
  method: string;
  changeType: string;
  oldPath?: string;
  newPath?: string;
  paramsBefore?: string[];
  paramsAfter?: string[];
  [key: string]: unknown;
}

export function flattenChange(change: RouteChange): FlatChange {
  return {
    path: change.route.path,
    method: change.route.method,
    changeType: change.type,
    oldPath: change.before?.path,
    newPath: change.after?.path,
    paramsBefore: change.before?.params ?? [],
    paramsAfter: change.after?.params ?? [],
  };
}

export function flattenChanges(changes: RouteChange[]): FlatChange[] {
  return changes.map(flattenChange);
}

export function flattenToRows(changes: RouteChange[]): string[][] {
  const headers = ['path', 'method', 'changeType', 'oldPath', 'newPath', 'paramsBefore', 'paramsAfter'];
  const rows = flattenChanges(changes).map(fc => [
    fc.path,
    fc.method,
    fc.changeType,
    fc.oldPath ?? '',
    fc.newPath ?? '',
    (fc.paramsBefore ?? []).join(','),
    (fc.paramsAfter ?? []).join(','),
  ]);
  return [headers, ...rows];
}

export function formatFlattenText(changes: RouteChange[]): string {
  const flat = flattenChanges(changes);
  if (flat.length === 0) return 'No changes to flatten.';
  const lines = flat.map(f =>
    `[${f.changeType}] ${f.method} ${f.path}`
  );
  return `Flattened ${flat.length} change(s):\n` + lines.join('\n');
}
