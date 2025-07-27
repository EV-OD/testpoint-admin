-- Drop existing objects to ensure a clean slate
drop function if exists is_admin();
drop function if exists get_groups_with_member_count();
drop table if exists "public"."user_groups" cascade;
drop table if exists "public"."tests" cascade;
drop table if exists "public"."groups" cascade;
drop table if exists "public"."profiles" cascade;
drop type if exists "public"."user_role" cascade;


-- Create a custom type for user roles
create type "public"."user_role" as enum ('admin', 'teacher', 'student');

-- Create the tables
create table "public"."profiles" (
    "id" uuid not null primary key,
    "name" text not null,
    "email" text not null,
    "role" user_role not null
);

create table "public"."groups" (
    "id" uuid not null default gen_random_uuid() primary key,
    "name" text not null
);

create table "public"."tests" (
    "id" uuid not null default gen_random_uuid() primary key,
    "name" text not null,
    "group_id" uuid not null,
    "time_limit" integer not null,
    "question_count" integer not null,
    "date_time" timestamp with time zone not null
);

create table "public"."user_groups" (
    "user_id" uuid not null,
    "group_id" uuid not null,
    primary key (user_id, group_id)
);


-- Set up foreign key constraints
alter table "public"."profiles" add constraint "profiles_id_fkey" foreign key ("id") references "auth"."users"("id") on update cascade on delete cascade;
alter table "public"."tests" add constraint "tests_group_id_fkey" foreign key (group_id) references "public"."groups"(id) on delete cascade;
alter table "public"."user_groups" add constraint "user_groups_group_id_fkey" foreign key (group_id) references "public"."groups"(id) on delete cascade;
alter table "public"."user_groups" add constraint "user_groups_user_id_fkey" foreign key (user_id) references "public"."profiles"(id) on delete cascade;


-- Security policies
alter table "public"."profiles" enable row level security;
alter table "public"."groups" enable row level security;
alter table "public"."tests" enable row level security;
alter table "public"."user_groups" enable row level security;


-- Helper function to check for admin role
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
    select exists(
        select 1 from profiles
        where profiles.id = auth.uid() and profiles.role = 'admin'
    );
$$;

-- Policies for 'profiles' table
create policy "Allow all access for admins" on "public"."profiles" for all using (is_admin()) with check (is_admin());
create policy "Allow users to view their own profile" on "public"."profiles" for select using ((select auth.uid()) = id);
create policy "Allow users to update their own profile" on "public"."profiles" for update using ((select auth.uid()) = id) with check (id = (select auth.uid()));

-- Policies for 'groups' table
create policy "Allow all access for admins" on "public"."groups" for all using (is_admin()) with check (is_admin());
create policy "Allow teachers to view groups" on "public"."groups" for select using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'teacher'));

-- Policies for 'tests' table
create policy "Allow all access for admins" on "public"."tests" for all using (is_admin()) with check (is_admin());
create policy "Allow teachers to view tests" on "public"."tests" for select using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'teacher'));

-- Policies for 'user_groups' table
create policy "Allow all access for admins" on "public"."user_groups" for all using (is_admin()) with check (is_admin());
create policy "Allow teachers to view user_groups" on "public"."user_groups" for select using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'teacher'));


-- Function to get groups with member count
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


-- Create a default admin user
-- NOTE: This requires the "supabase/auth-admin" extension.
-- If you get an error, ensure it's enabled in your Supabase project.
DO $$
DECLARE
    user_id uuid;
BEGIN
    -- Insert the user into auth.users
    user_id := auth.uid FROM auth.users WHERE email = 'rabin@ieee.org';
    IF user_id IS NULL THEN
      INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_token, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token_encrypted)
      VALUES (
          '00000000-0000-0000-0000-000000000000',
          gen_random_uuid(),
          'authenticated',
          'authenticated',
          'rabin@ieee.org',
          crypt('12345678', gen_salt('bf')),
          now(),
          '',
          NULL,
          NULL,
          '{"provider":"email","providers":["email"]}',
          '{}',
          now(),
          now(),
          '',
          '',
          '',
          ''
      ) RETURNING id INTO user_id;
    END IF;

    -- Insert the profile with the 'admin' role
    INSERT INTO public.profiles (id, name, email, role)
    VALUES (user_id, 'Rabin Admin', 'rabin@ieee.org', 'admin')
    ON CONFLICT (id) DO NOTHING;
END $$;
