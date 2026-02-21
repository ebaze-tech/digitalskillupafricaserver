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

interface User {
  id: string
  username: string
  email: string
  role: 'admin' | 'mentor' | 'mentee'
  passwordHash?: string
  goals: string
  industry: string
  experience: string
  availability: string
  createdAt: string
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

export const getUserProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const userId = req.user?.id

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const existingUser = await client.query<User>(
      `SELECT id, username, email, role, "shortBio", goals, industry, experience, availability, "createdAt", "profilePictureUrl", "updatedAt" FROM users WHERE id = $1`,
      [userId]
    )

    if (existingUser.rows.length === 0) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    if (!existingUser) {
      await client.query('ROLLBACK')
      res.status(409).json({ message: 'User does not exist' })
      return
    }

    res.status(200).json({
      message: 'User profile fetched successfully',
      data: existingUser.rows[0]
    })
    return
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Could not fetch profile data: ', error)
    res.status(500).json({
      message: 'Failed to get profile data',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    })
  } finally {
    client.release()
  }
}

export const updateUserProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const {
    username,
    shortBio,
    goals,
    industry,
    experience,
    availability,
    skills,
    profilePictureUrl
  } = req.body

  const userId = req.user?.id
  const role = req.user?.role

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const updates: string[] = []
    const values: any[] = []
    let index = 1

    if (username?.trim()) {
      const existingUser = await client.query(
        `SELECT id FROM users WHERE username = $1 AND id != $2`,
        [username, userId]
      )

      if (existingUser.rows.length > 0) {
        await client.query('ROLLBACK')
        res.status(409).json({ message: 'Username already taken' })
        return
      }

      updates.push(`username = $${index++}`)
      values.push(username.trim())
    }

    if (profilePictureUrl) {
      updates.push(`"profilePictureUrl" = $${index++}`)
      values.push(profilePictureUrl.trim())
    }

    if (shortBio?.trim()) {
      updates.push(`"shortBio" = $${index++}`)
      values.push(shortBio.trim())
    }

    if (goals?.trim()) {
      updates.push(`goals = $${index++}`)
      values.push(goals.trim())
    }

    if (industry?.trim()) {
      updates.push(`industry = $${index++}`)
      values.push(industry.trim())
    }

    if (experience?.trim()) {
      updates.push(`experience = $${index++}`)
      values.push(experience.trim())
    }

    if (role === 'mentor' && availability?.trim()) {
      updates.push(`availability = $${index++}`)
      values.push(availability.trim())
    }

    if (updates.length > 0) {
      values.push(userId)

      await client.query(
        `UPDATE users SET
          ${updates.join(', ')},
          "updatedAt" = CURRENT_TIMESTAMP
         WHERE id = $${index}`,
        values
      )
    }

    if (Array.isArray(skills)) {
      // Validate skills
      if (!skills.every(s => VALID_SKILLS.includes(s))) {
        await client.query('ROLLBACK')
        res.status(400).json({ message: 'Invalid skills provided' })
        return
      }

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

      await client.query(`DELETE FROM user_skills WHERE "userId" = $1`, [
        userId
      ])

      if (skillIds.length > 0) {
        const insertValues = skillIds
          .map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`)
          .join(',')

        const flatParams = skillIds.flatMap(id => [userId, id])

        await client.query(
          `INSERT INTO user_skills ("userId", "skillId")
           VALUES ${insertValues}`,
          flatParams
        )
      }
    }

    await client.query('COMMIT')

    const userResult = await client.query(
      `SELECT 
        u.id, u.username, u.email, u.role,
        u."shortBio", u.goals, u.industry,
        u.experience, u.availability,
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
