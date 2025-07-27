-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student'))
);

-- Create groups table
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_groups junction table
CREATE TABLE user_groups (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, group_id)
);

-- Create tests table
CREATE TABLE tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  time_limit INT NOT NULL,
  question_count INT NOT NULL,
  date_time TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can create profiles" ON profiles FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- RLS for groups
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view groups" ON groups FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage groups" ON groups FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- RLS for user_groups
ALTER TABLE user_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view their own group memberships" ON user_groups FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage group memberships" ON user_groups FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Teachers can view members of their groups" ON user_groups FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_groups ug
    JOIN profiles p ON p.id = ug.user_id
    WHERE ug.group_id = user_groups.group_id AND p.role = 'teacher' AND p.id = auth.uid()
  )
);

-- RLS for tests
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage tests" ON tests FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Teachers can view tests for their groups" ON tests FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_groups ug
    WHERE ug.group_id = tests.group_id AND ug.user_id = auth.uid()
  )
);
CREATE POLICY "Students can view tests for their groups" ON tests FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_groups ug
    WHERE ug.group_id = tests.group_id AND ug.user_id = auth.uid()
  )
);

-- Function to get groups with member count
CREATE OR REPLACE FUNCTION get_groups_with_member_count()
RETURNS TABLE(id UUID, name TEXT, member_count BIGINT) AS $$
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
    g.id;
END;
$$ LANGUAGE plpgsql;

-- Function to create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (new.id, new.raw_user_meta_data->>'name', new.email, new.raw_user_meta_data->>'role');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_user on new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
