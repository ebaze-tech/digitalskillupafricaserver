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
exports.getAssignedMentees = exports.listUpcomingSessionsForMentee = exports.listUpcomingSessionsForMentor = exports.bookSession = exports.clearAvailability = exports.getAvailability = exports.setAvailability = exports.getMenteeRequestToMentor = exports.respondToRequest = exports.listIncomingRequests = exports.createRequest = exports.getMenteeById = exports.getMentorById = exports.getMentors = void 0;
const uuid_1 = require("uuid");
const mentorshipRequest_service_1 = require("../../services/mentorshipRequest.service");
const mentor_service_1 = require("../../services/mentor.service");
const db_config_1 = require("../../config/db.config");
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValidUUID = (id) => UUID_REGEX.test(id);
const isValidDate = (date) => !isNaN(Date.parse(date));
const isValidTimeRange = (start, end) => start < end;
const getMentors = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { skill, industry } = req.query;
        const mentors = yield (0, mentor_service_1.findMentors)(skill, industry);
        res
            .status(200)
            .json({ message: 'Mentor data fetched successfully', data: mentors });
    }
    catch (error) {
        console.error('Error fetching mentors:', error);
        res.status(500).json({ message: 'Failed to fetch mentors' });
        return;
    }
});
exports.getMentors = getMentors;
const getMentorById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const mentorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.mentorId;
        if (!mentorId) {
            res.status(400).json({ message: 'Mentor ID is required' });
            return;
        }
        const { rows } = yield db_config_1.pool.query(`SELECT 
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
      WHERE a."mentorId" = $1`, [mentorId]);
        if (rows.length === 0) {
            res.status(404).json({ message: 'Mentor not found' });
            return;
        }
        res
            .status(200)
            .json({ message: 'Mentor data fetched successfully', data: rows[0] });
        return;
    }
    catch (error) {
        console.error('Error fetching mentor:', error);
        res.status(500).json({ message: 'Failed to fetch mentor' });
        return;
    }
});
exports.getMentorById = getMentorById;
const getMenteeById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const menteeId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.menteeId;
        if (!menteeId) {
            res.status(400).json({ message: 'Mentee ID is required' });
            return;
        }
        const { rows } = yield db_config_1.pool.query(`SELECT 
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
      WHERE a."menteeId" = $1`, [menteeId]);
        if (rows.length === 0) {
            res.status(404).json({ message: 'Mentee not found' });
            return;
        }
        res
            .status(200)
            .json({ message: 'Mentee data fetched successfully', data: rows[0] });
        return;
    }
    catch (error) {
        console.error('Error fetching mentee:', error);
        res.status(500).json({ message: 'Failed to fetch mentee' });
        return;
    }
});
exports.getMenteeById = getMenteeById;
const createRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { mentorId } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!mentorId) {
            res.status(400).json({ message: 'mentorId is required' });
            return;
        }
        if (!userId) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }
        const menteeCheck = yield db_config_1.pool.query('SELECT "userId" FROM mentees WHERE "userId" = $1', [userId]);
        if (menteeCheck.rows.length === 0) {
            res.status(403).json({ message: 'User is not registered as a mentee' });
            return;
        }
        const mentorCheck = yield db_config_1.pool.query('SELECT "userId" FROM mentors WHERE "userId" = $1', [mentorId]);
        if (mentorCheck.rows.length === 0) {
            res.status(404).json({ message: 'Mentor not found' });
            return;
        }
        const existingRequest = yield db_config_1.pool.query('SELECT id FROM mentorship_request WHERE "menteeId" = $1 AND "mentorId" = $2', [userId, mentorId]);
        if (existingRequest.rows.length > 0) {
            res.status(409).json({ message: 'Request already sent to this mentor' });
            return;
        }
        const request = yield (0, mentorshipRequest_service_1.sendRequest)(userId, mentorId);
        res.status(201).json({ message: 'Mentorship request created successfully' });
        return;
    }
    catch (error) {
        console.error('Error creating mentorship request:', error);
        res.status(500).json({ message: 'Failed to create mentorship request' });
        return;
    }
});
exports.createRequest = createRequest;
const listIncomingRequests = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const mentorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!mentorId || !isValidUUID(mentorId)) {
            res.status(400).json({ message: 'Valid mentor ID is required' });
            return;
        }
        const requests = yield (0, mentorshipRequest_service_1.getIncomingRequests)(mentorId);
        res.status(200).json({
            message: 'Incoming requests data fetched successfully',
            data: requests
        });
        return;
    }
    catch (error) {
        console.error('Error listing incoming requests:', error);
        res.status(500).json({ message: 'Failed to fetch incoming requests' });
        return;
    }
});
exports.listIncomingRequests = listIncomingRequests;
const respondToRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const { status } = req.body;
        const mentorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!mentorId) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }
        if (!id || typeof id !== 'string' || id.trim() === '') {
            res.status(400).json({ message: 'Invalid request ID' });
            return;
        }
        if (!status || !['accepted', 'rejected'].includes(status)) {
            res
                .status(400)
                .json({ message: 'Valid status (accepted/rejected) is required' });
            return;
        }
        const updatedRequest = yield (0, mentorshipRequest_service_1.updateRequestStatus)(id, status, mentorId);
        if (!updatedRequest) {
            res.status(404).json({
                message: 'Request not found or not assigned to this mentor'
            });
            return;
        }
        if (status === 'accepted') {
            yield (0, mentorshipRequest_service_1.createMatch)(updatedRequest.menteeId, mentorId);
        }
        res
            .status(200)
            .json({ message: 'Mentorship request accepted successfully' });
        return;
    }
    catch (error) {
        console.error('Error responding to request:', error);
        res.status(500).json({ message: 'Failed to respond to request' });
        return;
    }
});
exports.respondToRequest = respondToRequest;
const getMenteeRequestToMentor = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const menteeId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!menteeId) {
            res.status(403).json({ message: 'Only mentees can access this' });
            return;
        }
        const result = yield db_config_1.pool.query(`SELECT "mentorId", status, "createdAt" 
       FROM mentorship_request 
       WHERE "menteeId" = $1 
       ORDER BY "createdAt" DESC`, [menteeId]);
        res.status(200).json({
            message: 'Mentorship requests fetched successfully',
            data: result.rows
        });
        return;
    }
    catch (error) {
        console.error('Error fetching requests:', error);
        res.status(500).json({ message: 'Failed to fetch requests' });
        return;
    }
});
exports.getMenteeRequestToMentor = getMenteeRequestToMentor;
const setAvailability = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { day_of_week, start_time, end_time } = req.body;
    const mentorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.mentorId;
    if (!mentorId) {
        res.status(401).json({ message: 'Unauthorized - mentor ID missing' });
        return;
    }
    if (day_of_week === undefined || !start_time || !end_time) {
        res
            .status(400)
            .json({ message: 'day_of_week, start_time, and end_time are required' });
        return;
    }
    if (day_of_week < 0 || day_of_week > 6) {
        res.status(400).json({ message: 'day_of_week must be between 0 and 6' });
        return;
    }
    if (!isValidTimeRange(start_time, end_time)) {
        res.status(400).json({ message: 'End time must be after start time' });
        return;
    }
    try {
        const { rows } = yield db_config_1.pool.query(`INSERT INTO mentor_availability ("mentorId", day_of_week, start_time, end_time)
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT ("mentorId", day_of_week) 
       DO UPDATE SET start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time
       RETURNING *`, [mentorId, day_of_week, start_time, end_time]);
        res
            .status(201)
            .json({ message: 'Mentor availability set successfully', data: rows[0] });
        return;
    }
    catch (error) {
        console.error('Error setting availability:', error);
        res.status(500).json({ message: 'Failed to set availability' });
        return;
    }
});
exports.setAvailability = setAvailability;
const getAvailability = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const mentorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.mentorId;
    if (!mentorId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    try {
        const { rows } = yield db_config_1.pool.query('SELECT * FROM mentor_availability WHERE "mentorId" = $1 ORDER BY day_of_week', [mentorId]);
        res.status(200).json({
            message: 'Mentor availability data fetched successfully',
            data: rows
        });
        return;
    }
    catch (error) {
        console.error('Error getting availability:', error);
        res.status(500).json({ message: 'Failed to get availability' });
        return;
    }
});
exports.getAvailability = getAvailability;
const clearAvailability = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const mentorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.mentorId;
    if (!mentorId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    try {
        yield db_config_1.pool.query('DELETE FROM mentor_availability WHERE "mentorId" = $1', [
            mentorId
        ]);
        res.status(200).json({ message: 'Availability cleared successfully' });
        return;
    }
    catch (error) {
        console.error('Error clearing availability:', error);
        res.status(500).json({ message: 'Failed to clear availability' });
        return;
    }
});
exports.clearAvailability = clearAvailability;
const bookSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { date, start_time, end_time, mentorId } = req.body;
    const menteeId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!menteeId || !mentorId) {
        res.status(400).json({
            message: 'Both mentorId and authenticated menteeId are required'
        });
        return;
    }
    if (!isValidTimeRange(start_time, end_time)) {
        res.status(400).json({ message: 'End time must be after start time' });
        return;
    }
    if (!isValidDate(date)) {
        res.status(400).json({ message: 'Invalid date format' });
        return;
    }
    const bookingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (bookingDate < today) {
        res.status(400).json({ message: 'Cannot book sessions in the past' });
        return;
    }
    const client = yield db_config_1.pool.connect();
    try {
        yield client.query('BEGIN');
        const conflictCheck = yield client.query(`SELECT id FROM session_bookings 
       WHERE "mentorId" = $1 
         AND date = $2::date
         AND tstzrange(date + start_time, date + end_time) && 
             tstzrange($2::date + $3::time, $2::date + $4::time)`, [mentorId, date, start_time, end_time]);
        if (conflictCheck.rows.length > 0) {
            yield client.query('ROLLBACK');
            res.status(400).json({ message: 'This time slot is already booked' });
            return;
        }
        const availabilityCheck = yield client.query(`SELECT id FROM mentor_availability 
       WHERE "mentorId" = $1 
         AND day_of_week = EXTRACT(DOW FROM $2::date)
         AND start_time <= $3::time 
         AND end_time >= $4::time`, [mentorId, date, start_time, end_time]);
        if (availabilityCheck.rows.length === 0) {
            yield client.query('ROLLBACK');
            res.status(400).json({ message: 'Mentor is not available at this time' });
            return;
        }
        const { rows } = yield client.query(`INSERT INTO session_bookings (id, "mentorId", "menteeId", date, start_time, end_time, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'scheduled')
       RETURNING *`, [(0, uuid_1.v4)(), mentorId, menteeId, date, start_time, end_time]);
        yield client.query('COMMIT');
        res.status(201).json({
            message: 'Session booked successfully',
            data: rows[0]
        });
        return;
    }
    catch (error) {
        yield client.query('ROLLBACK');
        console.error('Error booking session:', error);
        res.status(500).json({ message: 'Failed to book session' });
        return;
    }
    finally {
        client.release();
    }
});
exports.bookSession = bookSession;
const listUpcomingSessionsForMentor = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const mentorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!mentorId) {
        res.status(400).json({ message: 'User must be a mentor' });
        return;
    }
    try {
        const { rows } = yield db_config_1.pool.query(`SELECT 
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
      ORDER BY sb.date, sb.start_time`, [mentorId]);
        if (rows.length === 0) {
            res.status(404).json({ message: 'No mentorship sessions found' });
            return;
        }
        res.status(200).json({
            message: 'Upcoming mentorship sessions fetched successfully',
            data: rows
        });
        return;
    }
    catch (error) {
        console.error('Error getting mentor sessions:', error);
        res.status(500).json({ message: 'Failed to get upcoming sessions' });
        return;
    }
});
exports.listUpcomingSessionsForMentor = listUpcomingSessionsForMentor;
const listUpcomingSessionsForMentee = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const menteeId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!menteeId) {
        res.status(400).json({ message: 'User must be a mentee' });
        return;
    }
    try {
        const { rows } = yield db_config_1.pool.query(`SELECT 
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
  ORDER BY sb.start_time`, [menteeId]);
        if (rows.length === 0) {
            res.status(404).json({ message: 'No mentorship sessions found' });
            return;
        }
        res.status(200).json({
            message: 'Upcoming mentorship sessions fetched successfully',
            data: rows
        });
    }
    catch (error) {
        console.error('Error getting mentee sessions:', error);
        res.status(500).json({ message: 'Failed to get upcoming sessions' });
    }
});
exports.listUpcomingSessionsForMentee = listUpcomingSessionsForMentee;
const getAssignedMentees = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const mentorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!mentorId) {
        res.status(400).json({ message: 'User must be a mentor' });
        return;
    }
    try {
        const { rows } = yield db_config_1.pool.query(`SELECT 
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
      ORDER BY mm."createdAt" DESC`, [mentorId]);
        res.status(200).json({
            message: 'Assigned mentees data fetched successfully',
            data: rows
        });
        return;
    }
    catch (error) {
        console.error('Error fetching assigned mentees:', error);
        res.status(500).json({ message: 'Failed to get assigned mentees' });
        return;
    }
});
exports.getAssignedMentees = getAssignedMentees;
//# sourceMappingURL=mentorship.controller.js.map