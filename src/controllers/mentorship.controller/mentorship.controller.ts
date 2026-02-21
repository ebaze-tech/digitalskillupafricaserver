import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import {
  sendRequest,
  getIncomingRequests,
  updateRequestStatus,
  createMatch
} from '../../services/mentorshipRequest.service'
import { findMentors } from '../../services/mentor.service'
import { pool } from '../../config/db.config'

type RequestStatus = 'accepted' | 'rejected'

interface UserPayload {
  id: string
  username: string
  email: string
  role: 'admin' | 'mentor' | 'mentee'
  mentorId?: string
  menteeId?: string
  adminId?: string
}

interface AuthenticatedRequest extends Request {
  user?: UserPayload
}

interface MentorQueryParams {
  skill?: string
  industry?: string
}

interface BookSessionBody {
  date: string
  start_time: string
  end_time: string
  mentorId: string
}

interface AvailabilityBody {
  day_of_week: number
  start_time: string
  end_time: string
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const isValidUUID = (id: string): boolean => UUID_REGEX.test(id)
const isValidDate = (date: any): boolean => !isNaN(Date.parse(date))
const isValidTimeRange = (start: string, end: string): boolean => start < end

export const getMentors = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { skill, industry } = req.query as MentorQueryParams
    const mentors = await findMentors(skill, industry)

    res
      .status(200)
      .json({ message: 'Mentor data fetched successfully', data: mentors })
  } catch (error) {
    console.error('Error fetching mentors:', error)
    res.status(500).json({ message: 'Failed to fetch mentors' })
    return
  }
}

export const getMentorById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const mentorId = req.user?.mentorId

    if (!mentorId) {
      res.status(400).json({ message: 'Mentor ID is required' })
      return
    }

    const { rows } = await pool.query(
      `SELECT 
        a."mentorId", 
        u.id as "userId",
        u.username, 
        u.email, 
        u."shortBio",
        u.goals,
        u.industry,
        u.experience,
        u.availability,
        'mentor' AS role
      FROM mentors a
      JOIN users u ON u.id = a."userId"
      WHERE a."mentorId" = $1`,
      [mentorId]
    )

    if (rows.length === 0) {
      res.status(404).json({ message: 'Mentor not found' })
      return
    }

    res
      .status(200)
      .json({ message: 'Mentor data fetched successfully', data: rows[0] })
    return
  } catch (error) {
    console.error('Error fetching mentor:', error)
    res.status(500).json({ message: 'Failed to fetch mentor' })
    return
  }
}

export const getMenteeById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const menteeId = req.user?.menteeId

    if (!menteeId) {
      res.status(400).json({ message: 'Mentee ID is required' })
      return
    }

    const { rows } = await pool.query(
      `SELECT 
        a."menteeId", 
        u.id as "userId",
        u.username, 
        u.email, 
        u."shortBio",
        u.goals,
        u.industry,
        u.experience,
        'mentee' AS role
      FROM mentees a
      JOIN users u ON u.id = a."userId"
      WHERE a."menteeId" = $1`,
      [menteeId]
    )

    if (rows.length === 0) {
      res.status(404).json({ message: 'Mentee not found' })
      return
    }

    res
      .status(200)
      .json({ message: 'Mentee data fetched successfully', data: rows[0] })
    return
  } catch (error) {
    console.error('Error fetching mentee:', error)
    res.status(500).json({ message: 'Failed to fetch mentee' })
    return
  }
}

export const createRequest = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { mentorId } = req.body
    const userId = req.user?.id

    if (!mentorId) {
      res.status(400).json({ message: 'mentorId is required' })
      return
    }

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' })
      return
    }

    const menteeCheck = await pool.query(
      'SELECT "userId" FROM mentees WHERE "userId" = $1',
      [userId]
    )

    if (menteeCheck.rows.length === 0) {
      res.status(403).json({ message: 'User is not registered as a mentee' })
      return
    }

    const mentorCheck = await pool.query(
      'SELECT "userId" FROM mentors WHERE "userId" = $1',
      [mentorId]
    )

    if (mentorCheck.rows.length === 0) {
      res.status(404).json({ message: 'Mentor not found' })
      return
    }

    const existingRequest = await pool.query(
      'SELECT id FROM mentorship_request WHERE "menteeId" = $1 AND "mentorId" = $2',
      [userId, mentorId]
    )

    if (existingRequest.rows.length > 0) {
      res.status(409).json({ message: 'Request already sent to this mentor' })
      return
    }

    const request = await sendRequest(userId, mentorId)
    res.status(201).json({ message: 'Mentorship request created successfully' })
    return
  } catch (error) {
    console.error('Error creating mentorship request:', error)
    res.status(500).json({ message: 'Failed to create mentorship request' })
    return
  }
}

export const listIncomingRequests = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const mentorId = req.user?.id

    if (!mentorId || !isValidUUID(mentorId)) {
      res.status(400).json({ message: 'Valid mentor ID is required' })
      return
    }

    const requests = await getIncomingRequests(mentorId)
    res.status(200).json({
      message: 'Incoming requests data fetched successfully',
      data: requests
    })
    return
  } catch (error) {
    console.error('Error listing incoming requests:', error)
    res.status(500).json({ message: 'Failed to fetch incoming requests' })
    return
  }
}

export const respondToRequest = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params
    const { status } = req.body
    const mentorId = req.user?.id

    if (!mentorId) {
      res.status(401).json({ message: 'User not authenticated' })
      return
    }

    if (!id || typeof id !== 'string' || id.trim() === '') {
      res.status(400).json({ message: 'Invalid request ID' })
      return
    }

    if (!status || !['accepted', 'rejected'].includes(status)) {
      res
        .status(400)
        .json({ message: 'Valid status (accepted/rejected) is required' })
      return
    }

    const updatedRequest = await updateRequestStatus(
      id,
      status as RequestStatus,
      mentorId
    )

    if (!updatedRequest) {
      res.status(404).json({
        message: 'Request not found or not assigned to this mentor'
      })
      return
    }

    if (status === 'accepted') {
      await createMatch(updatedRequest.menteeId, mentorId)
    }

    res
      .status(200)
      .json({ message: 'Mentorship request accepted successfully' })
    return
  } catch (error) {
    console.error('Error responding to request:', error)
    res.status(500).json({ message: 'Failed to respond to request' })
    return
  }
}

export const getMenteeRequestToMentor = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const menteeId = req.user?.id

    if (!menteeId) {
      res.status(403).json({ message: 'Only mentees can access this' })
      return
    }

    const result = await pool.query(
      `SELECT "mentorId", status, "createdAt" 
       FROM mentorship_request 
       WHERE "menteeId" = $1 
       ORDER BY "createdAt" DESC`,
      [menteeId]
    )

    res.status(200).json({
      message: 'Mentorship requests fetched successfully',
      data: result.rows
    })
    return
  } catch (error) {
    console.error('Error fetching requests:', error)
    res.status(500).json({ message: 'Failed to fetch requests' })
    return
  }
}

export const setAvailability = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { day_of_week, start_time, end_time } = req.body as AvailabilityBody
  const mentorId = req.user?.mentorId

  if (!mentorId) {
    res.status(401).json({ message: 'Unauthorized - mentor ID missing' })
    return
  }

  if (day_of_week === undefined || !start_time || !end_time) {
    res
      .status(400)
      .json({ message: 'day_of_week, start_time, and end_time are required' })
    return
  }

  if (day_of_week < 0 || day_of_week > 6) {
    res.status(400).json({ message: 'day_of_week must be between 0 and 6' })
    return
  }

  if (!isValidTimeRange(start_time, end_time)) {
    res.status(400).json({ message: 'End time must be after start time' })
    return
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO mentor_availability ("mentorId", day_of_week, start_time, end_time)
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT ("mentorId", day_of_week) 
       DO UPDATE SET start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time
       RETURNING *`,
      [mentorId, day_of_week, start_time, end_time]
    )

    res
      .status(201)
      .json({ message: 'Mentor availability set successfully', data: rows[0] })
    return
  } catch (error) {
    console.error('Error setting availability:', error)
    res.status(500).json({ message: 'Failed to set availability' })
    return
  }
}

export const getAvailability = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const mentorId = req.user?.mentorId

  if (!mentorId) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  try {
    const { rows } = await pool.query(
      'SELECT * FROM mentor_availability WHERE "mentorId" = $1 ORDER BY day_of_week',
      [mentorId]
    )

    res.status(200).json({
      message: 'Mentor availability data fetched successfully',
      data: rows
    })
    return
  } catch (error) {
    console.error('Error getting availability:', error)
    res.status(500).json({ message: 'Failed to get availability' })
    return
  }
}

export const clearAvailability = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const mentorId = req.user?.mentorId

  if (!mentorId) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  try {
    await pool.query('DELETE FROM mentor_availability WHERE "mentorId" = $1', [
      mentorId
    ])
    res.status(200).json({ message: 'Availability cleared successfully' })
    return
  } catch (error) {
    console.error('Error clearing availability:', error)
    res.status(500).json({ message: 'Failed to clear availability' })
    return
  }
}

export const bookSession = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { date, start_time, end_time, mentorId } = req.body as BookSessionBody
  const menteeId = req.user?.id

  if (!menteeId || !mentorId) {
    res.status(400).json({
      message: 'Both mentorId and authenticated menteeId are required'
    })
    return
  }

  if (!isValidTimeRange(start_time, end_time)) {
    res.status(400).json({ message: 'End time must be after start time' })
    return
  }

  if (!isValidDate(date)) {
    res.status(400).json({ message: 'Invalid date format' })
    return
  }

  const bookingDate = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (bookingDate < today) {
    res.status(400).json({ message: 'Cannot book sessions in the past' })
    return
  }

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const conflictCheck = await client.query(
      `SELECT id FROM session_bookings 
       WHERE "mentorId" = $1 
         AND date = $2::date
         AND tstzrange(date + start_time, date + end_time) && 
             tstzrange($2::date + $3::time, $2::date + $4::time)`,
      [mentorId, date, start_time, end_time]
    )

    if (conflictCheck.rows.length > 0) {
      await client.query('ROLLBACK')
      res.status(400).json({ message: 'This time slot is already booked' })
      return
    }

    const availabilityCheck = await client.query(
      `SELECT id FROM mentor_availability 
       WHERE "mentorId" = $1 
         AND day_of_week = EXTRACT(DOW FROM $2::date)
         AND start_time <= $3::time 
         AND end_time >= $4::time`,
      [mentorId, date, start_time, end_time]
    )

    if (availabilityCheck.rows.length === 0) {
      await client.query('ROLLBACK')
      res.status(400).json({ message: 'Mentor is not available at this time' })
      return
    }

    const { rows } = await client.query(
      `INSERT INTO session_bookings (id, "mentorId", "menteeId", date, start_time, end_time, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'scheduled')
       RETURNING *`,
      [uuidv4(), mentorId, menteeId, date, start_time, end_time]
    )

    await client.query('COMMIT')

    res.status(201).json({
      message: 'Session booked successfully',
      data: rows[0]
    })
    return
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error booking session:', error)
    res.status(500).json({ message: 'Failed to book session' })
    return
  } finally {
    client.release()
  }
}

export const listUpcomingSessionsForMentor = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const mentorId = req.user?.id

  if (!mentorId) {
    res.status(400).json({ message: 'User must be a mentor' })
    return
  }

  try {
    const { rows } = await pool.query(
      `SELECT 
        sb.id,
        sb.date,
        sb.start_time,
        sb.end_time,
        sb.status,
        u.username AS mentee_username,
        u.email AS mentee_email
      FROM session_bookings sb
      JOIN users u ON u.id = sb."menteeId"
      WHERE sb."mentorId" = $1 
        AND (sb.date > CURRENT_DATE OR 
             (sb.date = CURRENT_DATE AND sb.start_time > CURRENT_TIME))
      ORDER BY sb.date, sb.start_time`,
      [mentorId]
    )

    res.status(200).json({
      message: 'Upcoming mentorship sessions fetched successfully',
      data: rows
    })
    return
  } catch (error) {
    console.error('Error getting mentor sessions:', error)
    res.status(500).json({ message: 'Failed to get upcoming sessions' })
    return
  }
}

export const listUpcomingSessionsForMentee = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const menteeId = req.user?.id

  if (!menteeId) {
    res.status(400).json({ message: 'User must be a mentee' })
    return
  }

  try {
    const { rows } = await pool.query(
      `SELECT 
    sb.id,
    sb.date,
    sb.start_time,
    sb.end_time,
    sb.status,
    u.username AS mentor_username,
    u.email AS mentor_email
  FROM session_bookings sb
  JOIN users u ON u.id = sb."mentorId"
  WHERE sb."menteeId" = $1 
    AND sb.start_time > NOW()
  ORDER BY sb.start_time`,
      [menteeId]
    )

    res.status(200).json({
      message: 'Upcoming mentorship sessions fetched successfully',
      data: rows
    })
  } catch (error) {
    console.error('Error getting mentee sessions:', error)
    res.status(500).json({ message: 'Failed to get upcoming sessions' })
  }
}

export const getAssignedMentees = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const mentorId = req.user?.id

  if (!mentorId) {
    res.status(400).json({ message: 'User must be a mentor' })
    return
  }

  try {
    const { rows } = await pool.query(
      `SELECT 
        u.id,
        u.username,
        u.email,
        u.industry,
        u.experience,
        u."shortBio",
        u.goals,
        mm."createdAt" as matched_since,
        (SELECT COUNT(*) FROM session_bookings sb 
         WHERE sb."menteeId" = u.id AND sb."mentorId" = $1) as session_count
      FROM mentorship_match mm
      JOIN users u ON u.id = mm."menteeId"
      WHERE mm."mentorId" = $1
      ORDER BY mm."createdAt" DESC`,
      [mentorId]
    )

    res.status(200).json({
      message: 'Assigned mentees data fetched successfully',
      data: rows
    })
    return
  } catch (error) {
    console.error('Error fetching assigned mentees:', error)
    res.status(500).json({ message: 'Failed to get assigned mentees' })
    return
  }
}
