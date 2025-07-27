
-- Drop existing objects to ensure a clean slate
DROP TABLE IF EXISTS public.user_groups CASCADE;
DROP TABLE IF EXISTS public.tests CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.groups CASCADE;

DROP FUNCTION IF EXISTS public.get_groups_with_member_count();
DROP FUNCTION IF EXISTS public.get_users_with_groups();
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;


-- USERS & PROFILES
-- Create a table for public profiles
create table profiles (
  id uuid not null references auth.users on delete cascade,
  name text,
  role text default 'student'::text,
  primary key (id)
);
alter table profiles enable row level security;

-- Add row level security for profiles table
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile." on profiles for update using (auth.uid() = id);
create policy "Admins can manage any profile" on profiles for all using ( (select auth.uid() in (select id from profiles where role = 'admin')));


-- This trigger automatically creates a profile for new users.
create function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, name, role)
  values (new.id, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'role');
  return new;
end;
$$ language plpgsql security definer;

-- Create a trigger to automatically create a profile when a new user signs up
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- GROUPS
create table groups (
  id uuid not null default gen_random_uuid(),
  name text not null,
  primary key (id)
);
alter table groups enable row level security;
create policy "Groups are viewable by authenticated users." on groups for select using (auth.role() = 'authenticated');
create policy "Admins can manage groups." on groups for all using ( (select auth.uid() in (select id from profiles where role = 'admin')));

-- USER_GROUPS (join table)
create table user_groups (
  user_id uuid not null references public.profiles on delete cascade,
  group_id uuid not null references public.groups on delete cascade,
  primary key (user_id, group_id)
);
alter table user_groups enable row level security;
create policy "User group relationships are viewable by authenticated users" on user_groups for select using (auth.role() = 'authenticated');
create policy "Admins can manage user-group relationships" on user_groups for all using ( (select auth.uid() in (select id from profiles where role = 'admin')));


-- TESTS
create table tests (
  id uuid not null default gen_random_uuid(),
  name text not null,
  group_id uuid not null references public.groups on delete cascade,
  time_limit integer not null,
  question_count integer not null,
  date_time timestamptz not null,
  primary key (id)
);
alter table tests enable row level security;
create policy "Tests are viewable by authenticated users." on tests for select using (auth.role() = 'authenticated');
create policy "Admins can manage tests." on tests for all using ( (select auth.uid() in (select id from profiles where role = 'admin')));

-- RPC FUNCTIONS
create function get_groups_with_member_count()
returns table(id uuid, name text, member_count bigint) as $$
begin
  return query
  select g.id, g.name, count(ug.user_id) as member_count
  from groups g
  left join user_groups ug on g.id = ug.group_id
  group by g.id, g.name;
end;
$$ language plpgsql;


create function get_users_with_groups()
returns table(id uuid, name text, email text, role text, groups json) as $$
begin
  return query
  select p.id, p.name, u.email, p.role, 
         (select json_agg(g) from groups g join user_groups ug on g.id = ug.group_id where ug.user_id = p.id) as groups
  from profiles p
  join auth.users u on p.id = u.id;
end;
$$ language plpgsql;

