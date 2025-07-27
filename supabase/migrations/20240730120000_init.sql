-- Drop existing objects to ensure a clean setup
DROP TABLE IF EXISTS "public"."user_groups" CASCADE;
DROP TABLE IF EXISTS "public"."tests" CASCADE;
DROP TABLE IF EXISTS "public"."groups" CASCADE;
DROP TABLE IF EXISTS "public"."profiles" CASCADE;
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS get_groups_with_member_count();

-- types
create type "public"."user_role" as enum ('admin', 'teacher', 'student');

-- `profiles` table
create table "public"."profiles" (
    "id" uuid not null,
    "name" text not null,
    "email" text not null,
    "role" user_role not null
);
alter table "public"."profiles" enable row level security;
alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index on "profiles" ("id");
alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;
alter table "public"."profiles" validate constraint "profiles_id_fkey";

-- `groups` table
create table "public"."groups" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null
);
alter table "public"."groups" enable row level security;
alter table "public"."groups" add constraint "groups_pkey" PRIMARY KEY using index on "groups" ("id");

-- `user_groups` table
create table "public"."user_groups" (
    "user_id" uuid not null,
    "group_id" uuid not null
);
alter table "public"."user_groups" enable row level security;
alter table "public"."user_groups" add constraint "user_groups_pkey" PRIMARY KEY using index on "user_groups" ("user_id", "group_id");
alter table "public"."user_groups" add constraint "user_groups_group_id_fkey" FOREIGN KEY (group_id) REFERENCES groups(id) not valid;
alter table "public"."user_groups" validate constraint "user_groups_group_id_fkey";
alter table "public"."user_groups" add constraint "user_groups_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) not valid;
alter table "public"."user_groups" validate constraint "user_groups_user_id_fkey";

-- `tests` table
create table "public"."tests" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "group_id" uuid not null,
    "time_limit" integer not null,
    "question_count" integer not null,
    "date_time" timestamp with time zone not null
);
alter table "public"."tests" enable row level security;
alter table "public"."tests" add constraint "tests_pkey" PRIMARY KEY using index on "tests" ("id");
alter table "public"."tests" add constraint "tests_group_id_fkey" FOREIGN KEY (group_id) REFERENCES groups(id) not valid;
alter table "public"."tests" validate constraint "tests_group_id_fkey";

-- Helper function to check for admin role
create function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
    select exists(
        select 1 from profiles where id = auth.uid() and role = 'admin'
    );
$$;

-- Function to get groups with member count
CREATE OR REPLACE FUNCTION public.get_groups_with_member_count()
RETURNS TABLE(id uuid, name text, member_count bigint) AS $$
BEGIN
    RETURN QUERY
    SELECT
        g.id,
        g.name,
        COUNT(ug.user_id) as member_count
    FROM
        public.groups g
    LEFT JOIN
        public.user_groups ug ON g.id = ug.group_id
    GROUP BY
        g.id, g.name;
END;
$$ LANGUAGE plpgsql;

-- Policies for `profiles`
CREATE POLICY "Allow authenticated users to read their own profile" ON "public"."profiles"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Allow admin to manage profiles" ON "public"."profiles"
AS PERMISSIVE FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Policies for `groups`
CREATE POLICY "Allow admin to manage groups" ON "public"."groups"
AS PERMISSIVE FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Policies for `user_groups`
CREATE POLICY "Allow admin to manage user_groups" ON "public"."user_groups"
AS PERMISSIVE FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Policies for `tests`
CREATE POLICY "Allow admin to manage tests" ON "public"."tests"
AS PERMISSIVE FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Seed a default admin user
WITH new_user AS (
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_token, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_sent_at, confirmed_at)
  VALUES ('00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated', 'rabin@ieee.org', crypt('12345678', gen_salt('bf')), NOW(), '', NULL, NULL, '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', NULL, NULL)
  ON CONFLICT (email) DO NOTHING
  RETURNING id
)
INSERT INTO public.profiles (id, name, email, role)
SELECT id, 'Rabin Admin', 'rabin@ieee.org', 'admin'
FROM new_user
ON CONFLICT (id) DO NOTHING;
