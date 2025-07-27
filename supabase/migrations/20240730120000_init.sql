
-- Drop existing objects to ensure a clean slate
drop policy if exists "Enable all for service_role" on "public"."profiles";
drop policy if exists "Enable insert for authenticated users only" on "public"."profiles";
drop policy if exists "Enable read access for own user" on "public"."profiles";
drop policy if exists "Enable update for own user" on "public"."profiles";
drop policy if exists "Enable all for admin" on "public"."groups";
drop policy if exists "Enable read for all users" on "public"."groups";
drop policy if exists "Enable all for admin" on "public"."user_groups";
drop policy if exists "Enable read for all users" on "public"."user_groups";
drop policy if exists "Enable all for admin" on "public"."tests";
drop policy if exists "Enable read for all users" on "public"."tests";

drop function if exists is_admin();
drop function if exists get_groups_with_member_count();

drop table if exists "public"."tests" cascade;
drop table if exists "public"."user_groups" cascade;
drop table if exists "public"."groups" cascade;
drop table if exists "public"."profiles" cascade;

-- Table: profiles
create table "public"."profiles" (
    "id" uuid not null,
    "name" text not null,
    "email" text not null,
    "role" text not null default 'student'::text,
    primary key (id),
    constraint "profiles_id_fkey" foreign key ("id") references "auth"."users" ("id") on delete cascade
);

-- Table: groups
create table "public"."groups" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    primary key (id)
);

-- Table: user_groups
create table "public"."user_groups" (
    "user_id" uuid not null,
    "group_id" uuid not null,
    primary key (user_id, group_id),
    constraint "user_groups_user_id_fkey" foreign key ("user_id") references "public"."profiles" ("id") on delete cascade,
    constraint "user_groups_group_id_fkey" foreign key ("group_id") references "public"."groups" ("id") on delete cascade
);

-- Table: tests
create table "public"."tests" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "group_id" uuid not null,
    "time_limit" integer not null,
    "question_count" integer not null,
    "date_time" timestamp with time zone not null,
    primary key (id),
    constraint "tests_group_id_fkey" foreign key ("group_id") references "public"."groups" ("id") on delete cascade
);

-- Function: is_admin
create function is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
    select exists (
        select 1 from profiles
        where id = auth.uid() and role = 'admin'
    );
$$;

-- Function: get_groups_with_member_count
create function get_groups_with_member_count()
returns table(id uuid, name text, member_count bigint)
language sql
as $$
    select
        g.id,
        g.name,
        count(ug.user_id) as member_count
    from
        groups g
    left join
        user_groups ug on g.id = ug.group_id
    group by
        g.id, g.name;
$$;


-- RLS Policies for: profiles
create policy "Enable all for service_role" on "public"."profiles" for all to service_role;
create policy "Enable read access for own user" on "public"."profiles" for select using (auth.uid() = id);
create policy "Enable update for own user" on "public"."profiles" for update using (auth.uid() = id);

-- RLS Policies for: groups
create policy "Enable all for admin" on "public"."groups" for all using (is_admin());
create policy "Enable read for all users" on "public"."groups" for select using (true);

-- RLS Policies for: user_groups
create policy "Enable all for admin" on "public"."user_groups" for all using (is_admin());
create policy "Enable read for all users" on "public"."user_groups" for select using (true);

-- RLS Policies for: tests
create policy "Enable all for admin" on "public"."tests" for all using (is_admin());
create policy "Enable read for all users" on "public"."tests" for select using (true);


-- Seed Data: Create admin user
DO $$
DECLARE
  admin_email TEXT := 'rabin@ieee.org';
  admin_password TEXT := '12345678';
  admin_user_id UUID;
BEGIN
  -- Check if user exists and delete them to ensure idempotency
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = admin_email) THEN
    -- We need to use the service_role key to delete a user, which we can't do directly here.
    -- The best practice for a migration script is to inform the user.
    -- However, for this context, we will simply ignore if the user exists and try to insert.
    -- A proper teardown would require API calls. The `auth.users` insert will fail if the user exists,
    // but the rest of the script will have run.
  END IF;

  -- Create the user in auth.users
  admin_user_id := auth.uid() FROM (
    SELECT * FROM auth.users WHERE email = admin_email
  );

  IF admin_user_id IS NULL THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_token, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_sent_at, confirmed_at)
    VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        admin_email,
        crypt(admin_password, gen_salt('bf')),
        now(),
        '',
        null,
        null,
        '{"provider":"email","providers":["email"]}',
        '{}',
        now(),
        now(),
        '',
        '',
        null,
        now()
    ) RETURNING id INTO admin_user_id;
  END IF;

  -- Create the corresponding profile
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (admin_user_id, 'Admin User', admin_email, 'admin')
  ON CONFLICT (id) DO NOTHING;

END $$;
