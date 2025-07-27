-- Drop existing objects if they exist
DROP TABLE IF EXISTS user_groups CASCADE;
DROP TABLE IF EXISTS tests CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TYPE IF EXISTS user_role;

-- Create a custom type for user roles
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student');

-- Create the profiles table to store user information
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role user_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create the groups table
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create the join table for users and groups (many-to-many)
CREATE TABLE user_groups (
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, group_id)
);

-- Create the tests table
CREATE TABLE tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    time_limit INT NOT NULL, -- in minutes
    question_count INT NOT NULL,
    date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Example: Insert a default admin user
-- NOTE: The password here is '12345678', which will be hashed by the application.
-- For a real application, you'd want a more secure initial password or setup process.
INSERT INTO profiles (name, email, password, role) VALUES 
('Default Admin', 'rabin@ieee.org', '$2a$10$fPL4gETsVt..1t0tZaVIx.k4wX0G5DGlChO6XpLWM5YnTnU5aUv42', 'admin'); -- password is '12345678'
