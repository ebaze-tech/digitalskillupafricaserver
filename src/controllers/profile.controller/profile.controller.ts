import { Request, Response } from 'express'
import { pool } from '../../config/db.config'

interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    role: 'admin' | 'mentor' | 'mentee'
    email: string
    username: string
  }
}

interface ProfileBody {
  username: string
  shortBio: string
  goals: string
  skills: string[]
  industry: string
  experience: string
  availability?: string
}

const VALID_SKILLS = [
  'UI/UX',
  'Graphic Design',
  'Web Development',
  'Mobile Development',
  'Backend Development',
  'Data Science',
  'Machine Learning',
  'DevOps',
  'Project Management',
  'Product Management',
  'Marketing',
  'Content Creation'
]

export const completeUserProfiles = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const {
    username,
    shortBio,
    goals,
    skills,
    industry,
    experience,
    availability
  } = req.body as ProfileBody

  const userId = req.user?.id
  const role = req.user?.role

  if (!userId || !role) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  if (
    !username?.trim() ||
    !shortBio?.trim() ||
    !goals?.trim() ||
    !Array.isArray(skills) ||
    skills.length === 0 ||
    !skills.every(s => VALID_SKILLS.includes(s)) ||
    !industry?.trim() ||
    !experience?.trim() ||
    (role === 'mentor' && !availability?.trim())
  ) {
    res.status(400).json({
      message: 'All required fields must be provided with valid values'
    })
    return
  }

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const existingUser = await client.query(
      `SELECT id FROM users WHERE username = $1 AND id != $2`,
      [username, userId]
    )

    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK')
      res.status(409).json({ message: 'Username already taken' })
      return
    }

    await client.query(
      `UPDATE users SET
        username = $1,
        "shortBio" = $2,
        goals = $3,
        industry = $4,
        experience = $5,
        availability = $6,
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $7`,
      [username, shortBio, goals, industry, experience, availability, userId]
    )

    const skillIds: number[] = []
    for (const skillName of skills) {
      const result = await client.query(
        `INSERT INTO skills (name)
         VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [skillName]
      )
      skillIds.push(result.rows[0].id)
    }

    await client.query(`DELETE FROM user_skills WHERE "userId" = $1`, [userId])

    if (skillIds.length > 0) {
      const insertValues = skillIds
        .map((skillId, index) => `($${index * 2 + 1}, $${index * 2 + 2})`)
        .join(',')
      const flatParams = skillIds.flatMap(skillId => [userId, skillId])
      await client.query(
        `INSERT INTO user_skills ("userId", "skillId") VALUES ${insertValues}`,
        flatParams
      )
    }

    await client.query('COMMIT')

    const userResult = await client.query(
      `SELECT 
        u.id, u.username, u.email, u.role, 
        u."shortBio", u.goals, u.industry, u.experience, u.availability,
        COALESCE(
          array_agg(s.name) FILTER (WHERE s.name IS NOT NULL),
          ARRAY[]::text[]
        ) as skills
      FROM users u
      LEFT JOIN user_skills us ON u.id = us."userId"
      LEFT JOIN skills s ON us."skillId" = s.id
      WHERE u.id = $1
      GROUP BY u.id`,
      [userId]
    )

    res.status(200).json({
      message: 'Profile updated successfully',
      user: userResult.rows[0]
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Profile update error:', error)
    res.status(500).json({
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    })
  } finally {
    client.release()
  }
}
