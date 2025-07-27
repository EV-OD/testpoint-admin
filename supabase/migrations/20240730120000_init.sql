
-- Drop existing objects to ensure a clean slate on re-runs
DROP FUNCTION IF EXISTS get_groups_with_member_count();
DROP TABLE IF EXISTS user_groups CASCADE;
DROP TABLE IF EXISTS tests CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;


-- Create a table for public profiles
create table profiles (
  id uuid not null references auth.users on delete cascade,
  name text,
  email text,
  role text,
  primary key (id)
);

-- Create groups table
create table groups (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

-- Create tests table
create table tests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  group_id uuid references groups(id) on delete cascade,
  time_limit integer not null,
  question_count integer not null,
  date_time timestamptz not null
);

-- Create a join table for user-group many-to-many relationship
create table user_groups (
  user_id uuid references profiles(id) on delete cascade,
  group_id uuid references groups(id) on delete cascade,
  primary key (user_id, group_id)
);


-- Set up Row Level Security (RLS)
--
-- PROFILES
alter table profiles enable row level security;

-- Allow admins to perform any action on profiles
create policy "Admins can manage profiles" on profiles
  for all
  using ( (select auth.jwt() ->> 'email') IN (select email from profiles where role = 'admin') );

-- Allow users to view their own profile
create policy "Users can view their own profile" on profiles
  for select
  using ( auth.uid() = id );
  
-- Allow new users to be created
create policy "Allow anonymous creation of profiles" on profiles
  for insert
  with check (true);


-- GROUPS
alter table groups enable row level security;
create policy "Allow admins to manage groups" on groups for all
using ( (select auth.jwt() ->> 'email') IN (select email from profiles where role = 'admin') );

-- TESTS
alter table tests enable row level security;
create policy "Allow admins to manage tests" on tests for all
using ( (select auth.jwt() ->> 'email') IN (select email from profiles where role = 'admin') );

-- USER_GROUPS
alter table user_groups enable row level security;
create policy "Allow admins to manage user_groups" on user_groups for all
using ( (select auth.jwt() ->> 'email') IN (select email from profiles where role = 'admin') );


-- Create a function to get group member counts
create or replace function get_groups_with_member_count()
returns table(id uuid, name text, member_count bigint) as $$
begin
  return query
  select
    g.id,
    g.name,
    count(ug.user_id) as member_count
  from
    groups g
  left join
    user_groups ug on g.id = ug.group_id
  group by
    g.id;
end;
$$ language plpgsql;
