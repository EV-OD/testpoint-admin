-- supabase/migrations/20240730120000_init.sql

-- Drop existing objects in reverse order of creation, using CASCADE
-- to handle dependencies automatically.

-- Drop policies first (or use CASCADE on tables/functions)
-- Dropping functions/tables with CASCADE handles this, but being explicit is also an option.

-- Drop dependent functions
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS get_groups_with_member_count() CASCADE;

-- Drop tables
DROP TABLE IF EXISTS "public"."user_groups" CASCADE;
DROP TABLE IF EXISTS "public"."tests" CASCADE;
DROP TABLE IF EXISTS "public"."groups" CASCADE;
DROP TABLE IF EXISTS "public"."profiles" CASCADE;

-- 1. PROFILES TABLE
-- This table stores public user data.
create table "public"."profiles" (
    "id" uuid not null,
    "name" text not null,
    "email" text not null,
    "role" text not null default 'student'::text
);

-- Set the primary key for the profiles table.
alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index ("id");

-- Link the 'id' to the actual user in auth.users.
alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;
alter table "public"."profiles" validate constraint "profiles_id_fkey";


-- 2. GROUPS TABLE
-- This table stores user groups.
create table "public"."groups" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null
);

-- Set the primary key for the groups table.
alter table "public"."groups" add constraint "groups_pkey" PRIMARY KEY using index ("id");


-- 3. USER_GROUPS TABLE (Many-to-Many)
-- This table links users to groups.
create table "public"."user_groups" (
    "user_id" uuid not null,
    "group_id" uuid not null
);

-- Set the composite primary key.
alter table "public"."user_groups" add constraint "user_groups_pkey" PRIMARY KEY using index ("user_id", "group_id");

-- Add foreign key constraints.
alter table "public"."user_groups" add constraint "user_groups_group_id_fkey" FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE not valid;
alter table "public"."user_groups" validate constraint "user_groups_group_id_fkey";
alter table "public"."user_groups" add constraint "user_groups_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;
alter table "public"."user_groups" validate constraint "user_groups_user_id_fkey";


-- 4. TESTS TABLE
-- This table stores test information.
create table "public"."tests" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "group_id" uuid not null,
    "time_limit" integer not null,
    "question_count" integer not null,
    "date_time" timestamp with time zone not null
);

-- Set the primary key for the tests table.
alter table "public"."tests" add constraint "tests_pkey" PRIMARY KEY using index ("id");

-- Add foreign key constraint to the groups table.
alter table "public"."tests" add constraint "tests_group_id_fkey" FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE not valid;
alter table "public"."tests" validate constraint "tests_group_id_fkey";


-- 5. HELPER FUNCTION
-- is_admin() function to check if the current user is an admin.
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- get_groups_with_member_count() function
CREATE OR REPLACE FUNCTION get_groups_with_member_count()
RETURNS TABLE (
  id uuid,
  name text,
  member_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id,
    g.name,
    COUNT(ug.user_id) AS member_count
  FROM
    groups g
  LEFT JOIN
    user_groups ug ON g.id = ug.group_id
  GROUP BY
    g.id, g.name;
END;
$$ LANGUAGE plpgsql;


-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS for all tables
alter table "public"."profiles" enable row level security;
alter table "public"."groups" enable row level security;
alter table "public"."user_groups" enable row level security;
alter table "public"."tests" enable row level security;

-- PROFILES RLS
-- Let users read their own profile.
create policy "Users can view their own profile"
on "public"."profiles" for select
using ( auth.uid() = id );
-- Let admins manage all profiles.
create policy "Admins can manage profiles"
on "public"."profiles" for all
using ( is_admin() );


-- GROUPS RLS
-- Allow admins to manage all groups.
create policy "Admins can manage groups"
on "public"."groups" for all
using ( is_admin() );
-- Allow authenticated users to view all groups
create policy "Authenticated users can view groups"
on "public"."groups" for select
using ( auth.role() = 'authenticated' );


-- USER_GROUPS RLS
-- Allow admins to manage all user-group relationships.
create policy "Admins can manage user_groups"
on "public"."user_groups" for all
using ( is_admin() );
-- Allow authenticated users to view all user-group relationships
create policy "Authenticated users can view user_groups"
on "public"."user_groups" for select
using ( auth.role() = 'authenticated' );


-- TESTS RLS
-- Allow admins to manage all tests.
create policy "Admins can manage tests"
on "public"."tests" for all
using ( is_admin() );
-- Allow authenticated users to view all tests
create policy "Authenticated users can view tests"
on "public"."tests" for select
using ( auth.role() = 'authenticated' );


-- 7. SEED DATA
-- Insert a default admin user.
-- This part uses the service_role key, so it bypasses RLS.
-- It needs to be run by an admin in the Supabase dashboard or via a secure backend process.
-- The user will be created in auth.users, and the trigger will create their profile.

-- This is a placeholder for creating the user in Supabase Auth UI
-- because we can't directly insert into auth.users with a password hash from here.
-- Instead, I am inserting the profile, but you must first create the user in the
-- Supabase Authentication dashboard with the email 'rabin@ieee.org'.

-- First, ensure no old user profile exists.
DELETE FROM public.profiles WHERE email = 'rabin@ieee.org';
DELETE FROM auth.users WHERE email = 'rabin@ieee.org';

-- Create the user in auth.users
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_token, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, email_change_token_current, email_change_sent_at)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    uuid_generate_v4(),
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
    '',
    NULL
);

-- Create the corresponding profile
INSERT INTO public.profiles (id, name, email, role)
SELECT id, 'Rabin', 'rabin@ieee.org', 'admin' FROM auth.users WHERE email = 'rabin@ieee.org';
