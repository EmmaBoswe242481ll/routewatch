import { createChain, formatChainText } from '../chainer';
import { RouteChange } from '../../parsers/types';

function makeChange(method: string, path: string, type: RouteChange['type'] = 'added'): RouteChange {
  return { method, path, type, params: [] };
}

describe('createChain', () => {
  const changes = [
    makeChange('GET', '/api/users'),
    makeChange('POST', '/api/users'),
    makeChange('DELETE', '/api/users/1'),
  ];

  it('returns all changes with no steps', () => {
    const result = createChain(changes).build();
    expect(result.changes).toHaveLength(3);
    expect(result.steps).toHaveLength(0);
  });

  it('applies a single pipe step', () => {
    const result = createChain(changes)
      .pipe('filterGet', cs => cs.filter(c => c.method === 'GET'))
      .build();
    expect(result.changes).toHaveLength(1);
    expect(result.steps[0]).toContain('filterGet');
  });

  it('chains multiple steps', () => {
    const result = createChain(changes)
      .pipe('onlyApi', cs => cs.filter(c => c.path.startsWith('/api')))
      .pipe('onlyGet', cs => cs.filter(c => c.method === 'GET'))
      .build();
    expect(result.changes).toHaveLength(1);
    expect(result.steps).toHaveLength(2);
  });

  it('tracks input and output counts', () => {
    const result = createChain(changes)
      .pipe('drop', cs => cs.slice(0, 1))
      .build();
    expect(result.output).toBe(1);
  });

  it('does not mutate original array', () => {
    createChain(changes).pipe('clear', () => []).build();
    expect(changes).toHaveLength(3);
  });
});

describe('formatChainText', () => {
  it('formats chain result as text', () => {
    const result = createChain([
      makeChange('GET', '/a'),
      makeChange('POST', '/b'),
    ])
      .pipe('filter', cs => cs.slice(0, 1))
      .build();
    const text = formatChainText(result);
    expect(text).toContain('Chain:');
    expect(text).toContain('Steps');
    expect(text).toContain('filter');
  });
});
