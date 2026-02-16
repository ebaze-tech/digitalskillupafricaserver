"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMenteeRequestToMentor = exports.getAssignedMentees = exports.listUpcomingSessionsForMentee = exports.listUpcomingSessionsForMentor = exports.bookSession = exports.getAvailability = exports.clearAvailability = exports.setAvailability = exports.respondToRequest = exports.listIncomingRequests = exports.createRequest = exports.getMenteeById = exports.getMentorById = exports.getMentors = void 0;
console.log("Importing Request and Response from express");
const mentorshipRequest_service_1 = require("../../services/mentorshipRequest.service");
console.log("Importing mentorship request services");
const mentor_service_1 = require("../../services/mentor.service");
console.log("Importing findMentors from mentor.service");
const db_config_1 = require("../../config/db.config");
console.log("Importing pool from db.config");
console.log("Defined RequestStatus type");
const isUUID = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
console.log("Defined isUUID function");
const getMentors = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Entering getMentors function");
    try {
        console.log("Destructuring query parameters");
        const { skill, industry } = req.query;
        console.log("Query parameters:", { skill, industry });
        console.log("Calling findMentors with skill and industry:", { skill, industry });
        const mentors = yield (0, mentor_service_1.findMentors)(skill, industry);
        console.log("Mentors retrieved:", mentors);
        console.log("Sending 200 response with mentors");
        res.status(200).json(mentors);
        console.log("Response sent");
        return;
    }
    catch (error) {
        console.error("Error fetching mentors:", error);
        console.log("Sending 500 response for error");
        res.status(500).json({ error: "Internal Server Error" });
        console.log("Error response sent");
        return;
    }
});
exports.getMentors = getMentors;
console.log("Exported getMentors function");
const getMentorById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log("Entering getMentorById function");
    try {
        console.log("Retrieving mentorId from req.user");
        const id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.mentorId;
        console.log("Mentor ID:", id);
        if (!id) {
            console.log("Mentor ID is missing");
            return res.status(400).json({ error: "Mentor ID is required." });
        }
        console.log("Mentor ID validated");
        console.log("Executing query to fetch mentor");
        const { rows } = yield db_config_1.pool.query(`SELECT 
        a."mentorId", 
        u."id" as "userId",
        u.username, 
        u.email, 
        'mentor' AS role
      FROM mentors a
      JOIN users u ON u.id = a."userId"
      WHERE a."mentorId" = $1
    `, [id]);
        console.log("Query result:", rows);
        if (rows.length === 0) {
            console.log("Mentor not found");
            return res.status(404).json({ error: "Mentor not found." });
        }
        console.log("Mentor found");
        console.log("Sending 200 response with mentor data");
        res.status(200).json(rows[0]);
        console.log("Mentor data:", rows[0]);
    }
    catch (error) {
        console.error("Error fetching mentor:", error);
        console.log("Sending 500 response for error");
        res.status(500).json({ error: "Internal Server Error" });
    }
});
exports.getMentorById = getMentorById;
console.log("Exported getMentorById function");
const getMenteeById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log("Entering getMenteeById function");
    try {
        console.log("Retrieving menteeId from req.user");
        const id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.menteeId;
        console.log("Mentee ID:", id);
        if (!id) {
            console.log("Mentee ID is missing");
            return res.status(400).json({ error: "Mentor ID is required." });
        }
        console.log("Mentee ID validated");
        console.log("Executing query to fetch mentee");
        const { rows } = yield db_config_1.pool.query(`SELECT * FROM mentees WHERE "menteeId" = $1`, [id]);
        console.log("Query result:", rows);
        if (rows.length === 0) {
            console.log("Mentee not found");
            return res.status(404).json({ error: "Mentor not found." });
        }
        console.log("Mentee found");
        console.log("Sending 200 response with mentee data");
        res.status(200).json(rows[0]);
        console.log("Mentee data:", rows[0]);
    }
    catch (error) {
        console.error("Error fetching mentee:", error);
        console.log("Sending 500 response for error");
        res.status(500).json({ error: "Internal Server Error" });
    }
});
exports.getMenteeById = getMenteeById;
console.log("Exported getMenteeById function");
const createRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log("Entering createRequest function");
    try {
        console.log("Destructuring mentorId from req.body");
        const { mentorId } = req.body;
        console.log("Mentor ID:", mentorId);
        if (!mentorId) {
            console.log("Mentor ID is missing");
            return res.status(400).json({ error: "mentorId is required." });
        }
        console.log("Mentor ID validated");
        console.log("Retrieving userId from req.user");
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        console.log("User ID:", userId);
        if (!userId) {
            console.log("User not authenticated");
            return res.status(401).json({ error: "User not authenticated." });
        }
        console.log("User ID validated");
        console.log("Checking if user is a mentee");
        const menteeQuery = yield db_config_1.pool.query(`SELECT "userId" FROM mentees WHERE "userId" = $1`, [userId]);
        console.log("Mentee query result:", menteeQuery.rows);
        if (menteeQuery.rows.length === 0) {
            console.log("User is not a mentee");
            return res
                .status(403)
                .json({ error: "User is not registered as a mentee." });
        }
        console.log("User is a mentee");
        console.log("Checking if mentor exists");
        const mentorQuery = yield db_config_1.pool.query(`SELECT "userId" FROM mentors WHERE "userId" = $1`, [mentorId]);
        console.log("Mentor query result:", mentorQuery.rows);
        if (mentorQuery.rows.length === 0) {
            console.log("Mentor not found");
            return res.status(404).json({ error: "Mentor not found." });
        }
        console.log("Mentor exists");
        console.log("Checking for existing mentorship request");
        const existingRequest = yield db_config_1.pool.query(`SELECT * FROM mentorship_request WHERE "menteeId" = $1 AND "mentorId" = $2`, [userId, mentorId]);
        console.log("Existing request query result:", existingRequest.rows);
        if (existingRequest.rows.length > 0) {
            console.log("Mentorship request already exists");
            return res
                .status(409)
                .json({ error: "Mentorship request already sent to this mentor." });
        }
        console.log("No existing mentorship request found");
        console.log("Creating mentorship request");
        const request = yield (0, mentorshipRequest_service_1.sendRequest)(userId, mentorId);
        console.log("Mentorship request created:", request);
        console.log("Sending 201 response with request data");
        res.status(201).json(request);
    }
    catch (error) {
        console.error("Error creating mentorship request:", error);
        console.log("Sending 500 response for error");
        res.status(500).json({ error: "Failed to create mentorship request." });
    }
});
exports.createRequest = createRequest;
console.log("Exported createRequest function");
const listIncomingRequests = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log("Entering listIncomingRequests function");
    try {
        console.log("Retrieving mentorId from req.user");
        const mentorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        console.log("Mentor ID:", mentorId);
        console.log("Validating mentorId");
        if (!mentorId || !isUUID(mentorId)) {
            console.log("Invalid or missing_forms mentorId");
            return res.status(400).json({ error: "Valid mentorId is required." });
        }
        console.log("Mentor ID validated");
        console.log("Fetching incoming requests");
        const requests = yield (0, mentorshipRequest_service_1.getIncomingRequests)(mentorId);
        console.log("Incoming requests:", requests);
        console.log("Sending 200 response with requests");
        return res.status(200).json(requests);
    }
    catch (error) {
        console.error("Error listing incoming requests:", error);
        console.log("Sending 500 response for error");
        return res
            .status(500)
            .json({ error: "Failed to fetch incoming requests." });
    }
});
exports.listIncomingRequests = listIncomingRequests;
console.log("Exported listIncomingRequests function");
const respondToRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log("Entering respondToRequest function");
    try {
        console.log("Destructuring id from req.params");
        const { id } = req.params;
        console.log("Request ID:", id);
        console.log("Destructuring status from req.body");
        const { status } = req.body;
        console.log("Status:", status);
        console.log("Retrieving mentorId from req.user");
        const mentorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        console.log("Mentor ID:", mentorId);
        if (!mentorId) {
            console.log("User not authenticated");
            return res.status(401).json({ error: "User not authenticated." });
        }
        console.log("Mentor ID validated");
        console.log("Validating request ID");
        if (!id ||
            typeof id !== "string" ||
            id.trim() === "") {
            console.log("Invalid request ID");
            return res.status(400).json({ message: "Invalid request ID." });
        }
        console.log("Request ID validated");
        console.log("Validating status");
        if (!status || !["accepted", "rejected"].includes(status)) {
            console.log("Invalid status");
            return res
                .status(400)
                .json({ error: "Valid status (accepted or rejected) is required." });
        }
        console.log("Status validated");
        console.log("Updating request status");
        const updatedRequest = yield (0, mentorshipRequest_service_1.updateRequestStatus)(id, status, mentorId);
        console.log("Updated request:", updatedRequest);
        if (!updatedRequest) {
            console.log("Request not found or not assigned to mentor");
            return res.status(404).json({
                error: "Mentorship request not found or not assigned to this mentor.",
            });
        }
        console.log("Request updated successfully");
        if (status === "accepted") {
            console.log("Creating match for accepted request");
            yield (0, mentorshipRequest_service_1.createMatch)(updatedRequest.menteeId, mentorId);
            console.log("Match created");
        }
        console.log("Sending 200 response with updated request");
        return res.status(200).json(updatedRequest);
    }
    catch (error) {
        console.error("Error responding to mentorship request:", error);
        console.log("Sending 500 response for error");
        return res.status(500).json({ error: "Failed to respond to request." });
    }
});
exports.respondToRequest = respondToRequest;
console.log("Exported respondToRequest function");
const setAvailability = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log("Entering setAvailability function");
    console.log("Destructuring req.body");
    const { day_of_week, start_time, end_time } = req.body;
    console.log("Request body:", { day_of_week, start_time, end_time });
    console.log("Retrieving mentorId from req.user");
    const mentorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.mentorId;
    console.log("Mentor ID:", mentorId);
    if (!mentorId) {
        console.log("Unauthorized or mentor ID missing");
        res.status(401).json({ error: "Unauthorized or mentor ID missing" });
        console.log("Sent 401 response");
        return;
    }
    console.log("Mentor ID validated");
    try {
        console.log("Defining availability insert query");
        const query = `
      INSERT INTO mentor_availability ("mentorId", day_of_week, start_time, end_time)
      VALUES ($1, $2, $3, $4) RETURNING *;
    `;
        console.log("Query:", query);
        console.log("Executing availability insert query");
        const { rows } = yield db_config_1.pool.query(query, [
            mentorId,
            day_of_week,
            start_time,
            end_time,
        ]);
        console.log("Query result:", rows);
        console.log("Sending 201 response with availability data");
        res.status(201).json(rows[0]);
        console.log("Response sent");
        return;
    }
    catch (error) {
        console.error("Error setting mentor's availability:", error);
        console.log("Sending 500 response for error");
        res.status(500).json({ error: "Failed to set mentor's availability" });
        console.log("Error response sent");
        return;
    }
});
exports.setAvailability = setAvailability;
console.log("Exported setAvailability function");
const clearAvailability = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log("Entering clearAvailability function");
    console.log("Retrieving mentorId from req.user");
    const mentorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.mentorId;
    console.log("Mentor ID:", mentorId);
    if (!mentorId) {
        console.log("Unauthorized");
        return res.status(401).json({ error: "Unauthorized" });
    }
    console.log("Mentor ID validated");
    try {
        console.log("Executing query to clear availability");
        yield db_config_1.pool.query(`DELETE FROM mentor_availability WHERE "mentorId" = $1`, [
            mentorId,
        ]);
        console.log("Availability cleared");
        console.log("Sending 200 response");
        res.status(200).json({ message: "Old availability cleared." });
    }
    catch (error) {
        console.error("Error clearing availability:", error);
        console.log("Sending 500 response for error");
        res.status(500).json({ error: "Could not clear availability" });
    }
});
exports.clearAvailability = clearAvailability;
console.log("Exported clearAvailability function");
const getAvailability = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log("Entering getAvailability function");
    console.log("Authenticated user:", req.user);
    console.log("Retrieving mentorId from req.user");
    const mentorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.mentorId;
    console.log("Mentor ID:", mentorId);
    try {
        console.log("Defining availability query");
        const query = `
    SELECT * FROM mentor_availability WHERE "mentorId" = $1;
  `;
        console.log("Query:", query);
        console.log("Executing availability query");
        const { rows } = yield db_config_1.pool.query(query, [mentorId]);
        console.log("Query result:", rows);
        console.log("Sending 200 response with availability data");
        res.status(200).json(rows);
        console.log("Response sent");
        return;
    }
    catch (error) {
        console.error("Error getting mentor's availability:", error);
        console.log("Sending 500 response for error");
        res.status(500).json({ error: "Failed to get mentor's availability" });
        console.log("Error response sent");
        return;
    }
});
exports.getAvailability = getAvailability;
console.log("Exported getAvailability function");
const bookSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log("Entering bookSession function");
    console.log("Destructuring req.body");
    const { date, start_time, end_time, mentorId } = req.body;
    console.log("Request body:", { date, start_time, end_time, mentorId });
    console.log("Retrieving menteeId from req.user");
    const menteeId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    console.log("Mentee ID:", menteeId);
    console.log("Logging session booking details");
    console.log(`Booking session for: menteeId=${menteeId}, mentorId=${mentorId}, ${date + start_time + end_time}`);
    if (!menteeId || !mentorId) {
        console.log("Missing menteeId or mentorId");
        res.status(400).json({
            error: "Both mentorId and authenticated menteeId are required.",
        });
        console.log("Sent 400 response");
        return;
    }
    console.log("MenteeId and mentorId validated");
    if (start_time >= end_time) {
        console.log("Invalid time range: end_time not after start_time");
        res.status(400).json({ error: "End time must be after start time." });
        console.log("Sent 400 response");
        return;
    }
    console.log("Time range validated");
    console.log("Defining isValidDate function");
    const isValidDate = (d) => !isNaN(Date.parse(d));
    console.log("isValidDate function defined:", isValidDate);
    if (!isValidDate(date)) {
        console.log("Invalid date format");
        res.status(400).json({ error: "Invalid date format." });
        console.log("Sent 400 response");
        return;
    }
    console.log("Date format validated");
    console.log("Formatting date");
    const dateFormatted = new Date(date).toISOString().split("T")[0];
    console.log("Formatted date:", dateFormatted);
    console.log("Formatting start time");
    const startTimeFormatted = start_time.slice(0, 5);
    console.log("Formatted start time:", startTimeFormatted);
    console.log("Formatting end time");
    const endTimeFormatted = end_time.slice(0, 5);
    console.log("Formatted end time:", endTimeFormatted);
    console.log("Logging formatted times");
    console.log("Formatted times:", { dateFormatted, startTimeFormatted, endTimeFormatted });
    try {
        console.log("Defining clash check query");
        const clashCheck = `
      SELECT * FROM session_bookings
      WHERE "mentorId" = $1 AND date = $2
      AND (
        (start_time, end_time) OVERLAPS ($3::time, $4::time)
      );
    `;
        console.log("Clash check query:", clashCheck);
        console.log("Executing clash check query");
        const conflict = yield db_config_1.pool.query(clashCheck, [
            mentorId,
            dateFormatted,
            startTimeFormatted,
            endTimeFormatted,
        ]);
        console.log("Clash check result:", conflict.rows);
        if (conflict.rows.length > 0) {
            console.log("Time slot already booked");
            res.status(400).json({
                error: "This time slot is already booked with the mentor.",
            });
            console.log("Sent 400 response");
            return;
        }
        console.log("No time slot conflicts");
        console.log("Defining session insert query");
        const insert = `
      INSERT INTO session_bookings ("mentorId", "menteeId", date, start_time, end_time)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
        console.log("Insert query:", insert);
        console.log("Executing session insert query");
        const { rows } = yield db_config_1.pool.query(insert, [
            mentorId,
            menteeId,
            date,
            start_time,
            end_time,
        ]);
        console.log("Insert query result:", rows);
        console.log("Sending 201 response with session data");
        res.status(201).json({
            message: "Session booked successfully",
            session: rows[0],
        });
        console.log("Response sent");
        return;
    }
    catch (error) {
        console.error("Error booking session:", error);
        console.log("Sending 500 response for error");
        res.status(500).json({ error: "Failed to book session. Try again later." });
        console.log("Error response sent");
        return;
    }
});
exports.bookSession = bookSession;
console.log("Exported bookSession function");
const listUpcomingSessionsForMentor = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log("Entering listUpcomingSessionsForMentor function");
    console.log("Retrieving mentorId from req.user");
    const mentorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    console.log("Mentor ID:", mentorId);
    if (!mentorId) {
        console.log("User is not a mentor");
        return res.status(400).json({ error: "User must be a mentor." });
    }
    console.log("Mentor ID validated");
    try {
        console.log("Defining query for upcoming sessions");
        const query = `
      SELECT 
        sb.id,
        sb.date,
        sb.start_time,
        sb.end_time,
        u.username AS username,
        u.email AS email
      FROM session_bookings sb
      JOIN users u ON u.id = sb."menteeId"
      WHERE sb."mentorId" = $1 AND sb.date >= CURRENT_DATE
      ORDER BY sb.date, sb.start_time;
    `;
        console.log("Query:", query);
        console.log("Executing query");
        const { rows } = yield db_config_1.pool.query(query, [mentorId]);
        console.log("Query result:", rows);
        console.log("Sending 200 response with sessions");
        res.status(200).json(rows);
    }
    catch (error) {
        console.error("Error getting upcoming sessions for mentor:", error);
        console.log("Sending 500 response for error");
        res.status(500).json({ error: "Failed to get list of upcoming sessions" });
    }
});
exports.listUpcomingSessionsForMentor = listUpcomingSessionsForMentor;
console.log("Exported listUpcomingSessionsForMentor function");
const listUpcomingSessionsForMentee = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log("Entering listUpcomingSessionsForMentee function");
    console.log("Retrieving menteeId from req.user");
    const menteeId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    console.log("Mentee ID:", menteeId);
    if (!menteeId) {
        console.log("User is not a mentee");
        return res.status(400).json({ error: "User must be a mentee." });
    }
    console.log("Mentee ID validated");
    try {
        console.log("Defining query for upcoming sessions");
        const query = `
      SELECT 
        sb.id,
        sb.date,
        sb.start_time,
        sb.end_time,
        u.username AS username,
        u.email AS email
      FROM session_bookings sb
      JOIN users u ON u.id = sb."mentorId"
      WHERE sb."menteeId" = $1 AND sb.date >= CURRENT_DATE
      ORDER BY sb.date, sb.start_time;
    `;
        console.log("Query:", query);
        console.log("Executing query");
        const { rows } = yield db_config_1.pool.query(query, [menteeId]);
        console.log("Query result:", rows);
        console.log("Sending 200 response with sessions");
        res.status(200).json(rows);
    }
    catch (error) {
        console.error("Error getting upcoming sessions for mentee:", error);
        console.log("Sending 500 response for error");
        res.status(500).json({ error: "Failed to get list of upcoming sessions" });
    }
});
exports.listUpcomingSessionsForMentee = listUpcomingSessionsForMentee;
console.log("Exported listUpcomingSessionsForMentee function");
const getAssignedMentees = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log("Entering getAssignedMentees function");
    console.log("Retrieving mentorId from req.user");
    const mentorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    console.log("Mentor ID:", mentorId);
    if (!mentorId) {
        console.log("User is not a mentor");
        return res.status(400).json({ error: "User must be a mentor" });
    }
    console.log("Mentor ID validated");
    try {
        console.log("Defining query for assigned mentees");
        const query = `
      SELECT 
        u.id,
        u.username,
        u.email,
        u.industry,
        u.experience,
        mm."createdAt"
      FROM mentorship_match mm
      JOIN users u ON u.id = mm."menteeId"
      WHERE mm."mentorId" = $1
    `;
        console.log("Query:", query);
        console.log("Executing query");
        const { rows } = yield db_config_1.pool.query(query, [mentorId]);
        console.log("Query result:", rows);
        console.log("Sending 200 response with mentees");
        res.status(200).json(rows);
    }
    catch (error) {
        console.error("Error fetching assigned mentees:", error);
        console.log("Sending 500 response for error");
        res.status(500).json({ error: "Failed to get assigned mentees" });
    }
});
exports.getAssignedMentees = getAssignedMentees;
console.log("Exported getAssignedMentees function");
const getMenteeRequestToMentor = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log("Entering getMenteeRequestToMentor function");
    console.log("Retrieving menteeId from req.user");
    const menteeId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    console.log("Mentee ID:", menteeId);
    if (!menteeId) {
        console.log("Only mentees can access this");
        return res.status(403).json({ error: "Only mentees can access this." });
    }
    console.log("Mentee ID validated");
    try {
        console.log("Executing query to fetch mentorship requests");
        const result = yield db_config_1.pool.query(`SELECT "mentorId", status FROM mentorship_request WHERE "menteeId" = $1`, [menteeId]);
        console.log("Query result:", result.rows);
        console.log("First row of result:", result.rows[0]);
        console.log("Sending response with requests");
        res.json(result.rows);
    }
    catch (err) {
        console.error("Error fetching requests:", err);
        console.log("Sending 500 response for error");
        res.status(500).json({ error: "Failed to fetch requests" });
    }
});
exports.getMenteeRequestToMentor = getMenteeRequestToMentor;
console.log("Exported getMenteeRequestToMentor function");
//# sourceMappingURL=mentorship.controller.js.map