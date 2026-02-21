BEGIN;

TRUNCATE TABLE 
  user_skills,
  mentorship_request,
  mentorship_match,
  session_bookings,
  mentees,
  mentors,
  admins,
  skills,
  users
RESTART IDENTITY CASCADE;

COMMIT;