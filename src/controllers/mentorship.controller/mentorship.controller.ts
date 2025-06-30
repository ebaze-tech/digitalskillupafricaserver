import { Request, Response } from "express";
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

export const getMentors = async (req: Request, res: Response) => {
  try {
    const { skill, industry } = req.query;
    console.log(skill, industry);

    const mentors = await findMentors(skill as string, industry as string);
    console.log(mentors);

    res.status(200).json(mentors);
    return;
  } catch (error) {
    console.error("Error fetching mentors:", error);
    res.status(500).json({ error: "Internal Server Error" });
    return;
  }
};

export const getMentorById = async (req: Request, res: Response) => {
  try {
    const mentorId = req.user?.mentorId;
    console.log(mentorId + "Mentor ID");

    if (!mentorId) {
      return res.status(400).json({ error: "Mentor ID is required." });
    }

    const { rows } = await pool.query(
      `SELECT * FROM mentors WHERE "mentorId" = $1`,
      [mentorId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Mentor not found." });
    }

    res.status(200).json(rows[0]);
    console.log(rows[0]);
  } catch (error) {
    console.error("Error fetching mentor:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
export const getMenteeById = async (req: Request, res: Response) => {
  try {
    const menteeId = req.user?.menteeId;
    console.log(menteeId + "Mentee ID");

    if (!menteeId) {
      return res.status(400).json({ error: "Mentor ID is required." });
    }

    const { rows } = await pool.query(
      `SELECT * FROM mentees WHERE "menteeId" = $1`,
      [menteeId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Mentor not found." });
    }

    res.status(200).json(rows[0]);
    console.log(rows[0]);
  } catch (error) {
    console.error("Error fetching mentor:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createRequest = async (req: Request, res: Response) => {
  try {
    const { mentorId } = req.body;

    if (!mentorId) {
      return res.status(400).json({ error: "mentorId is required." });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated." });
    }

    const menteeQuery = await pool.query(
      `SELECT "userId" FROM mentees WHERE "userId" = $1`,
      [userId]
    );
    if (menteeQuery.rows.length === 0) {
      return res
        .status(403)
        .json({ error: "User is not registered as a mentee." });
    }

    const mentorQuery = await pool.query(
      `SELECT "userId" FROM mentors WHERE "userId" = $1`,
      [mentorId]
    );
    if (mentorQuery.rows.length === 0) {
      return res.status(404).json({ error: "Mentor not found." });
    }

    const existingRequest = await pool.query(
      `SELECT * FROM mentorship_request WHERE "menteeId" = $1 AND "mentorId" = $2`,
      [userId, mentorId]
    );
    if (existingRequest.rows.length > 0) {
      return res
        .status(409)
        .json({ error: "Mentorship request already sent to this mentor." });
    }

    const request = await sendRequest(userId, mentorId);
    res.status(201).json(request);
  } catch (error) {
    console.error("Error creating mentorship request:", error);
    res.status(500).json({ error: "Failed to create mentorship request." });
  }
};

export const listIncomingRequests = async (req: Request, res: Response) => {
  try {
    const mentorId = req.user?.id;
    console.log("ment" + mentorId + " mentor id");

    if (!mentorId || !isUUID(mentorId)) {
      return res.status(400).json({ error: "Valid mentorId is required." });
    }

    const requests = await getIncomingRequests(mentorId);
    return res.status(200).json(requests);
  } catch (error) {
    console.error("Error listing incoming requests:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch incoming requests." });
  }
};

export const respondToRequest = async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;
    const mentorId = req.user?.id;
    console.log(requestId);

    if (!mentorId) {
      return res.status(401).json({ error: "User not authenticated." });
    }

    console.log(mentorId, status);

    if (!status || !["accepted", "rejected"].includes(status)) {
      return res
        .status(400)
        .json({ error: "Valid status (accepted or rejected) is required." });
    }
    const newRequestId = parseInt(requestId, 10);
    console.log(requestId);

    if (isNaN(newRequestId)) {
      res.status(400).json({ message: "Invalid request ID." });
      return;
    }

    const updatedRequest = await updateRequestStatus(
      newRequestId,
      status as RequestStatus,
      mentorId
    );
    if (!updatedRequest) {
      return res.status(404).json({
        error: "Mentorship request not found or not assigned to this mentor.",
      });
    }
    console.log(updatedRequest);

    if (status === "accepted") {
      // const { menteeId, mentorId } = updatedRequest;
      await createMatch(updatedRequest.menteeId, mentorId);
      return;
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

  console.log(day_of_week, start_time, end_time, mentorId);

  if (!mentorId) {
    res.status(401).json({ error: "Unauthorized or mentor ID missing" });
    return;
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

    res.status(201).json(rows[0]);
    return;
  } catch (error) {
    console.error("Error setting mentor's availability:", error);
    res.status(500).json({ error: "Failed to set mentor's availability" });
    return;
  }
};

export const clearAvailability = async (req: Request, res: Response) => {
  const mentorId = req.user?.mentorId;
  if (!mentorId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    await pool.query(`DELETE FROM mentor_availability WHERE "mentorId" = $1`, [
      mentorId,
    ]);
    res.status(200).json({ message: "Old availability cleared." });
  } catch (error) {
    console.error("Error clearing availability:", error);
    res.status(500).json({ error: "Could not clear availability" });
  }
};

export const getAvailability = async (req: Request, res: Response) => {
  const mentorId = req.user?.mentorId;
  console.log(mentorId);

  try {
    const query = `
    SELECT * FROM mentor_availability WHERE "mentorId" = $1;
  `;
    console.log(query);

    const { rows } = await pool.query(query, [mentorId]);
    console.log(rows);

    res.status(200).json(rows);
    return;
  } catch (error) {
    console.error("Error getting mentor's availability:", error);
    res.status(500).json({ error: "Failed to get mentor's availability" });
    return;
  }
};

export const bookSession = async (req: Request, res: Response) => {
  const { date, start_time, end_time } = req.body;
  const menteeId = req.user?.menteeId;
  const mentorId = req.user?.mentorId;

  console.log(
    `Booking session for: menteeId=${menteeId}, mentorId=${mentorId}, ${
      date + start_time + end_time
    }`
  );

  if (!menteeId || !mentorId) {
    res.status(400).json({
      error: "Both mentorId and authenticated menteeId are required.",
    });
    return;
  }

  if (start_time >= end_time) {
    res.status(400).json({ error: "End time must be after start time." });
    return;
  }

  const isValidDate = (d: any) => !isNaN(Date.parse(d));
  console.log(isValidDate);

  if (!isValidDate(date)) {
    res.status(400).json({ error: "Invalid date format." });
    return;
  }

  const dateFormatted = new Date(date).toISOString().split("T")[0];

  const startTimeFormatted = start_time.slice(0, 5);
  const endTimeFormatted = end_time.slice(0, 5);

  console.log(dateFormatted, startTimeFormatted, endTimeFormatted);

  try {
    const clashCheck = `
      SELECT * FROM session_bookings
      WHERE "mentorId" = $1 AND date = $2
      AND (
        (start_time, end_time) OVERLAPS ($3::time, $4::time)
      );
    `;
    console.log(clashCheck);

    const conflict = await pool.query(clashCheck, [
      mentorId,
      dateFormatted,
      startTimeFormatted,
      endTimeFormatted,
    ]);
    console.log(conflict);

    if (conflict.rows.length > 0) {
      res.status(400).json({
        error: "This time slot is already booked with the mentor.",
      });
      return;
    }

    const insert = `
      INSERT INTO session_bookings ("mentorId", "menteeId", date, start_time, end_time)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    console.log(insert);

    const { rows } = await pool.query(insert, [
      mentorId,
      menteeId,
      date,
      start_time,
      end_time,
    ]);
    console.log(rows);

    res.status(201).json({
      message: "Session booked successfully",
      session: rows[0],
    });
    return;
  } catch (error) {
    console.error("Error booking session:", error);
    res.status(500).json({ error: "Failed to book session. Try again later." });
    return;
  }
};

export const listUpcomingSessions = async (req: Request, res: Response) => {
  const menteeId = req.user?.menteeId;
  const mentorId = req.user?.mentorId;

  console.log(menteeId, mentorId);

  if (!mentorId && !menteeId) {
    res.status(400).json({ error: "User must be a mentor or mentee." });
    return;
  }

  try {
    const query = `
    SELECT * FROM session_bookings
    WHERE 
      (("mentorId" = $1 AND $1 IS NOT NULL) OR
       ("menteeId" = $2 AND $2 IS NOT NULL))
    AND date >= CURRENT_DATE
    ORDER BY date, start_time;
  `;
    console.log(query);

    const { rows } = await pool.query(query, [
      mentorId || null,
      menteeId || null,
    ]);
    console.log(rows);

    res.status(200).json(rows);
    return;
  } catch (error) {
    console.error("Error getting list of upcoming sessions: :", error);
    res.status(500).json({ error: "Failed to get list of upcoming sessions" });
    return;
  }
};
