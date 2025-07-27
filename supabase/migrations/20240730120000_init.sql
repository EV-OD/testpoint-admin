
-- Drop existing objects in reverse order of dependency
DROP POLICY IF EXISTS "Admins can manage tests" ON "public"."tests" CASCADE;
DROP POLICY IF EXISTS "Admins can manage user_groups" ON "public"."user_groups" CASCADE;
DROP POLICY IF EXISTS "Admins can manage groups" ON "public"."groups" CASCADE;
DROP POLICY IF EXISTS "Users can view their own profile" ON "public"."profiles" CASCADE;
DROP POLICY IF EXISTS "Admins can manage profiles" ON "public"."profiles" CASCADE;
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."profiles" CASCADE;


DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP TABLE IF EXISTS "public"."user_groups" CASCADE;
DROP TABLE IF EXISTS "public"."tests" CASCADE;
DROP TABLE IF EXISTS "public"."groups" CASCADE;
DROP TABLE IF EXISTS "public"."profiles" CASCADE;

-- Create is_admin function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT role = 'admin'
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create profiles table
CREATE TABLE "public"."profiles" (
    "id" uuid NOT NULL,
    "name" text NOT NULL,
    "email" text NOT NULL,
    "role" text NOT NULL,
    PRIMARY KEY ("id"),
    CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE
);
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

-- Create groups table
CREATE TABLE "public"."groups" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "name" text NOT NULL,
    PRIMARY KEY ("id")
);
ALTER TABLE "public"."groups" ENABLE ROW LEVEL SECURITY;

-- Create user_groups table
CREATE TABLE "public"."user_groups" (
    "user_id" uuid NOT NULL,
    "group_id" uuid NOT NULL,
    PRIMARY KEY ("user_id", "group_id"),
    CONSTRAINT "user_groups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    CONSTRAINT "user_groups_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE
);
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
    CONSTRAINT "tests_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE
);
ALTER TABLE "public"."tests" ENABLE ROW LEVEL SECURITY;

-- Create get_groups_with_member_count function
CREATE OR REPLACE FUNCTION get_groups_with_member_count()
RETURNS TABLE(id uuid, name text, member_count bigint) AS $$
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

-- Policies for profiles
CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can manage profiles" ON "public"."profiles" FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Policies for groups
CREATE POLICY "Admins can manage groups" ON "public"."groups" FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Policies for user_groups
CREATE POLICY "Admins can manage user_groups" ON "public"."user_groups" FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Policies for tests
CREATE POLICY "Admins can manage tests" ON "public"."tests" FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Function to create a new user and their profile
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name', NEW.email, NEW.raw_user_meta_data->>'role');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function after a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_user_profile();

-- Seed an admin user
DO $$
DECLARE
  user_id uuid;
BEGIN
  -- Create the user in auth.users
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_token, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_sent_at)
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
    '{"name":"Rabin Admin","role":"admin"}',
    now(),
    now(),
    '',
    '',
    NULL
  ) RETURNING id INTO user_id;

  -- The trigger will automatically create the profile.
  -- No need to insert into public.profiles here.
END $$;
