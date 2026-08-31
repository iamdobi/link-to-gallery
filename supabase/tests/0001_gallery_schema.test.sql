begin;

select plan(8);

select has_table('public', 'allowed_emails', 'creates the email allowlist');
select has_table('public', 'images', 'creates images');
select has_table('public', 'folders', 'creates folders');
select has_table('public', 'image_folders', 'creates image folder links');
select has_function(
  'public',
  'before_user_created_allowlist',
  array['jsonb'],
  'creates the pre-user allowlist hook'
);

select results_eq(
  $$
    select public.before_user_created_allowlist(
      jsonb_build_object('user', jsonb_build_object('email', 'blocked@example.com'))
    ) -> 'error' ->> 'http_code'
  $$,
  array['403'],
  'rejects an email outside the allowlist'
);

select results_eq(
  $$
    with owner_row as (
      insert into auth.users (id, email)
      values ('00000000-0000-0000-0000-000000000001', 'owner@example.com')
      returning id
    ),
    image_row as (
      insert into public.images (id, owner_id, original_url, url_fingerprint)
      select
        '00000000-0000-0000-0000-000000000011',
        id,
        'https://example.com/image.png',
        repeat('a', 64)
      from owner_row
      returning id, owner_id
    ),
    folder_row as (
      insert into public.folders (id, owner_id, name)
      select '00000000-0000-0000-0000-000000000021', id, 'Ideas'
      from owner_row
      returning id
    )
    insert into public.image_folders (image_id, folder_id)
    select image_row.id, folder_row.id
    from image_row cross join folder_row
    returning image_id::text
  $$,
  array['00000000-0000-0000-0000-000000000011'],
  'creates the first image folder link'
);

select throws_ok(
  $$
    insert into public.image_folders (image_id, folder_id)
    values (
      '00000000-0000-0000-0000-000000000011',
      '00000000-0000-0000-0000-000000000021'
    )
  $$,
  '23505',
  'duplicate key value violates unique constraint "image_folders_pkey"',
  'rejects a duplicate image folder link'
);

select * from finish();

rollback;
