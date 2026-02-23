import { pool } from '../config/db.config'

/**
 * Interface for mentor search results
 */
export interface MentorProfile {
  id: string
  username: string
  email: string
  industry: string
  experience: string
  availability: string
  shortBio: string
  skills: string[]
}

/**
 * Finds mentors with optional filtering by skill name or industry.
 */
export const findMentors = async (
  skill?: string,
  industry?: string
): Promise<MentorProfile[]> => {
  const conditions: string[] = ["u.role = 'mentor'"]
  const params: any[] = []

  // Dynamic filter building
  if (skill) {
    params.push(`%${skill}%`)
    conditions.push(`s.name ILIKE $${params.length}`)
  }

  if (industry) {
    params.push(`%${industry}%`)
    conditions.push(`u.industry ILIKE $${params.length}`)
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const query = `
    SELECT 
      u.id, 
      u.username, 
      u.email, 
      u.industry, 
      u.experience, 
      u.availability,
      u."shortBio",
      u.profilePictureUrl,
      ARRAY_AGG(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL) AS skills
    FROM users u
    LEFT JOIN user_skills us ON u.id = us."userId"
    LEFT JOIN skills s ON us."skillId" = s.id
    ${whereClause}
    GROUP BY u.id
    ORDER BY u.username ASC;
  `

  try {
    const { rows } = await pool.query(query, params)
    return rows
  } catch (error) {
    console.error('Service Error [findMentors]:', error)
    throw new Error('Could not retrieve mentors')
  }
}
