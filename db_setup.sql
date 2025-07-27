-- Create ENUM types for roles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('admin', 'teacher', 'student');
    END IF;
END
$$;

-- PROFILES Table
-- This table stores public profile data for users.
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name VARCHAR(255),
  role user_role NOT NULL DEFAULT 'student'
);
COMMENT ON TABLE public.profiles IS 'Public profile information for each user.';

-- GROUPS Table
-- This table stores information about user groups.
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name VARCHAR(255) NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);
COMMENT ON TABLE public.groups IS 'Stores user groups for organizing tests and users.';

-- USER_GROUPS Table (Junction Table)
-- This table links users to groups.
CREATE TABLE IF NOT EXISTS public.user_groups (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, group_id)
);
COMMENT ON TABLE public.user_groups IS 'Links users to their respective groups.';

-- TESTS Table
-- This table stores information about tests.
CREATE TABLE IF NOT EXISTS public.tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name VARCHAR(255) NOT NULL,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  time_limit INT NOT NULL, -- in minutes
  question_count INT NOT NULL,
  date_time TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);
COMMENT ON TABLE public.tests IS 'Stores test configurations and schedules.';

-- Function to handle new user sign-ups
-- This function creates a profile for a new user in the public.profiles table.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (new.id, new.raw_user_meta_data->>'name', 'student'); -- Default role is 'student'
  RETURN new;
END;
$$;

-- Trigger to execute the function on new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for PROFILES table
DROP POLICY IF EXISTS "Allow authenticated users to view all profiles" ON public.profiles;
CREATE POLICY "Allow authenticated users to view all profiles"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow users to view their own profile" ON public.profiles;
CREATE POLICY "Allow users to view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
CREATE POLICY "Allow users to update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Allow admin users to manage all profiles" ON public.profiles;
CREATE POLICY "Allow admin users to manage all profiles"
  ON public.profiles FOR ALL
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- RLS Policies for GROUPS table
DROP POLICY IF EXISTS "Allow admin users to manage all groups" ON public.groups;
CREATE POLICY "Allow admin users to manage all groups"
  ON public.groups FOR ALL
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
  
DROP POLICY IF EXISTS "Allow authenticated users to view groups" ON public.groups;
CREATE POLICY "Allow authenticated users to view groups"
  ON public.groups FOR SELECT
  USING (auth.role() = 'authenticated');


-- RLS Policies for USER_GROUPS table
DROP POLICY IF EXISTS "Allow admin users to manage user_groups" ON public.user_groups;
CREATE POLICY "Allow admin users to manage user_groups"
  ON public.user_groups FOR ALL
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Allow users to view their own group memberships" ON public.user_groups;
CREATE POLICY "Allow users to view their own group memberships"
  ON public.user_groups FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for TESTS table
DROP POLICY IF EXISTS "Allow admin users to manage all tests" ON public.tests;
CREATE POLICY "Allow admin users to manage all tests"
  ON public.tests FOR ALL
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Allow authenticated users to view tests" ON public.tests;
CREATE POLICY "Allow authenticated users to view tests"
    ON public.tests FOR SELECT
    TO authenticated
    USING (true);


-- RPC function to get users with their group names
CREATE OR REPLACE FUNCTION get_users_with_groups()
RETURNS TABLE(
    id UUID,
    name VARCHAR,
    email VARCHAR,
    role user_role,
    groups JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.name,
        u.email,
        p.role,
        (SELECT json_agg(json_build_object('name', g.name))
         FROM public.user_groups ug
         JOIN public.groups g ON ug.group_id = g.id
         WHERE ug.user_id = p.id)
    FROM
        public.profiles p
    JOIN
        auth.users u ON p.id = u.id;
END;
$$ LANGUAGE plpgsql;

-- RPC function to get groups with member count
CREATE OR REPLACE FUNCTION get_groups_with_member_count()
RETURNS TABLE(
    id UUID,
    name VARCHAR,
    member_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        g.id,
        g.name,
        (SELECT COUNT(*) FROM public.user_groups ug WHERE ug.group_id = g.id) as member_count
    FROM
        public.groups g;
END;
$$ LANGUAGE plpgsql;


-- Grant usage on schema to roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- Grant permissions for tables
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.groups TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.user_groups TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.tests TO anon, authenticated, service_role;

-- Grant execute for functions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_users_with_groups() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_groups_with_member_count() TO anon, authenticated, service_role;

-- Grant permissions for sequences
GRANT ALL ON SEQUENCE public.tests_id_seq TO anon, authenticated, service_role;
GRANT ALL ON SEQUENCE public.groups_id_seq TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;

-- Don't forget to create an admin user manually and set their role to 'admin' in the profiles table.
