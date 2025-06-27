import { Request, Response } from "express";
// import { RequestStatus } from "../../models/mentorship.model/mentorship.model";
import {
  sendRequest,
  getIncomingRequests,
  updateRequestStatus,
  createMatch,
} from "../../services/mentorshipRequest.service";
import { findMentors } from "../../services/mentor.service";
import { pool } from "../../config/db.config";

type RequestStatus = "accepted" | "rejected";

const isUUID = (id: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

/**
 * GET /mentors
 * @desc Fetch mentors filtered by skill and/or industry
 */
export const getMentors = async (req: Request, res: Response) => {
  try {
    const { skill, industry } = req.query;
    const mentors = await findMentors(skill as string, industry as string);
    res.status(200).json(mentors);
    return;
  } catch (error) {
    console.error("Error fetching mentors:", error);
    res.status(500).json({ error: "Internal Server Error" });
    return;
  }
};

/**
 * POST /mentorship/request
 * @desc Create a mentorship request from a mentee to a mentor
 */
export const createRequest = async (req: Request, res: Response) => {
  try {
    const { requestMentor } = req.body;
    const mentorId = req.user?.mentorId;

    if (typeof requestMentor !== "boolean")
      res
        .status(400)
        .json({ error: "Field 'requestMentor' must be a boolean." });

    const mentorQuery = await pool.query(
      `SELECT "userId" FROM mentors WHERE "mentorId" = $1`,
      [mentorId]
    );
    if (mentorQuery.rows.length === 0) {
      return res.status(404).json({ error: "Mentor not found." });
    }
    const mentorUserId = mentorQuery.rows[0].userId;

    if (!requestMentor)
      res.status(200).json({ message: "No mentorship request sent." });

    const rawUserId = req.user?.id;

    const menteeQuery = await pool.query(
      `SELECT "menteeId" FROM mentees WHERE "userId" = $1`,
      [rawUserId]
    );
    if (menteeQuery.rows.length === 0) {
      return res
        .status(403)
        .json({ error: "User is not registered as a mentee." });
    }
    const menteeId = menteeQuery.rows[0].menteeId;

    const request = await sendRequest(menteeId, mentorUserId);
    res.status(201).json(request);
    return;
  } catch (error) {
    console.error("Error creating mentorship request:", error);
    res.status(500).json({ error: "Failed to create mentorship request." });
    return;
  }
};

/**
 * GET /mentorship/incoming/:mentorId
 * @desc List incoming mentorship requests for a mentor
 */
export const listIncomingRequests = async (req: Request, res: Response) => {
  try {
    const mentorId = req.user?.mentorId;

    if (!mentorId || !isUUID(mentorId)) {
      res.status(400).json({ error: "Valid mentorId is required." });
      return;
    }

    const requests = await getIncomingRequests(mentorId);
    res.status(200).json(requests);
    return;
  } catch (error) {
    console.error("Error listing incoming requests:", error);
    res.status(500).json({ error: "Failed to fetch incoming requests." });
    return;
  }
};

/**
 * POST /mentorship/respond/:id
 * @desc Respond to a mentorship request (accept/reject)
 */
export const respondToRequest = async (req: Request, res: Response) => {
  try {
    const id = req.user?.id;
    const { status } = req.body;

    if (!["accepted", "rejected"].includes(status)) {
      res
        .status(400)
        .json({ message: "Status must be 'accepted' or 'rejected'." });
      return;
    }

    if (typeof id !== "string") {
      res.status(400).json({ message: "Request ID is required." });
      return;
    }

    const requestId = parseInt(id, 10);
    if (isNaN(requestId)) {
      res.status(400).json({ message: "Invalid request ID." });
      return;
    }

    const updatedRequest = await updateRequestStatus(
      requestId,
      status as RequestStatus
    );
    if (status === "accepted") {
      const { menteeId, mentorId } = updatedRequest;
      await createMatch(menteeId, mentorId);
    }
    res.status(200).json(updatedRequest);
    return;
  } catch (error) {
    console.error("Error responding to mentorship request:", error);
    res.status(500).json({ error: "Failed to respond to request." });
    return;
  }
};

export const setAvailability = async (req: Request, res: Response) => {
  const { day_of_week, start_time, end_time } = req.body;
  const mentorId = req.user?.mentorId;

  console.log("Mentor ID from user context:", mentorId);

  if (!mentorId) {
    return res.status(401).json({ error: "Unauthorized or mentor ID missing" });
  }

  try {
    const query = `
      INSERT INTO mentor_availability ("mentorId", day_of_week, start_time, end_time)
      VALUES ($1, $2, $3, $4) RETURNING *;
    `;

    const { rows } = await pool.query(query, [
      mentorId,
      day_of_week,
      start_time,
      end_time,
    ]);

    return res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Error setting mentorship availability:", error);
    return res.status(500).json({ error: "Failed to set availability" });
  }
};
export const getAvailability = async (req: Request, res: Response) => {
  const mentorId = req.user?.mentorId;

  const query = `
    SELECT * FROM mentor_availability WHERE "mentorId" = $1;
  `;

  const { rows } = await pool.query(query, [mentorId]);
  res.status(200).json(rows);
};

export const bookSession = async (req: Request, res: Response) => {
  const { date, start_time, end_time } = req.body;
  const menteeId = req.user?.menteeId;
  const { mentorId } = req.params;

  console.log("Booking session for:", { menteeId, mentorId });

  if (!menteeId || !mentorId) {
    return res.status(400).json({
      error: "Both mentorId and authenticated menteeId are required.",
    });
  }

  if (start_time >= end_time) {
    return res
      .status(400)
      .json({ error: "End time must be after start time." });
  }

  const isValidDate = (d: any) => !isNaN(Date.parse(d));

  if (!isValidDate(date)) {
    return res.status(400).json({ error: "Invalid date format." });
  }

  const dateFormatted = new Date(date).toISOString().split("T")[0];

  const startTimeFormatted = start_time.slice(0, 5);
  const endTimeFormatted = end_time.slice(0, 5);

  try {
    const clashCheck = `
      SELECT * FROM session_bookings
      WHERE "mentorId" = $1 AND date = $2
      AND (
        (start_time, end_time) OVERLAPS ($3::time, $4::time)
      );
    `;

    const conflict = await pool.query(clashCheck, [
      mentorId,
      dateFormatted,
      startTimeFormatted,
      endTimeFormatted,
    ]);

    if (conflict.rows.length > 0) {
      return res.status(400).json({
        error: "This time slot is already booked with the mentor.",
      });
    }

    const insert = `
      INSERT INTO session_bookings ("mentorId", "menteeId", date, start_time, end_time)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;

    const { rows } = await pool.query(insert, [
      mentorId,
      menteeId,
      date,
      start_time,
      end_time,
    ]);

    res.status(201).json({
      message: "Session booked successfully",
      session: rows[0],
    });
  } catch (error) {
    console.error("Error booking session:", error);
    res.status(500).json({ error: "Failed to book session. Try again later." });
  }
};

export const listUpcomingSessions = async (req: Request, res: Response) => {
  const { mentorId, menteeId } = req.user || {};

  if (!mentorId && !menteeId) {
    return res.status(400).json({ error: "User must be a mentor or mentee." });
  }

  const query = `
    SELECT * FROM session_bookings
    WHERE 
      (("mentorId" = $1 AND $1 IS NOT NULL) OR
       ("menteeId" = $2 AND $2 IS NOT NULL))
    AND date >= CURRENT_DATE
    ORDER BY date, start_time;
  `;

  const { rows } = await pool.query(query, [
    mentorId || null,
    menteeId || null,
  ]);
  res.status(200).json(rows);
};
