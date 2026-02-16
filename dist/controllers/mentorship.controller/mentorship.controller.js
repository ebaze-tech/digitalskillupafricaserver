"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.getAssignedMentees = exports.handleRequestStatus = exports.getRequests = exports.requestMentorship = exports.getMentors = void 0;
const db_config_1 = require("../../config/db.config");
const mentorshipService = __importStar(require("../../services/mentorshipRequest.service"));
const mentor_service_1 = require("../../services/mentor.service");
/**
 * Utility for standardized API responses
 */
const sendError = (res, message, status = 500) => res.status(status).json({ error: message });
const isUUID = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
/**
 * GET /mentors
 * Fetch mentors filtered by skill or industry
 */
const getMentors = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { skill, industry } = req.query;
        const mentors = yield (0, mentor_service_1.findMentors)(skill, industry);
        return res.status(200).json(mentors);
    }
    catch (error) {
        return sendError(res, 'Failed to retrieve mentors.');
    }
});
exports.getMentors = getMentors;
/**
 * POST /mentorship/request
 * Mentee sends a request to a mentor
 */
const requestMentorship = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const menteeId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const { mentorId } = req.body;
    if (!menteeId)
        return sendError(res, 'Unauthorized.', 401);
    if (!isUUID(mentorId))
        return sendError(res, 'Invalid Mentor ID.', 400);
    try {
        const request = yield mentorshipService.sendRequest(menteeId, mentorId);
        return res.status(201).json({
            message: 'Mentorship request submitted.',
            request
        });
    }
    catch (error) {
        return sendError(res, error.message || 'Failed to send request.', error.status);
    }
});
exports.requestMentorship = requestMentorship;
/**
 * GET /mentorship/requests/incoming
 * Mentor views their pending requests
 */
const getRequests = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const mentorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!mentorId)
        return sendError(res, 'Unauthorized.', 401);
    try {
        const requests = yield mentorshipService.getIncomingRequests(mentorId);
        return res.status(200).json(requests);
    }
    catch (error) {
        return sendError(res, 'Failed to fetch incoming requests.');
    }
});
exports.getRequests = getRequests;
/**
 * PATCH /mentorship/requests/:requestId
 * Mentor accepts or rejects a request
 */
const handleRequestStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const mentorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const { requestId } = req.params;
    const { status } = req.body;
    if (!mentorId)
        return sendError(res, 'Unauthorized.', 401);
    if (!['accepted', 'rejected'].includes(status)) {
        return sendError(res, 'Invalid status update. Must be accepted or rejected.', 400);
    }
    try {
        const updatedRequest = yield mentorshipService.updateRequestStatus(requestId, status, mentorId);
        if (!updatedRequest) {
            return sendError(res, 'Request not found or unauthorized.', 404);
        }
        if (status === 'accepted') {
            yield mentorshipService.createMatch(updatedRequest.menteeId, updatedRequest.mentorId);
        }
        return res.status(200).json({
            message: `Mentorship request ${status}.`,
            request: updatedRequest
        });
    }
    catch (error) {
        return sendError(res, 'Failed to update request status.');
    }
});
exports.handleRequestStatus = handleRequestStatus;
/**
 * GET /mentorship/mentees
 * Mentor views their currently assigned mentees
 */
const getAssignedMentees = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const mentorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!mentorId)
        return sendError(res, 'Unauthorized.', 401);
    try {
        const { rows } = yield db_config_1.pool.query(`SELECT u.id, u.username, u.email, u."shortBio"
       FROM mentorship_match mm
       JOIN users u ON mm."menteeId" = u.id
       WHERE mm."mentorId" = $1`, [mentorId]);
        return res.status(200).json(rows);
    }
    catch (error) {
        return sendError(res, 'Failed to get assigned mentees.');
    }
});
exports.getAssignedMentees = getAssignedMentees;
//# sourceMappingURL=mentorship.controller.js.map