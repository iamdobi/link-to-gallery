create or replace function public.validate_folder_parent()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  parent_owner_id uuid;
begin
  if new.parent_id is null then
    return new;
  end if;

  select owner_id
  into parent_owner_id
  from public.folders
  where id = new.parent_id;

  if parent_owner_id is not null and parent_owner_id <> new.owner_id then
    raise exception 'Folder parent must belong to the same owner.' using errcode = '23514';
  end if;

  if exists (
    with recursive ancestors(id, parent_id, path) as (
      select id, parent_id, array[id]
      from public.folders
      where id = new.parent_id

      union all

      select folder.id, folder.parent_id, ancestors.path || folder.id
      from public.folders as folder
      join ancestors on folder.id = ancestors.parent_id
      where not folder.id = any(ancestors.path)
    )
    select 1
    from ancestors
    where id = new.id
  ) then
    raise exception 'A folder cannot be moved below its descendant.' using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger folders_validate_parent
before insert or update of owner_id, parent_id on public.folders
for each row execute function public.validate_folder_parent();
