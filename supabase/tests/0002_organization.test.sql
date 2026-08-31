begin;

select plan(2);

insert into auth.users (id, email)
values
  ('00000000-0000-0000-0000-000000000101', 'folder-owner@example.com'),
  ('00000000-0000-0000-0000-000000000102', 'other-owner@example.com');

insert into public.folders (id, owner_id, name, parent_id)
values
  ('00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000101', 'Root', null),
  ('00000000-0000-0000-0000-000000000112', '00000000-0000-0000-0000-000000000101', 'Child', '00000000-0000-0000-0000-000000000111'),
  ('00000000-0000-0000-0000-000000000113', '00000000-0000-0000-0000-000000000102', 'Other root', null);

select throws_ok(
  $$
    update public.folders
    set parent_id = '00000000-0000-0000-0000-000000000113'
    where id = '00000000-0000-0000-0000-000000000112'
  $$,
  '23514',
  'Folder parent must belong to the same owner.',
  'rejects a parent folder owned by someone else'
);

select throws_ok(
  $$
    update public.folders
    set parent_id = '00000000-0000-0000-0000-000000000112'
    where id = '00000000-0000-0000-0000-000000000111'
  $$,
  '23514',
  'A folder cannot be moved below its descendant.',
  'rejects a circular folder move'
);

select * from finish();

rollback;
