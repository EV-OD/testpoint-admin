
-- Drop existing objects to ensure a clean setup
DROP FUNCTION IF EXISTS public.get_groups_with_member_count();
DROP FUNCTION IF EXISTS public.get_users_with_groups();
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP TABLE IF EXISTS public.tests;
DROP TABLE IF EXISTS public.user_groups;
DROP TABLE IF EXISTS public.groups;
DROP TABLE IF EXISTS public.profiles;

-- Create profiles table
CREATE TABLE public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name character varying NOT NULL,
  role character varying NOT NULL DEFAULT 'student'::character varying
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create groups table
CREATE TABLE public.groups (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name character varying NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Create user_groups junction table
CREATE TABLE public.user_groups (
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, group_id)
);
ALTER TABLE public.user_groups ENABLE ROW LEVEL SECURITY;

-- Create tests table
CREATE TABLE public.tests (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name character varying NOT NULL,
    group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    time_limit integer NOT NULL,
    question_count integer NOT NULL,
    date_time timestamp with time zone NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;

--
-- RLS POLICIES
--

-- Profiles table policies
CREATE POLICY "Allow authenticated users to view profiles" ON "public"."profiles"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow admin users to manage profiles" ON "public"."profiles"
AS PERMISSIVE FOR ALL
TO authenticated
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Groups table policies
CREATE POLICY "Allow authenticated users to view groups" ON "public"."groups"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow admin users to manage groups" ON "public"."groups"
AS PERMISSIVE FOR ALL
TO authenticated
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- User_groups table policies
CREATE POLICY "Allow authenticated users to view their own group memberships" ON "public"."user_groups"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow admin users to manage group memberships" ON "public"."user_groups"
AS PERMISSIVE FOR ALL
TO authenticated
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');


-- Tests table policies
CREATE POLICY "Allow authenticated users to view tests" ON "public"."tests"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow admin users to manage tests" ON "public"."tests"
AS PERMISSIVE FOR ALL
TO authenticated
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');


--
-- FUNCTIONS and TRIGGERS
--

-- Function to create a profile for a new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (new.id, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'role');
  RETURN new;
END;
$$;

-- Trigger to handle new user creation
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();


-- Function to get users with their group names
CREATE OR REPLACE FUNCTION public.get_users_with_groups()
RETURNS TABLE(id uuid, name character varying, email character varying, role character varying, groups json)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    u.email,
    p.role,
    COALESCE(
      (
        SELECT json_agg(json_build_object('name', g.name))
        FROM public.groups g
        JOIN public.user_groups ug ON g.id = ug.group_id
        WHERE ug.user_id = p.id
      ),
      '[]'::json
    ) AS groups
  FROM
    public.profiles p
  JOIN
    auth.users u ON p.id = u.id;
END;
$$;


-- Function to get groups with member count
CREATE OR REPLACE FUNCTION public.get_groups_with_member_count()
RETURNS TABLE(id uuid, name character varying, member_count bigint)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id,
    g.name,
    (SELECT count(*) FROM public.user_groups ug WHERE ug.group_id = g.id) AS member_count
  FROM
    public.groups g;
END;
$$;
