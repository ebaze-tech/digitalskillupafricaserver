/* ============================================================

ENABLE EXTENSIONS

============================================================ */
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

/* ============================================================

1. USERS TABLE

============================================================ */
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    "passwordHash" VARCHAR(255) NOT NULL,
    role VARCHAR(10) NOT NULL CHECK (
        role IN ('admin', 'mentor', 'mentee')
    ),
    "shortBio" TEXT,
    goals TEXT,
    industry VARCHAR(255),
    experience TEXT,
    availability TEXT,
    "profilePictureUrl" VARCHAR(512),
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

/* ============================================================

2. ROLE-SPECIFIC TABLES

============================================================ */
CREATE TABLE IF NOT EXISTS mentors (
    "mentorId" UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    "userId" UUID NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mentees (
    "menteeId" UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    "userId" UUID NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admins (
    "adminId" UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    "userId" UUID NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

/* ============================================================

3. SKILLS MANAGEMENT

============================================================ */
CREATE TABLE IF NOT EXISTS skills (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS user_skills (
    "userId" UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    "skillId" INTEGER NOT NULL REFERENCES skills (id) ON DELETE CASCADE,
    PRIMARY KEY ("userId", "skillId")
);

/* ============================================================

4. MENTORSHIP LOGIC

============================================================ */
CREATE TABLE IF NOT EXISTS mentorship_request (
    id SERIAL PRIMARY KEY,
    "mentorId" UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    "menteeId" UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (
        status IN (
            'pending',
            'accepted',
            'rejected'
        )
    ),
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE ("mentorId", "menteeId")
);

CREATE TABLE IF NOT EXISTS mentorship_match (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    "mentorId" UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    "menteeId" UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE ("mentorId", "menteeId")
);

/* ============================================================

5. SESSION BOOKINGS

============================================================ */
CREATE TABLE IF NOT EXISTS session_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    "mentorId" UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    "menteeId" UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (
        status IN (
            'scheduled',
            'completed',
            'cancelled'
        )
    ),
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

/* ============================================================

6. REFRESH TOKENS

============================================================ */
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    revoked BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens (token_hash);

/* ============================================================

7. MENTOR AVAILABILITY

============================================================ */
CREATE TABLE IF NOT EXISTS mentor_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    "mentorId" UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_mentor_day UNIQUE ("mentorId", day_of_week)
);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS "profilePictureUrl" VARCHAR(255);

-- ALTER TABLE users DROP COLUMN IF EXISTS "profilePictureURL";