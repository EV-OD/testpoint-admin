-- Drop existing objects in reverse order of dependency
DROP POLICY IF EXISTS "Enable all actions for admin" ON "public"."tests";
DROP POLICY IF EXISTS "Enable all actions for admin" ON "public"."user_groups";
DROP POLICY IF EXISTS "Enable all actions for admin" ON "public"."groups";
DROP POLICY IF EXISTS "Users can view their own profile" ON "public"."profiles";
DROP POLICY IF EXISTS "Admins can manage profiles" ON "public"."profiles";
DROP FUNCTION IF EXISTS is_admin();
DROP TABLE IF EXISTS "public"."user_groups";
DROP TABLE IF EXISTS "public"."tests";
DROP TABLE IF EXISTS "public"."groups";
DROP TABLE IF EXISTS "public"."profiles";

-- Create is_admin function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create tables
CREATE TABLE "public"."profiles" (
    "id" uuid NOT NULL,
    "name" character varying NOT NULL,
    "email" character varying NOT NULL,
    "role" character varying NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE
);

CREATE TABLE "public"."groups" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "name" character varying NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE "public"."tests" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "name" character varying NOT NULL,
    "group_id" uuid NOT NULL,
    "time_limit" integer NOT NULL,
    "question_count" integer NOT NULL,
    "date_time" timestamp with time zone NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT tests_group_id_fkey FOREIGN KEY (group_id) REFERENCES groups (id)
);

CREATE TABLE "public"."user_groups" (
    "user_id" uuid NOT NULL,
    "group_id" uuid NOT NULL,
    PRIMARY KEY (user_id, group_id),
    CONSTRAINT user_groups_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles (id) ON DELETE CASCADE,
    CONSTRAINT user_groups_group_id_fkey FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."groups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_groups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."tests" ENABLE ROW LEVEL SECURITY;


-- Create Policies
CREATE POLICY "Users can view their own profile" ON "public"."profiles"
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can manage profiles" ON "public"."profiles"
FOR ALL USING (is_admin());

CREATE POLICY "Enable all actions for admin" ON "public"."groups"
FOR ALL USING (is_admin());

CREATE POLICY "Enable all actions for admin" ON "public"."user_groups"
FOR ALL USING (is_admin());

CREATE POLICY "Enable all actions for admin" ON "public"."tests"
FOR ALL USING (is_admin());

-- Function to get groups with member count
CREATE OR REPLACE FUNCTION get_groups_with_member_count()
RETURNS TABLE(id uuid, name character varying, member_count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id,
    g.name,
    COUNT(ug.user_id) as member_count
  FROM
    groups g
  LEFT JOIN
    user_groups ug ON g.id = ug.group_id
  GROUP BY
    g.id, g.name;
END;
$$ LANGUAGE plpgsql;

-- Create a default admin user
DO $$
DECLARE
  user_id uuid;
  user_email TEXT := 'rabin@ieee.org';
BEGIN
  -- Delete existing user if they exist in auth.users
  DELETE FROM auth.users WHERE email = user_email;

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
    '{"role":"admin"}',
    now(),
    now(),
    '',
    '',
    NULL
  ) RETURNING id INTO user_id;

  -- Create the profile in public.profiles
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (user_id, 'Admin User', user_email, 'admin');
END $$;
