import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { pool } from '../../config/db.config'
import sendResetEmail from '../../utils/mailer'

const JWT_SECRET = process.env.JWT_SECRET!
const CLIENT_URL = process.env.CLIENT_URL

/**
 * POST /register
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  const {
    username,
    email,
    password,
    role,
    shortBio = '',
    goals = ''
  } = req.body

  if (!username || !email || !password || !role) {
    res.status(400).json({ message: 'All required fields must be provided.' })
    return
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const userExists = await client.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    )
    if (userExists.rowCount! > 0) {
      res.status(409).json({ message: 'Username or email already in use.' })
      await client.query('ROLLBACK')
      return
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const userResult = await client.query(
      `INSERT INTO users (username, email, "passwordHash", role) 
       VALUES ($1, $2, $3, $4) RETURNING id, username, email, role`,
      [username, email, hashedPassword, role]
    )

    const newUser = userResult.rows[0]

    const targetTable = role === 'mentor' ? 'mentor' : 'mentee'
    await client.query(
      `INSERT INTO ${targetTable} ("userId", username, "shortBio", goals) 
       VALUES ($1, $2, $3, $4)`,
      [newUser.id, username, shortBio, goals]
    )

    await client.query('COMMIT')
    res
      .status(201)
      .json({ message: 'User registered successfully', user: newUser })
  } catch (err) {
    await client.query('ROLLBACK')
    res
      .status(500)
      .json({ message: 'Internal server error during registration.' })
  } finally {
    client.release()
  }
}

/**
 * POST /login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body

  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [
      email
    ])
    const user = rows[0]

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ message: 'Invalid email or password.' })
      return
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    )

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, role: user.role }
    })
  } catch (err) {
    res.status(500).json({ message: 'Internal server error during login.' })
  }
}

/**
 * POST /forgot-password
 */
export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { email } = req.body

  try {
    const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [
      email
    ])
    if (rows.length === 0) {
      res.status(404).json({ message: 'User with this email does not exist.' })
      return
    }

    const token = jwt.sign({ userId: rows[0].id }, JWT_SECRET, {
      expiresIn: '15m'
    })
    const resetLink = `${CLIENT_URL}/reset-password?token=${token}`

    await sendResetEmail(email, resetLink)
    res.json({ message: 'Password reset email sent.' })
  } catch (err) {
    res.status(500).json({ message: 'Error sending reset email.' })
  }
}

/**
 * POST /reset-password
 */
export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { token, newPassword } = req.body

  if (!token || !newPassword) {
    res.status(400).json({ message: 'Token and new password are required.' })
    return
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    await pool.query('UPDATE users SET "passwordHash" = $1 WHERE id = $2', [
      hashedPassword,
      decoded.userId
    ])

    res.json({ message: 'Password has been reset successfully.' })
  } catch (err) {
    res.status(400).json({ message: 'Invalid or expired token.' })
  }
}
