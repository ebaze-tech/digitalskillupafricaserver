import pool from "../config/db.config";

export const findMentors = async (skill?: string, industry?: string) => {
  const params: any[] = [];
  let whereClause = `WHERE u.role = 'mentor'`;
  let i = 1;

  if (skill) {
    whereClause += ` AND s.name ILIKE $${i++}`;
    params.push(`%${skill}%`);
  }

  if (industry) {
    whereClause += ` AND m.industry ILIKE $${i++}`;
    params.push(`%${industry}%`);
  }

  const query = `
  SELECT 
    u.id, u.username, u.email,
    m.industry, m.experience, m.availability,
    array_agg(DISTINCT s.name) AS skills
  FROM users u
  LEFT JOIN mentors m ON u.id = m."userId"
  LEFT JOIN mentor_skills ms ON m."mentorId" = ms."mentorId"
  LEFT JOIN skills s ON ms."skillId" = s.id
  ${whereClause}
  GROUP BY u.id, m.industry, m.experience, m.availability
  ORDER BY u.username;
`;

  const { rows } = await pool.query(query, params);
  return rows;
};
