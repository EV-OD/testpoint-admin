-- Drop existing objects if they exist
DROP FUNCTION IF EXISTS public.get_groups_with_member_count();
DROP FUNCTION IF EXISTS public.get_users_with_groups();
DROP TABLE IF EXISTS public.user_groups;
DROP TABLE IF EXISTS public.tests;
DROP TABLE IF EXISTS public.groups;
DROP TABLE IF EXISTS public.profiles;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--
CREATE TYPE public.user_role AS ENUM (
    'admin',
    'teacher',
    'student'
);

--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--
CREATE TABLE public.profiles (
    id uuid NOT NULL,
    name character varying NOT NULL,
    role public.user_role DEFAULT 'student'::public.user_role NOT NULL
);

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

--
-- Name: groups; Type: TABLE; Schema: public; Owner: -
--
CREATE TABLE public.groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL
);

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);

--
-- Name: tests; Type: TABLE; Schema: public; Owner: -
--
CREATE TABLE public.tests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    group_id uuid NOT NULL,
    time_limit integer NOT NULL,
    question_count integer NOT NULL,
    date_time timestamp with time zone NOT NULL
);

ALTER TABLE ONLY public.tests
    ADD CONSTRAINT tests_pkey PRIMARY KEY (id);
    
ALTER TABLE ONLY public.tests
    ADD CONSTRAINT tests_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;

--
-- Name: user_groups; Type: TABLE; Schema: public; Owner: -
--
CREATE TABLE public.user_groups (
    user_id uuid NOT NULL,
    group_id uuid NOT NULL
);

ALTER TABLE ONLY public.user_groups
    ADD CONSTRAINT user_groups_pkey PRIMARY KEY (user_id, group_id);

ALTER TABLE ONLY public.user_groups
    ADD CONSTRAINT user_groups_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.user_groups
    ADD CONSTRAINT user_groups_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

--
-- Functions
--

CREATE FUNCTION public.get_groups_with_member_count() RETURNS TABLE(id uuid, name character varying, member_count bigint)
    LANGUAGE sql SECURITY DEFINER
    AS $$
    select
      g.id,
      g.name,
      count(ug.user_id) as member_count
    from
      public.groups g
      left join public.user_groups ug on g.id = ug.group_id
    group by
      g.id,
      g.name
    order by
      g.name;
$$;


CREATE FUNCTION public.get_users_with_groups() RETURNS TABLE(id uuid, name character varying, email character varying, role public.user_role, groups json)
    LANGUAGE sql SECURITY DEFINER
    AS $$
    select
      p.id,
      p.name,
      u.email,
      p.role,
      json_agg(
        json_build_object(
          'id', g.id,
          'name', g.name
        )
      ) filter (where g.id is not null) as groups
    from
      public.profiles p
      join auth.users u on p.id = u.id
      left join public.user_groups ug on p.id = ug.user_id
      left join public.groups g on ug.group_id = g.id
    group by
      p.id,
      u.email
    order by
      p.name;
$$;


--
-- RLS Policies
--

-- Allow users to view their own profile
alter table public.profiles enable row level security;
create policy "Users can view their own profile" on public.profiles for select using (auth.uid() = id);

-- Allow admins to view all profiles
create policy "Admins can view all profiles" on public.profiles for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Allow admins to update any profile
create policy "Admins can update any profile" on public.profiles for update using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')) with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Allow admins to manage groups
alter table public.groups enable row level security;
create policy "Admins can manage groups" on public.groups for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "Authenticated users can view groups" on public.groups for select to authenticated using (true);


-- Allow admins to manage user_groups
alter table public.user_groups enable row level security;
create policy "Admins can manage user_groups" on public.user_groups for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "Authenticated users can view user_groups" on public.user_groups for select to authenticated using (true);

-- Allow admins to manage tests
alter table public.tests enable row level security;
create policy "Admins can manage tests" on public.tests for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "Authenticated users can view tests" on public.tests for select to authenticated using (true);
