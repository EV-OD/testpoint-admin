-- Drop existing objects to ensure a clean setup
DROP TABLE IF EXISTS public.tests CASCADE;
DROP TABLE IF EXISTS public.user_groups CASCADE;
DROP TABLE IF EXISTS public.groups CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP FUNCTION IF EXISTS public.get_users_with_groups();
DROP FUNCTION IF EXISTS public.get_groups_with_member_count();
DROP TYPE IF EXISTS public.user_role;

-- Create a custom type for user roles
CREATE TYPE public.user_role AS ENUM ('admin', 'teacher', 'student');

-- Create a table for public profiles
CREATE TABLE public.profiles (
    id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name text,
    role user_role DEFAULT 'student'::user_role
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create a table for groups
CREATE TABLE public.groups (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Create a join table for users and groups
CREATE TABLE public.user_groups (
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, group_id)
);
ALTER TABLE public.user_groups ENABLE ROW LEVEL SECURITY;

-- Create a table for tests
CREATE TABLE public.tests (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE,
    time_limit integer NOT NULL,
    question_count integer NOT NULL,
    date_time timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- RLS Policies for groups
CREATE POLICY "Groups are viewable by admins and members." ON public.groups FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' OR
  id IN (SELECT group_id FROM public.user_groups WHERE user_id = auth.uid())
);
CREATE POLICY "Admins can manage all groups" ON public.groups FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- RLS Policies for user_groups
CREATE POLICY "User group relations are viewable by admins and members." ON public.user_groups FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' OR
  user_id = auth.uid()
);
CREATE POLICY "Admins can manage user-group relations" ON public.user_groups FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- RLS Policies for tests
CREATE POLICY "Tests are viewable by admins and assigned group members." ON public.tests FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' OR
  group_id IN (SELECT group_id FROM public.user_groups WHERE user_id = auth.uid())
);
CREATE POLICY "Admins can manage all tests" ON public.tests FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Function to get users with their group memberships
CREATE OR REPLACE FUNCTION public.get_users_with_groups()
RETURNS TABLE(id uuid, name text, email text, role user_role, groups json)
LANGUAGE sql
SECURITY DEFINER
AS $$
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
$$;

-- Function to get groups with their member count
CREATE OR REPLACE FUNCTION public.get_groups_with_member_count()
RETURNS TABLE(id uuid, name text, member_count bigint)
LANGUAGE sql
AS $$
    SELECT
        g.id,
        g.name,
        (SELECT count(*) FROM public.user_groups ug WHERE ug.group_id = g.id) as member_count
    FROM
        public.groups g;
$$;

