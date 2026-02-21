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
  "profilePictureUrl" VARCHAR(512) NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Role-specific Tables
CREATE TABLE IF NOT EXISTS "mentees" (
  "menteeId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL UNIQUE REFERENCES "users" (id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "mentors" (
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

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,                -- hashed refresh token
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  revoked BOOLEAN DEFAULT FALSE
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
