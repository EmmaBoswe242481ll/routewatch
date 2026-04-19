import {
  partitionChanges,
  buildPartitionSummary,
  formatPartitionText,
  PartitionRule,
} from '../partitioner';
import { RouteChange } from '../../diff/types';

function makeChange(method: string, path: string, type: RouteChange['type'] = 'added'): RouteChange {
  return { method, path, type } as RouteChange;
}

const rules: PartitionRule[] = [
  { name: 'GET routes', predicate: c => c.method === 'GET' },
  { name: 'POST routes', predicate: c => c.method === 'POST' },
  { name: 'removals', predicate: c => c.type === 'removed' },
];

describe('partitionChanges', () => {
  it('places changes into correct partitions', () => {
    const changes = [
      makeChange('GET', '/a'),
      makeChange('POST', '/b'),
      makeChange('GET', '/c'),
    ];
    const { partitions, unmatched } = partitionChanges(changes, rules);
    expect(partitions[0].changes).toHaveLength(2);
    expect(partitions[1].changes).toHaveLength(1);
    expect(unmatched).toHaveLength(0);
  });

  it('uses first matching rule only', () => {
    const changes = [makeChange('GET', '/x', 'removed')];
    const { partitions } = partitionChanges(changes, rules);
    expect(partitions[0].changes).toHaveLength(1); // matched GET first
    expect(partitions[2].changes).toHaveLength(0);
  });

  it('collects unmatched changes', () => {
    const changes = [makeChange('DELETE', '/z')];
    const { unmatched } = partitionChanges(changes, rules);
    expect(unmatched).toHaveLength(1);
  });

  it('returns empty partitions for empty input', () => {
    const { partitions, unmatched } = partitionChanges([], rules);
    expect(partitions.every(p => p.changes.length === 0)).toBe(true);
    expect(unmatched).toHaveLength(0);
  });

  it('returns one partition per rule', () => {
    const { partitions } = partitionChanges([], rules);
    expect(partitions).toHaveLength(rules.length);
  });

  it('preserves rule names in partition results', () => {
    const { partitions } = partitionChanges([], rules);
    expect(partitions.map(p => p.name)).toEqual(rules.map(r => r.name));
  });
});

describe('buildPartitionSummary', () => {
  it('computes totals correctly', () => {
    const changes = [makeChange('GET', '/a'), makeChange('DELETE', '/b')];
    const { partitions, unmatched } = partitionChanges(changes, rules);
    const summary = buildPartitionSummary(partitions, unmatched);
    expect(summary.total).toBe(2);
    expect(summary.unmatched).toBe(1);
  });
});

describe('formatPartitionText', () => {
  it('formats summary as readable text', () => {
    const changes = [makeChange('GET', '/a'), makeChange('DELETE', '/b')];
    const { partitions, unmatched } = partitionChanges(changes, rules);
    const summary = buildPartitionSummary(partitions, unmatched);
    const text = formatPartitionText(summary);
    expect(text).toContain('GET routes');
    expect(text).toContain('unmatched');
  });
});
