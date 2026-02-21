import { Request, Response } from 'express'
import { pool } from '../../config/db.config'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

interface User {
  id: string
  username: string
  email: string
  role: 'admin' | 'mentor' | 'mentee'
  passwordHash?: string
}

interface SessionStats {
  totalCompletedSessions: number
}

interface MentorshipMatch {
  mentorId: string
  menteeId: string
  mentorUsername: string
  mentorEmail: string
  menteeUsername: string
  menteeEmail: string
}

const BCRYPT_ROUNDS = 12
const VALID_ROLES = ['admin', 'mentor', 'mentee'] as const
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  const client = await pool.connect()

  try {
    const adminId = req.user?.roleId
    const id = req.user?.id

    if (!id) {
      res.status(400).json({ message: 'Invalid user' })
      return
    }

    const existingAdmin = await client.query(
      `SELECT adminId FROM admins WHERE userId = $1 AND adminId = $2`,
      [id, adminId]
    )

    if (existingAdmin.rows.length === 0) {
      res.status(403).json({ message: 'Access prohibited' })
      return
    }

    const { rows } = await client.query(
      'SELECT id, username, email, role FROM users ORDER BY created_at DESC'
    )

    res.status(200).json({
      message: 'User details fetched successfully',
      data: rows
    })
    return
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({ message: 'Failed to fetch users' })
    return
  } finally {
    client.release()
  }
}

export const getUserById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const client = await pool.connect()

  try {
    const adminId = req.user?.roleId
    const userId = req.user?.id

    if (!userId) {
      res.status(400).json({ message: 'Invalid user' })
      return
    }

    const existingAdmin = await client.query(
      `SELECT adminId FROM admins WHERE userId = $1 AND adminId = $2`,
      [userId, adminId]
    )

    if (existingAdmin.rows.length === 0) {
      res.status(403).json({ message: 'Access prohibited' })
      return
    }

    const { id } = req.params

    if (!id) {
      res.status(400).json({ message: 'User ID is required' })
      return
    }

    const { rows } = await client.query(
      `SELECT id, username, email, role, "shortBio", goals, industry, experience, availability
       FROM users WHERE id = $1`,
      [id]
    )

    if (rows.length === 0) {
      res.status(404).json({ message: 'User not found' })
      return
    }

    res.status(200).json({
      message: 'User details fetched successfully',
      data: rows[0]
    })
    return
  } catch (error) {
    console.error('Error fetching user:', error)
    res.status(500).json({ message: 'Internal server error' })
    return
  } finally {
    client.release()
  }
}

export const addUser = async (req: Request, res: Response): Promise<void> => {
  const { username, email, password, role } = req.body

  if (!username || !email || !password || !role) {
    res.status(400).json({ message: 'All fields are required' })
    return
  }

  if (!VALID_ROLES.includes(role)) {
    res.status(400).json({ message: 'Invalid role specified' })
    return
  }

  const client = await pool.connect()

  try {
    const adminId = req.user?.roleId
    const id = req.user?.id

    if (!id) {
      res.status(400).json({ message: 'Invalid user' })
      return
    }

    const existingAdmin = await client.query(
      `SELECT adminId FROM admins WHERE userId = $1 AND adminId = $2`,
      [id, adminId]
    )

    if (existingAdmin.rows.length === 0) {
      res.status(403).json({ message: 'Access prohibited' })
      return
    }

    await client.query('BEGIN')

    const existingUser = await client.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    )

    if (existingUser.rows.length > 0) {
      res.status(400).json({ message: 'Username or email already exists' })
      return
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)
    const userId = uuidv4()

    const { rows } = await client.query<User>(
      `INSERT INTO users (id, username, email, "passwordHash", role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, role`,
      [userId, username, email, passwordHash, role]
    )

    const roleId = uuidv4()
    const roleTable =
      role === 'mentor' ? 'mentors' : role === 'mentee' ? 'mentees' : 'admins'
    const roleIdColumn =
      role === 'mentor'
        ? 'mentorId'
        : role === 'mentee'
        ? 'menteeId'
        : 'adminId'

    await client.query(
      `INSERT INTO ${roleTable} ("${roleIdColumn}", "userId") VALUES ($1, $2)`,
      [roleId, userId]
    )

    await client.query('COMMIT')

    res.status(201).json({
      message: 'User added successfully',
      data: rows[0]
    })
    return
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error adding user:', error)

    if ((error as Error).message.includes('exists')) {
      res.status(409).json({ message: 'Username or email already exists' })
      return
    } else {
      res.status(500).json({ message: 'Failed to add user' })
      return
    }
  } finally {
    client.release()
  }
}

export const editUser = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const { username, email, password, role } = req.body

  if (!id) {
    res.status(400).json({ message: 'User ID is required' })
    return
  }

  const client = await pool.connect()

  try {
    const adminId = req.user?.roleId
    const userId = req.user?.id

    if (!userId) {
      res.status(400).json({ message: 'Invalid user' })
      return
    }

    const existingAdmin = await client.query(
      `SELECT adminId FROM admins WHERE userId = $1 AND adminId = $2`,
      [userId, adminId]
    )

    if (existingAdmin.rows.length === 0) {
      res.status(403).json({ message: 'Access prohibited' })
      return
    }

    await client.query('BEGIN')

    const existingUser = await client.query(
      'SELECT id, role FROM users WHERE id = $1',
      [id]
    )

    if (existingUser.rows.length === 0) {
      await client.query('ROLLBACK')
      res.status(404).json({ message: 'User not found' })
      return
    }

    const currentUser = existingUser.rows[0]

    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (username) {
      updates.push(`username = $${paramIndex++}`)
      values.push(username)
    }
    if (email) {
      updates.push(`email = $${paramIndex++}`)
      values.push(email)
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS)
      updates.push(`"passwordHash" = $${paramIndex++}`)
      values.push(hashedPassword)
    }
    if (role) {
      if (!VALID_ROLES.includes(role)) {
        await client.query('ROLLBACK')
        res.status(400).json({ message: 'Invalid role' })
        return
      }
      updates.push(`role = $${paramIndex++}`)
      values.push(role)
    }

    if (updates.length === 0) {
      await client.query('ROLLBACK')
      res.status(400).json({ message: 'No fields to update' })
      return
    }

    values.push(id)
    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, username, email, role
    `

    const { rows } = await client.query<User>(query, values)

    if (role && role !== currentUser.role) {
      const oldRoleTable =
        currentUser.role === 'mentor'
          ? 'mentors'
          : currentUser.role === 'mentee'
          ? 'mentees'
          : 'admins'
      const oldRoleIdColumn =
        currentUser.role === 'mentor'
          ? 'mentorId'
          : currentUser.role === 'mentee'
          ? 'menteeId'
          : 'adminId'

      await client.query(`DELETE FROM ${oldRoleTable} WHERE "userId" = $1`, [
        id
      ])

      const newRoleId = uuidv4()
      const newRoleTable =
        role === 'mentor' ? 'mentors' : role === 'mentee' ? 'mentees' : 'admins'
      const newRoleIdColumn =
        role === 'mentor'
          ? 'mentorId'
          : role === 'mentee'
          ? 'menteeId'
          : 'adminId'

      await client.query(
        `INSERT INTO ${newRoleTable} ("${newRoleIdColumn}", "userId") VALUES ($1, $2)`,
        [newRoleId, id]
      )
    }

    await client.query('COMMIT')

    res.status(200).json({
      message: 'User updated successfully',
      data: rows[0]
    })
    return
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error updating user:', error)
    res.status(500).json({ message: 'Failed to update user' })
    return
  } finally {
    client.release()
  }
}

export const assignMentor = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { mentorId, menteeId } = req.body

  if (!mentorId || !menteeId) {
    res.status(400).json({ message: 'MentorId and MenteeId are required' })
    return
  }

  const client = await pool.connect()

  try {
    const adminId = req.user?.roleId
    const userId = req.user?.id

    if (!userId) {
      res.status(400).json({ message: 'Invalid user' })
      return
    }

    const existingAdmin = await client.query(
      `SELECT adminId FROM admins WHERE userId = $1 AND adminId = $2`,
      [userId, adminId]
    )

    if (existingAdmin.rows.length === 0) {
      res.status(403).json({ message: 'Access prohibited' })
      return
    }

    await client.query('BEGIN')

    const users = await client.query(
      `SELECT id, role FROM users WHERE id = ANY($1::uuid[])`,
      [[mentorId, menteeId]]
    )

    const userMap = new Map(users.rows.map(u => [u.id, u.role]))

    if (userMap.get(mentorId) !== 'mentor') {
      await client.query('ROLLBACK')
      res.status(400).json({ message: 'Invalid mentor ID' })
      return
    }

    if (userMap.get(menteeId) !== 'mentee') {
      await client.query('ROLLBACK')
      res.status(400).json({ message: 'Invalid mentee ID' })
      return
    }

    const existingMatch = await client.query(
      'SELECT id FROM mentorship_match WHERE "mentorId" = $1 AND "menteeId" = $2',
      [mentorId, menteeId]
    )

    if (existingMatch.rows.length > 0) {
      await client.query('ROLLBACK')
      res.status(409).json({ message: 'Match already exists' })
      return
    }

    const { rows } = await client.query(
      `INSERT INTO mentorship_match (id, "mentorId", "menteeId")
       VALUES ($1, $2, $3)
       RETURNING *`,
      [uuidv4(), mentorId, menteeId]
    )

    await client.query('COMMIT')

    res.status(201).json({
      message: 'Mentor assigned successfully',
      match: rows[0]
    })
    return
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error assigning mentor:', error)
    res.status(500).json({ message: 'Failed to assign mentor' })
    return
  } finally {
    client.release()
  }
}

export const getAllMentorshipMatches = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const adminId = req.user?.roleId
    const userId = req.user?.id

    if (!userId) {
      res.status(400).json({ message: 'Invalid user' })
      return
    }

    const existingAdmin = await pool.query(
      `SELECT adminId FROM admins WHERE userId = $1 AND adminId = $2`,
      [userId, adminId]
    )

    if (existingAdmin.rows.length === 0) {
      res.status(403).json({ message: 'Access prohibited' })
      return
    }

    const { rows } = await pool.query<MentorshipMatch>(`
      SELECT 
        m."menteeId",
        m."mentorId",
        mentee.username AS "menteeUsername",
        mentee.email AS "menteeEmail",
        mentor.username AS "mentorUsername",
        mentor.email AS "mentorEmail"
      FROM mentorship_match m
      JOIN users mentee ON mentee.id = m."menteeId"
      JOIN users mentor ON mentor.id = m."mentorId"
      ORDER BY m."createdAt" DESC
    `)

    res.status(200).json({
      message: 'All mentorship matches fetched successfully',
      data: rows
    })
    return
  } catch (error) {
    console.error('Error fetching mentorship matches:', error)
    res.status(500).json({ message: 'Failed to fetch matches' })
    return
  }
}

export const getAllSessions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const adminId = req.user?.roleId
    const userId = req.user?.id

    if (!userId) {
      res.status(400).json({ message: 'Invalid user' })
      return
    }

    const existingAdmin = await pool.query(
      `SELECT adminId FROM admins WHERE userId = $1 AND adminId = $2`,
      [userId, adminId]
    )

    if (existingAdmin.rows.length === 0) {
      res.status(403).json({ message: 'Access prohibited' })
      return
    }

    const { rows } = await pool.query(`
      SELECT 
        s.id,
        s.date,
        s.status,
        u_mentees.username AS "menteeUsername",
        u_mentors.username AS "mentorUsername"
      FROM session_bookings s
      JOIN users u_mentees ON u_mentees.id = s."menteeId"
      JOIN users u_mentors ON u_mentors.id = s."mentorId"
      ORDER BY s.date DESC
    `)

    res.status(200).json({
      message: 'Sessions retrieved successfully',
      data: rows
    })
    return
  } catch (error) {
    console.error('Error fetching sessions:', error)
    res.status(500).json({ message: 'Failed to retrieve sessions' })
    return
  }
}

export const getSessionStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const adminId = req.user?.roleId
    const userId = req.user?.id

    if (!userId) {
      res.status(400).json({ message: 'Invalid user' })
      return
    }

    const existingAdmin = await pool.query(
      `SELECT adminId FROM admins WHERE userId = $1 AND adminId = $2`,
      [userId, adminId]
    )

    if (existingAdmin.rows.length === 0) {
      res.status(403).json({ message: 'Access prohibited' })
      return
    }

    const { rows } = await pool.query(
      'SELECT COUNT(*) FROM session_bookings WHERE status = $1',
      ['completed']
    )

    res.status(200).json({
      message: 'Session stats fetched successfully',
      totalCompletedSessions: parseInt(rows[0].count, 10)
    })
    return
  } catch (error) {
    console.error('Error getting session stats:', error)
    res.status(500).json({ message: 'Failed to get session stats' })
  }
  return
}

export const getTotalSessionsHeld = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const adminId = req.user?.roleId
    const userId = req.user?.id

    if (!userId) {
      res.status(400).json({ message: 'Invalid user' })
      return
    }

    const existingAdmin = await pool.query(
      `SELECT adminId FROM admins WHERE userId = $1 AND adminId = $2`,
      [userId, adminId]
    )

    if (existingAdmin.rows.length === 0) {
      res.status(403).json({ message: 'Access prohibited' })
      return
    }

    const { rows } = await pool.query(`
      SELECT COUNT(*) AS session_count
      FROM session_bookings
      WHERE date < CURRENT_DATE
    `)

    const count = parseInt(rows[0].session_count, 10)
    res.status(200).json({
      message: 'Total session data fetched successfully',
      totalSessions: count
    })
    return
  } catch (error) {
    console.error('Error fetching total sessions:', error)
    res.status(500).json({ message: 'Failed to fetch total sessions' })
  }
}

export const getAdminById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const adminId = req.user?.roleId
    const userId = req.user?.id

    if (!userId) {
      res.status(400).json({ message: 'Invalid user' })
      return
    }

    const existingAdmin = await pool.query(
      `SELECT adminId FROM admins WHERE userId = $1 AND adminId = $2`,
      [userId, adminId]
    )

    if (existingAdmin.rows.length === 0) {
      res.status(403).json({ message: 'Access prohibited' })
      return
    }

    const { rows } = await pool.query(
      `
      SELECT 
        a."adminId", 
        u.id as "userId",
        u.username, 
        u.email, 
        'admin' AS role
      FROM admins a
      JOIN users u ON u.id = a."userId"
      WHERE a."adminId" = $1
    `,
      [adminId]
    )

    if (rows.length === 0) {
      res.status(404).json({ message: 'Admin not found' })
      return
    }

    res.status(200).json(rows[0])
  } catch (error) {
    console.error('Error fetching admin:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
