import { RouteChange } from '../diff/types';

export type GroupingStrategy = 'prefix' | 'method' | 'type' | 'none';

export interface RouteGroup {
  label: string;
  changes: RouteChange[];
}

export interface GroupedChanges {
  strategy: GroupingStrategy;
  groups: RouteGroup[];
  total: number;
}
