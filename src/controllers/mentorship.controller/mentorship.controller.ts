import { Request, Response } from "express";
// import { RequestStatus } from "../../models/mentorship.model/mentorship.model";
import {
  sendRequest,
  getIncomingRequests,
  updateRequestStatus,
} from "../../services/mentorshipRequest.service";
import { findMentors } from "../../services/mentor.service";
import pool from "../../config/db.config";

type RequestStatus = "accepted" | "rejected";

// Utility to validte UUID v4 format
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
    const mentorId = req.query.mentorId || req.params.mentorId;

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

    // const mentorId: string = Array.isArray(mentorIdRaw)
    //   ? String(mentorIdRaw[0])
    //   : mentorIdRaw !== undefined
    //   ? String(mentorIdRaw)
    //   : "";

    // if (!mentorId || !isUUID(mentorId)) {
    //   res.status(400).json({ error: "Valid mentorId is required." });
    //   return;
    // }

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
    const { mentorId } = req.params;

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
    const { id } = req.params;
    const { status } = req.body;

    if (!["accepted", "rejected"].includes(status)) {
      res
        .status(400)
        .json({ message: "Status must be 'accepted' or 'rejected'." });
      return;
    }

    const requestId = parseInt(id, 10);
    if (isNaN(requestId)) {
      res.status(400).json({ message: "Invalid request ID." });
      return;
    }

    const result = await updateRequestStatus(
      requestId,
      status as RequestStatus
    );
    res.status(200).json(result);
    return;
  } catch (error) {
    console.error("Error responding to mentorship request:", error);
    res.status(500).json({ error: "Failed to respond to request." });
    return;
  }
};
