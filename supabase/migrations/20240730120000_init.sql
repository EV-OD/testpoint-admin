-- Drop existing objects in reverse order of creation, using CASCADE to handle dependencies.
DROP POLICY IF EXISTS "Admins can manage tests" ON "public"."tests" CASCADE;
DROP POLICY IF EXISTS "Admins can manage user_groups" ON "public"."user_groups" CASCADE;
DROP POLICY IF EXISTS "Admins can manage groups" ON "public"."groups" CASCADE;
DROP POLICY IF EXISTS "Users can view their own profile" ON "public"."profiles" CASCADE;
DROP POLICY IF EXISTS "Admins can manage profiles" ON "public"."profiles" CASCADE;

DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS get_groups_with_member_count() CASCADE;

DROP TABLE IF EXISTS "public"."user_groups" CASCADE;
DROP TABLE IF EXISTS "public"."tests" CASCADE;
DROP TABLE IF EXISTS "public"."groups" CASCADE;
DROP TABLE IF EXISTS "public"."profiles" CASCADE;

-- Create profiles table
CREATE TABLE "public"."profiles" (
    "id" uuid NOT NULL,
    "name" text NOT NULL,
    "email" text NOT NULL,
    "role" text NOT NULL DEFAULT 'student'::text,
    PRIMARY KEY ("id"),
    CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users" ("id") ON DELETE CASCADE
);
ALTER TABLE "public"."profiles" OWNER TO "postgres";
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

-- Create groups table
CREATE TABLE "public"."groups" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "name" text NOT NULL,
    PRIMARY KEY ("id")
);
ALTER TABLE "public"."groups" OWNER TO "postgres";
ALTER TABLE "public"."groups" ENABLE ROW LEVEL SECURITY;

-- Create user_groups join table
CREATE TABLE "public"."user_groups" (
    "user_id" uuid NOT NULL,
    "group_id" uuid NOT NULL,
    PRIMARY KEY ("user_id", "group_id"),
    CONSTRAINT "user_groups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles" ("id") ON DELETE CASCADE,
    CONSTRAINT "user_groups_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups" ("id") ON DELETE CASCADE
);
ALTER TABLE "public"."user_groups" OWNER TO "postgres";
ALTER TABLE "public"."user_groups" ENABLE ROW LEVEL SECURITY;

-- Create tests table
CREATE TABLE "public"."tests" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "name" text NOT NULL,
    "group_id" uuid NOT NULL,
    "time_limit" integer NOT NULL,
    "question_count" integer NOT NULL,
    "date_time" timestamp with time zone NOT NULL,
    PRIMARY KEY ("id"),
    CONSTRAINT "tests_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups" ("id") ON DELETE CASCADE
);
ALTER TABLE "public"."tests" OWNER TO "postgres";
ALTER TABLE "public"."tests" ENABLE ROW LEVEL SECURITY;


-- Function to check if the current user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
$$;

-- Function to get groups with their member counts
CREATE OR REPLACE FUNCTION get_groups_with_member_count()
RETURNS TABLE(id uuid, name text, member_count bigint)
LANGUAGE sql
AS $$
    SELECT
        g.id,
        g.name,
        count(ug.user_id) as member_count
    FROM
        groups g
    LEFT JOIN
        user_groups ug ON g.id = ug.group_id
    GROUP BY
        g.id;
$$;


-- RLS Policies
CREATE POLICY "Users can view their own profile" ON "public"."profiles"
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

-- Create default admin user
DO $$
DECLARE
  user_id uuid;
  user_email text := 'rabin@ieee.org';
BEGIN
  -- Check if user already exists
  SELECT id INTO user_id FROM auth.users WHERE email = user_email;

  -- If user does not exist, create them
  IF user_id IS NULL THEN
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
      '{"role":"admin"}',
      now(),
      now(),
      '',
      '',
      NULL
    ) RETURNING id INTO user_id;

    -- Create a profile for the new user
    INSERT INTO public.profiles (id, name, email, role)
    VALUES (user_id, 'Admin User', user_email, 'admin');
  ELSE
    -- If user exists, ensure their profile is correct
    UPDATE public.profiles
    SET role = 'admin', name = 'Admin User'
    WHERE id = user_id;
  END IF;
END $$;
