export type FilterOperator = 'include' | 'exclude';

export interface RouteFilter {
  operator: FilterOperator;
  pattern: string | RegExp;
}

export interface MethodFilter {
  operator: FilterOperator;
  methods: string[];
}

export interface FilterSet {
  routes?: RouteFilter[];
  methods?: MethodFilter[];
  statusChangesOnly?: boolean;
}

export interface FilterResult<T> {
  matched: T[];
  excluded: T[];
}
