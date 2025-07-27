-- Stop on error
\set ON_ERROR_STOP on

-- Drop existing objects with cascade to avoid dependency errors
drop table if exists "public"."user_groups" cascade;
drop table if exists "public"."tests" cascade;
drop table if exists "public"."groups" cascade;
drop table if exists "public"."profiles" cascade;
drop function if exists is_admin() cascade;

-- Custom Types
-- (No custom types in this schema)

-- Tables
create table "public"."profiles" (
    "id" uuid not null,
    "name" text not null,
    "email" text not null,
    "role" text not null default 'student'::text,
    primary key (id)
);

create table "public"."groups" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    primary key (id)
);

create table "public"."user_groups" (
    "user_id" uuid not null,
    "group_id" uuid not null,
    primary key (user_id, group_id)
);

create table "public"."tests" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "group_id" uuid not null,
    "time_limit" integer not null,
    "question_count" integer not null,
    "date_time" timestamp with time zone not null,
    primary key (id)
);

-- Foreign Key Constraints
alter table "public"."profiles" add constraint "profiles_id_fkey" foreign key (id) references auth.users(id) on delete cascade not valid;
alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."user_groups" add constraint "user_groups_user_id_fkey" foreign key (user_id) references "public"."profiles"(id) on delete cascade not valid;
alter table "public"."user_groups" validate constraint "user_groups_user_id_fkey";

alter table "public"."user_groups" add constraint "user_groups_group_id_fkey" foreign key (group_id) references "public"."groups"(id) on delete cascade not valid;
alter table "public"."user_groups" validate constraint "user_groups_group_id_fkey";

alter table "public"."tests" add constraint "tests_group_id_fkey" foreign key (group_id) references "public"."groups"(id) on delete cascade not valid;
alter table "public"."tests" validate constraint "tests_group_id_fkey";

-- Helper Functions
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return (
    select role = 'admin'
    from public.profiles
    where id = auth.uid()
  );
end;
$$;

-- Policies
alter table "public"."profiles" enable row level security;
alter table "public"."groups" enable row level security;
alter table "public"."user_groups" enable row level security;
alter table "public"."tests" enable row level security;

create policy "Users can view their own profile" on "public"."profiles" for select using (auth.uid() = id);
create policy "Admins can manage everything" on "public"."profiles" for all using (is_admin()) with check (is_admin());
create policy "Admins can manage everything" on "public"."groups" for all using (is_admin()) with check (is_admin());
create policy "Admins can manage everything" on "public"."user_groups" for all using (is_admin()) with check (is_admin());
create policy "Admins can manage everything" on "public"."tests" for all using (is_admin()) with check (is_admin());

-- Seed Data
-- Clear out old admin user if it exists to avoid conflicts
DELETE FROM auth.users WHERE email = 'rabin@ieee.org';

-- Create the admin user
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_token, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token_encrypted)
values ('00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated', 'rabin@ieee.org', crypt('12345678', gen_salt('bf')), now(), '', null, null, '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');

-- Create the corresponding profile
insert into public.profiles (id, name, email, role)
values ((select id from auth.users where email = 'rabin@ieee.org'), 'Rabin Admin', 'rabin@ieee.org', 'admin');
