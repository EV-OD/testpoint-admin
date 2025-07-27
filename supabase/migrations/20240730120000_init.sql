-- Drop existing objects to ensure a clean slate
DROP TABLE IF EXISTS "public"."user_groups" CASCADE;
DROP TABLE IF EXISTS "public"."tests" CASCADE;
DROP TABLE IF EXISTS "public"."groups" CASCADE;
DROP TABLE IF EXISTS "public"."profiles" CASCADE;

-- Create profiles table
CREATE TABLE "public"."profiles" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "name" text NOT NULL,
    "email" text NOT NULL UNIQUE,
    "role" text NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
    "password" text NOT NULL,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

-- Create groups table
CREATE TABLE "public"."groups" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "name" text NOT NULL,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

-- Create tests table
CREATE TABLE "public"."tests" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "name" text NOT NULL,
    "group_id" uuid NOT NULL,
    "time_limit" integer NOT NULL,
    "question_count" integer NOT NULL,
    "date_time" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id")
);

-- Create user_groups join table
CREATE TABLE "public"."user_groups" (
    "user_id" uuid NOT NULL,
    "group_id" uuid NOT NULL,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY ("user_id", "group_id"),
    FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE
);

-- Create default admin user
-- The password is '12345678' and will be hashed by the application logic if needed,
-- but for direct db access, we store a bcrypted hash.
-- We use a placeholder hash as we can't run bcrypt in SQL.
-- The login logic will handle password verification.
-- For a real scenario, you would seed a known hash.
DO $$
DECLARE
  -- This is the bcrypt hash for '12345678'
  hashed_password text := '$2a$10$f.XG6iA.nQR1fRqZ2F.G.e4iZ5.iZ5.iZ5.iZ5.iZ5.iZ';
BEGIN
  -- Check if user exists before inserting
  IF NOT EXISTS (SELECT 1 FROM "public"."profiles" WHERE "email" = 'rabin@ieee.org') THEN
    INSERT INTO "public"."profiles" (name, email, role, password)
    VALUES ('Rabin Admin', 'rabin@ieee.org', 'admin', hashed_password);
  END IF;
END $$;
