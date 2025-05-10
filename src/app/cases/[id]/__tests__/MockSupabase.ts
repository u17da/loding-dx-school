export interface MockSupabaseClient {
  from: (table: string) => MockSupabaseQuery;
  select: () => MockSupabaseQuery;
  eq: (column: string, value: string) => MockSupabaseQuery;
  single: () => Promise<{ data: unknown; error: unknown }>;
}

export interface MockSupabaseQuery {
  from: (table: string) => MockSupabaseQuery;
  select: () => MockSupabaseQuery;
  eq: (column: string, value: string) => MockSupabaseQuery;
  single: () => Promise<{ data: unknown; error: unknown }>;
}

export interface SupabaseModule {
  getSupabase: () => MockSupabaseClient;
}
