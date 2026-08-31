create extension if not exists pgcrypto;

create type public.image_load_status as enum ('unknown', 'available', 'broken');

create table public.allowed_emails (
  email_normalized text primary key,
  approved_at timestamptz not null default now(),
  check (email_normalized = lower(trim(email_normalized)))
);

create table public.images (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  original_url text not null,
  url_fingerprint text not null check (char_length(url_fingerprint) = 64),
  note text not null default '',
  load_status public.image_load_status not null default 'unknown',
  last_load_checked_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index images_owner_fingerprint_active_key
  on public.images (owner_id, url_fingerprint)
  where deleted_at is null;

create index images_owner_created_active_idx
  on public.images (owner_id, created_at desc, id desc)
  where deleted_at is null;

create table public.folders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  parent_id uuid references public.folders(id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index folders_owner_parent_sort_idx
  on public.folders (owner_id, parent_id, sort_order, name);

create table public.image_folders (
  image_id uuid not null references public.images(id) on delete cascade,
  folder_id uuid not null references public.folders(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (image_id, folder_id)
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  name_normalized text not null check (name_normalized = lower(trim(name_normalized))),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, name_normalized)
);

create table public.image_tags (
  image_id uuid not null references public.images(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (image_id, tag_id)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger images_set_updated_at
before update on public.images
for each row execute function public.set_updated_at();

create trigger folders_set_updated_at
before update on public.folders
for each row execute function public.set_updated_at();

create trigger tags_set_updated_at
before update on public.tags
for each row execute function public.set_updated_at();

create or replace function public.before_user_created_allowlist(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate_email text := lower(trim(coalesce(event -> 'user' ->> 'email', '')));
begin
  if candidate_email = '' or not exists (
    select 1
    from public.allowed_emails
    where email_normalized = candidate_email
  ) then
    return jsonb_build_object(
      'error',
      jsonb_build_object('http_code', 403, 'message', 'Access denied.')
    );
  end if;

  return '{}'::jsonb;
end;
$$;

revoke all on function public.before_user_created_allowlist(jsonb) from public;
grant execute on function public.before_user_created_allowlist(jsonb) to supabase_auth_admin;

alter table public.allowed_emails enable row level security;
alter table public.images enable row level security;
alter table public.folders enable row level security;
alter table public.image_folders enable row level security;
alter table public.tags enable row level security;
alter table public.image_tags enable row level security;

create policy "images_owner_access"
on public.images
for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "folders_owner_access"
on public.folders
for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "tags_owner_access"
on public.tags
for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "image_folders_owner_access"
on public.image_folders
for all
using (
  exists (
    select 1
    from public.images
    where images.id = image_folders.image_id
      and images.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.images
    where images.id = image_folders.image_id
      and images.owner_id = auth.uid()
  )
  and exists (
    select 1
    from public.folders
    where folders.id = image_folders.folder_id
      and folders.owner_id = auth.uid()
  )
);

create policy "image_tags_owner_access"
on public.image_tags
for all
using (
  exists (
    select 1
    from public.images
    where images.id = image_tags.image_id
      and images.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.images
    where images.id = image_tags.image_id
      and images.owner_id = auth.uid()
  )
  and exists (
    select 1
    from public.tags
    where tags.id = image_tags.tag_id
      and tags.owner_id = auth.uid()
  )
);
