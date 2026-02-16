import { Request, Response } from 'express'
import { pool } from '../../config/db.config'
import * as mentorshipService from '../../services/mentorshipRequest.service'
import { findMentors } from '../../services/mentor.service'

/**
 * Utility for standardized API responses
 */
const sendError = (res: Response, message: string, status = 500) =>
  res.status(status).json({ error: message })

const isUUID = (id: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id
  )

/**
 * GET /mentors
 * Fetch mentors filtered by skill or industry
 */
export const getMentors = async (req: Request, res: Response) => {
  try {
    const { skill, industry } = req.query
    const mentors = await findMentors(skill as string, industry as string)
    return res.status(200).json(mentors)
  } catch (error) {
    return sendError(res, 'Failed to retrieve mentors.')
  }
}

/**
 * POST /mentorship/request
 * Mentee sends a request to a mentor
 */
export const requestMentorship = async (req: Request, res: Response) => {
  const menteeId = req.user?.id
  const { mentorId } = req.body

  if (!menteeId) return sendError(res, 'Unauthorized.', 401)
  if (!isUUID(mentorId)) return sendError(res, 'Invalid Mentor ID.', 400)

  try {
    const request = await mentorshipService.sendRequest(menteeId, mentorId)
    return res.status(201).json({
      message: 'Mentorship request submitted.',
      request
    })
  } catch (error: any) {
    return sendError(
      res,
      error.message || 'Failed to send request.',
      error.status
    )
  }
}

/**
 * GET /mentorship/requests/incoming
 * Mentor views their pending requests
 */
export const getRequests = async (req: Request, res: Response) => {
  const mentorId = req.user?.id
  if (!mentorId) return sendError(res, 'Unauthorized.', 401)

  try {
    const requests = await mentorshipService.getIncomingRequests(mentorId)
    return res.status(200).json(requests)
  } catch (error) {
    return sendError(res, 'Failed to fetch incoming requests.')
  }
}

/**
 * PATCH /mentorship/requests/:requestId
 * Mentor accepts or rejects a request
 */
export const handleRequestStatus = async (req: Request, res: Response) => {
  const mentorId = req.user?.id
  const { requestId } = req.params
  const { status } = req.body

  if (!mentorId) return sendError(res, 'Unauthorized.', 401)
  if (!['accepted', 'rejected'].includes(status)) {
    return sendError(
      res,
      'Invalid status update. Must be accepted or rejected.',
      400
    )
  }

  try {
    const updatedRequest = await mentorshipService.updateRequestStatus(
      requestId as string,
      status,
      mentorId
    )

    if (!updatedRequest) {
      return sendError(res, 'Request not found or unauthorized.', 404)
    }

    if (status === 'accepted') {
      await mentorshipService.createMatch(
        updatedRequest.menteeId,
        updatedRequest.mentorId
      )
    }

    return res.status(200).json({
      message: `Mentorship request ${status}.`,
      request: updatedRequest
    })
  } catch (error) {
    return sendError(res, 'Failed to update request status.')
  }
}

/**
 * GET /mentorship/mentees
 * Mentor views their currently assigned mentees
 */
export const getAssignedMentees = async (req: Request, res: Response) => {
  const mentorId = req.user?.id
  if (!mentorId) return sendError(res, 'Unauthorized.', 401)

  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.username, u.email, u."shortBio"
       FROM mentorship_match mm
       JOIN users u ON mm."menteeId" = u.id
       WHERE mm."mentorId" = $1`,
      [mentorId]
    )
    return res.status(200).json(rows)
  } catch (error) {
    return sendError(res, 'Failed to get assigned mentees.')
  }
}
