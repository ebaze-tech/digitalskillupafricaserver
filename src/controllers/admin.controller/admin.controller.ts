import { Request, Response } from 'express'
import { pool } from '../../config/db.config'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

/**
 * Utility: Validate UUID format
 */
const isValidUUID = (id: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id
  )

/**
 * GET /users
 */
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, username, email, role FROM users ORDER BY "createdAt" DESC`
    )
    return res.status(200).json(rows)
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch users.' })
  }
}

/**
 * GET /sessions/stats
 */
export const getSessionStats = async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM session_bookings WHERE status = 'completed') as "completed",
        (SELECT COUNT(*) FROM session_bookings WHERE date < CURRENT_DATE) as "total_held"
    `
    const { rows } = await pool.query(query)
    return res.status(200).json({
      totalCompletedSessions: parseInt(rows[0].completed, 10),
      totalSessionsHeld: parseInt(rows[0].total_held, 10)
    })
  } catch (error) {
    return res.status(500).json({ error: 'Failed to get session stats.' })
  }
}

/**
 * POST /mentorship/assign
 * 
 */
export const assignMentorToMentee = async (req: Request, res: Response) => {
  const { mentorId, menteeId, adminId } = req.body

  if (![mentorId, menteeId, adminId].every(isValidUUID)) {
    return res.status(400).json({ error: 'Invalid UUID format for IDs.' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const existing = await client.query(
      'SELECT 1 FROM mentorship_match WHERE "menteeId" = $1',
      [menteeId]
    )
    if (existing.rowCount! > 0) {
      throw new Error('Mentee already has a mentor.')
    }

    const insertQuery = `
      INSERT INTO mentorship_match ("mentorId", "menteeId", "adminId")
      VALUES ($1, $2, $3)
      RETURNING *
    `
    const { rows } = await client.query(insertQuery, [
      mentorId,
      menteeId,
      adminId
    ])

    await client.query('COMMIT')
    return res
      .status(201)
      .json({ message: 'Mentor assigned successfully.', data: rows[0] })
  } catch (error: any) {
    await client.query('ROLLBACK')
    return res
      .status(error.message.includes('already') ? 409 : 500)
      .json({ error: error.message })
  } finally {
    client.release()
  }
}

/**
 * POST /users
 * Centralized user creation
 */
export const addUser = async (req: Request, res: Response) => {
  const { username, email, password, role } = req.body
  const validRoles = ['admin', 'mentor', 'mentee']

  if (!username || !email || !password || !validRoles.includes(role)) {
    return res
      .status(400)
      .json({
        error: 'Valid username, email, password, and role are required.'
      })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const passwordHash = await bcrypt.hash(password, 12)
    const userResult = await client.query(
      `INSERT INTO users (username, email, "passwordHash", role)
       VALUES ($1, $2, $3, $4) RETURNING id, username, email, role`,
      [username, email, passwordHash, role]
    )

    const newUser = userResult.rows[0]

    const tableMap: Record<string, string> = {
      mentor: 'mentor',
      mentee: 'mentee',
      admin: 'admins'
    }
    await client.query(`INSERT INTO ${tableMap[role]} ("userId") VALUES ($1)`, [
      newUser.id
    ])

    await client.query('COMMIT')
    return res
      .status(201)
      .json({ message: 'User added successfully.', user: newUser })
  } catch (error) {
    await client.query('ROLLBACK')
    return res.status(500).json({ error: 'Server error adding user.' })
  } finally {
    client.release()
  }
}

/**
 * PATCH /users/:id
 */
export const editUser = async (req: Request, res: Response) => {
  const { id } = req.params
  const updates = req.body

  if (!isValidUUID(id as string))
    return res.status(400).json({ error: 'Invalid User ID.' })

  const fields: string[] = []
  const values: any[] = []

  Object.entries(updates).forEach(([key, value], index) => {
    if (['username', 'email', 'role'].includes(key)) {
      fields.push(`"${key}" = $${index + 1}`)
      values.push(value)
    }
  })

  if (fields.length === 0)
    return res.status(400).json({ error: 'No valid fields to update.' })

  values.push(id)
  const query = `UPDATE users SET ${fields.join(
    ', '
  )}, "updatedAt" = NOW() WHERE id = $${
    values.length
  } RETURNING id, username, email, role`

  try {
    const { rows } = await pool.query(query, values)
    if (rows.length === 0)
      return res.status(404).json({ error: 'User not found.' })
    return res
      .status(200)
      .json({ message: 'User updated successfully.', user: rows[0] })
  } catch (error) {
    return res.status(500).json({ error: 'Server error updating user.' })
  }
}
