import { Request, Response } from 'express'
import { pool } from '../../config/db.config'

/**
 * PATCH /profile/complete
 * Updates the user's core profile and manages skills association.
 */
export const completeUserProfiles = async (req: Request, res: Response) => {
  const userId = req.user?.id
  const {
    username,
    shortBio,
    goals,
    skills,
    industry,
    experience,
    availability
  } = req.body

  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated.' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const updateProfileQuery = `
      UPDATE users 
      SET 
        username = COALESCE($1, username),
        "shortBio" = COALESCE($2, "shortBio"),
        goals = COALESCE($3, goals),
        industry = COALESCE($4, industry),
        experience = COALESCE($5, experience),
        availability = COALESCE($6, availability),
        "updatedAt" = NOW()
      WHERE id = $7
      RETURNING id, username, email, role, "shortBio", goals, industry, experience, availability;
    `

    const profileResult = await client.query(updateProfileQuery, [
      username,
      shortBio,
      goals,
      industry,
      experience,
      availability,
      userId
    ])

    if (profileResult.rowCount === 0) {
      throw new Error('User profile not found.')
    }

    if (Array.isArray(skills)) {
      await client.query('DELETE FROM user_skills WHERE "userId" = $1', [
        userId
      ])

      if (skills.length > 0) {
        const skillIdsResult = await client.query(
          `
          INSERT INTO skills (name) 
          SELECT unnest($1::text[])
          ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
          RETURNING id
        `,
          [skills]
        )

        const skillIds = skillIdsResult.rows.map(row => row.id)

        const values = skillIds.map(id => `('${userId}', ${id})`).join(',')
        await client.query(
          `INSERT INTO user_skills ("userId", "skillId") VALUES ${values}`
        )
      }
    }

    await client.query('COMMIT')

    return res.status(200).json({
      message: 'Profile updated successfully.',
      user: {
        ...profileResult.rows[0],
        skills: skills || []
      }
    })
  } catch (error: any) {
    await client.query('ROLLBACK')
    return res.status(error.message.includes('not found') ? 404 : 500).json({
      error: 'Failed to update profile.',
      details: error.message
    })
  } finally {
    client.release()
  }
}

/**
 * GET /profile/me
 * Retrieves current user profile with aggregated skills.
 */
export const getMyProfile = async (req: Request, res: Response) => {
  const userId = req.user?.id

  try {
    const query = `
      SELECT u.id, u.username, u.email, u.role, u."shortBio", u.goals, u.industry, u.experience, u.availability,
             ARRAY_AGG(s.name) FILTER (WHERE s.name IS NOT NULL) as skills
      FROM users u
      LEFT JOIN user_skills us ON u.id = us."userId"
      LEFT JOIN skills s ON us."skillId" = s.id
      WHERE u.id = $1
      GROUP BY u.id;
    `
    const { rows } = await pool.query(query, [userId])

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found.' })
    }

    return res.status(200).json(rows[0])
  } catch (error) {
    return res
      .status(500)
      .json({ error: 'Server error fetching profile data.' })
  }
}
