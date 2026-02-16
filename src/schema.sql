-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Unified Users Table
CREATE TABLE IF NOT EXISTS "users" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  "passwordHash" VARCHAR(255) NOT NULL,
  role VARCHAR(10) CHECK (role IN ('admin', 'mentor', 'mentee')) NOT NULL,
   "shortBio" TEXT,
  "goals" TEXT,
  "industry" VARCHAR(255),
  "experience" TEXT,
  "availability" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Role-specific Tables
CREATE TABLE IF NOT EXISTS "mentees" (
  "menteeId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL UNIQUE REFERENCES "users" (id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "mentor" (
  "mentorId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL UNIQUE REFERENCES "users" (id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "admins" (
  "adminId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL UNIQUE REFERENCES "users" (id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Skills Management
CREATE TABLE IF NOT EXISTS "skills" (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS "user_skills" (
  "userId" UUID REFERENCES "users" (id) ON DELETE CASCADE,
  "skillId" INTEGER REFERENCES "skills" (id) ON DELETE CASCADE,
  PRIMARY KEY ("userId", "skillId")
);

-- 4. Mentorship Logic
CREATE TABLE IF NOT EXISTS "mentorship_request" (
  id SERIAL PRIMARY KEY,
  "mentorId" UUID NOT NULL REFERENCES "users" (id) ON DELETE CASCADE,
  "menteeId" UUID NOT NULL REFERENCES "users" (id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "mentorship_match" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "mentorId" UUID NOT NULL REFERENCES "users" (id) ON DELETE CASCADE,
  "menteeId" UUID NOT NULL REFERENCES "users" (id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("mentorId", "menteeId")
);

-- 5. Sessions
CREATE TABLE IF NOT EXISTS "session_bookings" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "mentorId" UUID NOT NULL REFERENCES "users" (id),
  "menteeId" UUID NOT NULL REFERENCES "users" (id),
  "date" TIMESTAMP WITH TIME ZONE NOT NULL,
  "status" VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE mentors DROP COLUMN IF EXISTS "shortBio", DROP COLUMN IF EXISTS goals, DROP COLUMN IF EXISTS username;
ALTER TABLE mentees DROP COLUMN IF EXISTS "shortBio", DROP COLUMN IF EXISTS goals, DROP COLUMN IF EXISTS username;
ALTER TABLE admins DROP COLUMN IF EXISTS "shortBio", DROP COLUMN IF EXISTS goals, DROP COLUMN IF EXISTS username;