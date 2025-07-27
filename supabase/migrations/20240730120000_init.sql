-- TestPoint Admin Supabase Schema
-- Version: 4
-- Description: This script sets up the necessary tables, policies, and a default admin user for the TestPoint Admin application.
-- It is designed to be idempotent and can be re-run safely.

--
-- Terminate all other connections to the database to avoid conflicts
--
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'postgres' AND pid <> pg_backend_pid();


--
-- Drop existing objects in reverse order of dependency
--
DROP POLICY IF EXISTS "Admins can manage tests" ON "public"."tests" CASCADE;
DROP POLICY IF EXISTS "Admins can manage user_groups" ON "public"."user_groups" CASCADE;
DROP POLICY IF EXISTS "Admins can manage groups" ON "public"."groups" CASCADE;
DROP POLICY IF EXISTS "Enable read access for own profile" ON "public"."profiles" CASCADE;
DROP POLICY IF EXISTS "Admins can manage profiles" ON "public"."profiles" CASCADE;

DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.get_groups_with_member_count() CASCADE;

DROP TABLE IF EXISTS "public"."tests" CASCADE;
DROP TABLE IF EXISTS "public"."user_groups" CASCADE;
DROP TABLE IF EXISTS "public"."groups" CASCADE;
DROP TABLE IF EXISTS "public"."profiles" CASCADE;


--
-- Create helper function to check for admin role
--
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT role = 'admin'
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


--
-- Create table for user profiles
--
CREATE TABLE "public"."profiles" (
    "id" uuid NOT NULL,
    "name" text NOT NULL,
    "email" text NOT NULL,
    "role" text NOT NULL DEFAULT 'student',
    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


--
-- Create table for groups
--
CREATE TABLE "public"."groups" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "name" text NOT NULL,
    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "public"."groups" ENABLE ROW LEVEL SECURITY;

--
-- Create join table for users and groups
--
CREATE TABLE "public"."user_groups" (
    "user_id" uuid NOT NULL,
    "group_id" uuid NOT NULL,
    CONSTRAINT "user_groups_pkey" PRIMARY KEY ("user_id", "group_id"),
    CONSTRAINT "user_groups_user_id_fkey" FOREIGN KEY (user_id) REFERENCES "public"."profiles"(id) ON DELETE CASCADE,
    CONSTRAINT "user_groups_group_id_fkey" FOREIGN KEY (group_id) REFERENCES "public"."groups"(id) ON DELETE CASCADE
);
ALTER TABLE "public"."user_groups" ENABLE ROW LEVEL SECURITY;


--
-- Create table for tests
--
CREATE TABLE "public"."tests" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "name" text NOT NULL,
    "group_id" uuid NOT NULL,
    "time_limit" integer NOT NULL,
    "question_count" integer NOT NULL,
    "date_time" timestamp with time zone NOT NULL,
    CONSTRAINT "tests_pkey" PRIMARY KEY (id),
    CONSTRAINT "tests_group_id_fkey" FOREIGN KEY (group_id) REFERENCES "public"."groups"(id) ON DELETE CASCADE
);
ALTER TABLE "public"."tests" ENABLE ROW LEVEL SECURITY;

--
-- Create RLS policies
--
CREATE POLICY "Enable read access for own profile" ON "public"."profiles"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can manage profiles" ON "public"."profiles"
AS PERMISSIVE FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admins can manage groups" ON "public"."groups"
AS PERMISSIVE FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admins can manage user_groups" ON "public"."user_groups"
AS PERMISSIVE FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admins can manage tests" ON "public"."tests"
AS PERMISSIVE FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

--
-- Create function to get groups with member counts
--
CREATE OR REPLACE FUNCTION public.get_groups_with_member_count()
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
    count(ug.user_id) as member_count
  FROM
    public.groups g
  LEFT JOIN
    public.user_groups ug ON g.id = ug.group_id
  GROUP BY
    g.id, g.name;
END;
$$ LANGUAGE plpgsql;


--
-- Create a default admin user
--
DO $$
DECLARE
  user_id uuid;
  user_email TEXT := 'rabin@ieee.org';
BEGIN
  -- Check if user already exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
    -- If user exists, delete them to recreate
    DELETE FROM auth.users WHERE email = user_email;
  END IF;

  -- Create the user in auth.users
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_token, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_sent_at)
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      user_email,
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
      NULL
    ) RETURNING id INTO user_id;

  -- Create the corresponding profile in public.profiles
  INSERT INTO public.profiles (id, name, email, role)
    VALUES (
      user_id,
      'Admin User',
      user_email,
      'admin'
    );
END;
$$ LANGUAGE plpgsql;
