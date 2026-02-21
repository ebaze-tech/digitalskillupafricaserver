import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { pool } from '../../config/db.config'
import sendResetEmail from '../../utils/mailer'

interface JwtPayload {
  userId: string
}

interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    role: 'admin' | 'mentor' | 'mentee'
    email: string
    username: string
    roleId: string
  }
  skils: string[]
  shortBio: string
  goals: string
  industry: string
  experience: string
  availability: string
}

interface User {
  id: string
  username: string
  email: string
  role: 'mentor' | 'mentee' | 'admin'
  passwordHash: string
  shortBio?: string
  goals?: string
  industry?: string
  experience?: string
  availability?: string
  skills?: string[]
}

const JWT_SECRET = process.env.JWT_SECRET
const ACCESS_SECRET = process.env.ACCESS_SECRET
const REFRESH_SECRET = process.env.REFRESH_SECRET

const CLIENT_URL = process.env.CLIENT_URL
const BCRYPT_ROUNDS = 12
const VALID_ROLES = ['mentor', 'mentee', 'admin'] as const

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be defined in environment variables')
}

export const register = async (req: Request, res: Response): Promise<void> => {
  const { username, email, password, role } = req.body

  if (!username || !email || !password || !role) {
    res.status(400).json({ message: 'All fields are required' })
    return
  }

  if (!VALID_ROLES.includes(role)) {
    res.status(400).json({ message: 'Invalid role' })
    return
  }

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1 AND username = $2',
      [email, username]
    )

    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK')
      res.status(400).json({ message: 'Email or username already exists' })
      return
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS)
    const userId = uuidv4()

    const userResult = await client.query(
      `INSERT INTO users (id, username, email, "passwordHash", role) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [userId, username, email, hashedPassword, role]
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
      message: `${role} registered successfully`,
      data: {
        user: {
          id: userId,
          username,
          email,
          role
        },
        roleId
      }
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Registration error:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({
      message: 'Registration failed'
      // error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    })
    return
  } finally {
    client.release()
  }
}

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body

  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required' })
    return
  }

  try {
    const userResult = await pool.query<User>(
      `SELECT id, username, email, role, "passwordHash", "shortBio", goals, 
              industry, experience, availability, 
              array(SELECT s.name FROM user_skills us 
                    JOIN skills s ON us."skillId" = s.id 
                    WHERE us."userId" = users.id) as skills
       FROM users 
       WHERE email = $1`,
      [email]
    )

    const user = userResult.rows[0]

    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' })
      return
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash)

    if (!passwordMatch) {
      res.status(401).json({ message: 'Invalid credentials' })
      return
    }

    const roleTable =
      user.role === 'mentor'
        ? 'mentors'
        : user.role === 'mentee'
        ? 'mentees'
        : 'admins'
    const roleIdColumn =
      user.role === 'mentor'
        ? 'mentorId'
        : user.role === 'mentee'
        ? 'menteeId'
        : 'adminId'

    const roleResult = await pool.query(
      `SELECT "${roleIdColumn}" as id FROM ${roleTable} WHERE "userId" = $1`,
      [user.id]
    )

    const roleId = roleResult.rows[0]?.id

    const tokenPayload = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        roleId
      },
      skills: user.skills || [],
      shortBio: user.shortBio,
      goals: user.goals,
      industry: user.industry,
      experience: user.experience,
      availability: user.availability
    }

    const access_token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: '3d'
    })
    const refresh_token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: '7d'
    })

    res.status(200).json({
      message: 'Login successful',
      accessToken: access_token,
      refreshToken: refresh_token,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        roleId,
        skills: user.skills,
        shortBio: user.shortBio,
        goals: user.goals,
        industry: user.industry,
        experience: user.experience,
        availability: user.availability
      }
    })
    return
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Login failed' })
    return
  }
}

export const verifyToken = async (req: AuthenticatedRequest, res: Response) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'No token provided or malformed header'
    })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const userResult = await pool.query(
      `SELECT id, username, email, r  ole, "shortBio", "goals", "industry",
              "experience", "availability", "profilePictureUrl", "createdAt"
       FROM users WHERE id = $1`,
      [decoded]
    )

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        message: 'User not found'
      })
    }

    const user = userResult.rows[0]

    res.status(200).json({
      message: 'Token is valid',
      data: user
    })
    return
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Token expired'
      })
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        message: 'Invalid token'
      })
    }
    console.error('Token verification error:', error)
    res.status(500).json({
      message: 'Internal server error'
    })
    return
  }
}

export const refreshToken = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { refreshToken } = req.body

  if (!refreshToken) {
    return res
      .status(400)
      .json({ success: false, message: 'Refresh token required' })
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET)

    const tokenHash = hashToken(refreshToken)

    const storedToken = await pool.query(
      `SELECT * FROM refresh_tokens 
       WHERE token_hash = $1 AND revoked = FALSE AND expires_at > NOW()`,
      [tokenHash]
    )

    if (storedToken.rows.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid or expired refresh token' })
    }

    const tokenRecord = storedToken.rows[0]
    const userId = tokenRecord.user_id

    const userResult = await pool.query(
      `SELECT id, username, email, role FROM users WHERE id = $1`,
      [userId]
    )

    if (userResult.rows.length === 0) {
      await pool.query(
        `UPDATE refresh_tokens SET revoked = TRUE WHERE id = $1`,
        [tokenRecord.id]
      )
      return res.status(401).json({ success: false, message: 'User not found' })
    }

    const user = userResult.rows[0]

    const newAccessToken = generateAccessToken(user)
    const newRefreshToken = generateRefreshToken(user)

    if (newRefreshToken) {
      await pool.query(
        `UPDATE refresh_tokens SET revoked = TRUE WHERE id = $1`,
        [tokenRecord.id]
      )

      const newTokenHash = hashToken(newRefreshToken)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      await pool.query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
        [userId, newTokenHash, expiresAt]
      )
    }

    res.status(200).json({
      message: 'Tokens refreshed',
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    })
    return
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res
        .status(401)
        .json({ success: false, message: 'Refresh token expired' })
    }
    if (error.name === 'JsonWebTokenError') {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid refresh token' })
    }
    console.error('Refresh token error:', error)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { email } = req.body

  if (!email) {
    res.status(400).json({ message: 'Email is required' })
    return
  }

  try {
    const userResult = await pool.query<User>(
      'SELECT id FROM users WHERE email = $1',
      [email]
    )

    if (userResult.rows.length === 0) {
      res.json({
        message:
          'If an account exists with this email, a reset link will be sent.'
      })
      return
    }

    const user = userResult.rows[0]
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: '10m'
    })
    const resetLink = `${CLIENT_URL}/reset-password?token=${token}`

    await sendResetEmail(email, resetLink)

    res.json({
      message:
        'If an account exists with this email, a reset link will be sent.'
    })
    return
  } catch (error) {
    console.error('Forgot password error:', error)
    res.status(500).json({ message: 'Unable to process request' })
    return
  }
}

export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { token, newPassword } = req.body

  if (!token || !newPassword) {
    res.status(400).json({ message: 'Token and new password are required' })
    return
  }

  if (newPassword.length < 8) {
    res
      .status(400)
      .json({ message: 'Password must be at least 8 characters long' })
    return
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload

    if (!decoded.userId) {
      res.status(400).json({ message: 'Invalid token format' })
      return
    }

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)

    const result = await pool.query(
      'UPDATE users SET "passwordHash" = $1 WHERE id = $2 RETURNING id',
      [hashedPassword, decoded.userId]
    )

    if (result.rowCount === 0) {
      res.status(404).json({ message: 'User not found' })
      return
    }

    res.json({ message: 'Password reset successful' })
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(400).json({ message: 'Invalid or expired token' })
      return
    } else {
      console.error('Reset password error:', error)
      res.status(500).json({ message: 'Password reset failed' })
      return
    }
  }
}
