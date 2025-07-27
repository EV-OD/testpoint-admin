-- Drop existing objects to ensure a clean slate
DROP FUNCTION IF EXISTS is_admin;
DROP FUNCTION IF EXISTS get_groups_with_member_count;
DROP TABLE IF EXISTS public.user_groups CASCADE;
DROP TABLE IF EXISTS public.tests CASCADE;
DROP TABLE IF EXISTS public.groups CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Create profiles table
CREATE TABLE public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name character varying,
    email character varying,
    role character varying
);

-- Create groups table
CREATE TABLE public.groups (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    name character varying NOT NULL
);

-- Create user_groups junction table
CREATE TABLE public.user_groups (
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, group_id)
);

-- Create tests table
CREATE TABLE public.tests (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    name character varying,
    group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL,
    time_limit integer,
    question_count integer,
    date_time timestamp with time zone
);

-- is_admin function
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = user_id AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;


-- get_groups_with_member_count function
CREATE OR REPLACE FUNCTION get_groups_with_member_count()
RETURNS TABLE(id uuid, name character varying, member_count bigint) AS $$
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


-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;


-- Policies for profiles
CREATE POLICY "Enable read access for user based on id" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users based on id" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable delete for service_role only" ON public.profiles
  FOR DELETE USING (auth.role() = 'service_role');


-- Policies for groups
CREATE POLICY "Enable read access for admins" ON public.groups
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Enable insert for admins" ON public.groups
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Enable update for admins" ON public.groups
  FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Enable delete for admins" ON public.groups
  FOR DELETE USING (is_admin(auth.uid()));


-- Policies for user_groups
CREATE POLICY "Enable read access for admins" ON public.user_groups
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Enable insert for admins" ON public.user_groups
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Enable update for admins" ON public.user_groups
  FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Enable delete for admins" ON public.user_groups
  FOR DELETE USING (is_admin(auth.uid()));


-- Policies for tests
CREATE POLICY "Enable read access for admins" ON public.tests
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Enable insert for admins" ON public.tests
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Enable update for admins" ON public.tests
  FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Enable delete for admins" ON public.tests
  FOR DELETE USING (is_admin(auth.uid()));
