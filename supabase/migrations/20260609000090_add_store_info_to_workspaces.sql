alter table public.workspaces
  add column if not exists description text,
  add column if not exists phone varchar(50),
  add column if not exists address text,
  add column if not exists social_links jsonb default '{}'::jsonb;
