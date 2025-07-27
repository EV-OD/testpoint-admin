-- Create User Profiles Table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'teacher', 'student'))
);

-- Create Groups Table
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create User/Groups Junction Table
CREATE TABLE user_groups (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, group_id)
);

-- Create Tests Table
CREATE TABLE tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  time_limit INT NOT NULL, -- in minutes
  question_count INT NOT NULL,
  date_time TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS VARCHAR AS $$
  SELECT role FROM profiles WHERE id = user_id;
$$ LANGUAGE sql STABLE;

-- Function to get groups with member count
CREATE OR REPLACE FUNCTION get_groups_with_member_count()
RETURNS TABLE (id UUID, name VARCHAR, member_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id,
    g.name,
    COUNT(ug.user_id) as member_count
  FROM
    groups g
  LEFT JOIN
    user_groups ug ON g.id = ug.group_id
  GROUP BY
    g.id, g.name;
END;
$$ LANGUAGE plpgsql;


-- ROW LEVEL SECURITY POLICIES --
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Allow admins to manage profiles" ON profiles
  FOR ALL
  USING (get_user_role(auth.uid()) = 'admin')
  WITH CHECK (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Allow users to view their own profile" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Groups Policies
CREATE POLICY "Allow admins to manage groups" ON groups
  FOR ALL
  USING (get_user_role(auth.uid()) = 'admin')
  WITH CHECK (get_user_role(auth.uid()) = 'admin');

-- User Groups Policies
CREATE POLICY "Allow admins to manage user_groups" ON user_groups
  FOR ALL
  USING (get_user_role(auth.uid()) = 'admin')
  WITH CHECK (get_user_role(auth.uid()) = 'admin');

-- Tests Policies
CREATE POLICY "Allow admins to manage tests" ON tests
  FOR ALL
  USING (get_user_role(auth.uid()) = 'admin')
  WITH CHECK (get_user_role(auth.uid()) = 'admin');
