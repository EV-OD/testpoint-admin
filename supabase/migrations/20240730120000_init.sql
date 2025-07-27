-- Drop existing objects to ensure a clean slate on re-runs.
DROP TABLE IF EXISTS tests CASCADE;
DROP TABLE IF EXISTS user_groups CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP FUNCTION IF EXISTS get_groups_with_member_count();
DROP FUNCTION IF EXISTS is_admin();


-- Helper function to check if the current user is an admin.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- PROFILES TABLE: Stores user information.
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student'))
);

-- GROUPS TABLE: Stores user groups.
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL
);

-- USER_GROUPS TABLE: Many-to-many relationship between users and groups.
CREATE TABLE user_groups (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, group_id)
);

-- TESTS TABLE: Stores test information.
CREATE TABLE tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  time_limit INT NOT NULL,
  question_count INT NOT NULL,
  date_time TIMESTAMPTZ NOT NULL
);


-- Function to get groups with their member counts.
CREATE OR REPLACE FUNCTION get_groups_with_member_count()
RETURNS TABLE(id UUID, name TEXT, member_count BIGINT) AS $$
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


-- Enable Row Level Security (RLS) for all tables.
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;


-- POLICIES:

-- Profiles Policies:
-- 1. Admins can manage all profiles.
CREATE POLICY "Admins can manage profiles" ON profiles
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());
-- 2. Users can view their own profile.
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Groups Policies:
-- 1. Admins can manage all groups.
CREATE POLICY "Admins can manage groups" ON groups
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- User_Groups Policies:
-- 1. Admins can manage all user-group relationships.
CREATE POLICY "Admins can manage user_groups" ON user_groups
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Tests Policies:
-- 1. Admins can manage all tests.
CREATE POLICY "Admins can manage tests" ON tests
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());
