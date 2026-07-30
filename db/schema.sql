create table if not exists scored_mints_cache (
  mint_address text primary key,
  result jsonb not null,
  checked_at timestamptz not null default now()
);
