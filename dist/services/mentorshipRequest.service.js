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
exports.createMatch = exports.updateRequestStatus = exports.getIncomingRequests = exports.sendRequest = void 0;
const db_config_1 = require("../config/db.config");
/**
 * Common columns returned when fetching request details
 * Joining users table is cleaner than multiple subqueries.
 */
const REQUEST_DETAIL_COLUMNS = `
  r.id, r.status, r."createdAt", r."menteeId", r."mentorId",
  u.username, u.email
`;
const sendRequest = (menteeId, mentorId) => __awaiter(void 0, void 0, void 0, function* () {
    const query = `
    WITH inserted AS (
      INSERT INTO mentorship_request ("menteeId", "mentorId", status, "createdAt")
      VALUES ($1, $2, 'pending', NOW())
      RETURNING *
    )
    SELECT ${REQUEST_DETAIL_COLUMNS}
    FROM inserted r
    JOIN users u ON r."menteeId" = u.id;
  `;
    const { rows } = yield db_config_1.pool.query(query, [menteeId, mentorId]);
    return rows[0];
});
exports.sendRequest = sendRequest;
const getIncomingRequests = (mentorId) => __awaiter(void 0, void 0, void 0, function* () {
    const query = `
    SELECT ${REQUEST_DETAIL_COLUMNS}
    FROM mentorship_request r
    JOIN users u ON r."menteeId" = u.id
    WHERE r."mentorId" = $1
    ORDER BY r."createdAt" DESC;
  `;
    const { rows } = yield db_config_1.pool.query(query, [mentorId]);
    return rows;
});
exports.getIncomingRequests = getIncomingRequests;
const updateRequestStatus = (id, status, mentorId) => __awaiter(void 0, void 0, void 0, function* () {
    // Use a single query to check existence and update simultaneously
    const query = `
    UPDATE mentorship_request r
    SET status = $1, "updatedAt" = NOW()
    FROM users u
    WHERE r.id = $2 
      AND r."mentorId" = $3 
      AND r."menteeId" = u.id
    RETURNING ${REQUEST_DETAIL_COLUMNS};
  `;
    try {
        const { rows } = yield db_config_1.pool.query(query, [status, id, mentorId]);
        return rows[0] || null;
    }
    catch (error) {
        console.error('Service Error [updateRequestStatus]:', error);
        throw error;
    }
});
exports.updateRequestStatus = updateRequestStatus;
const createMatch = (menteeId, mentorId) => __awaiter(void 0, void 0, void 0, function* () {
    const query = `
    INSERT INTO mentorship_match ("menteeId", "mentorId", "createdAt")
    VALUES ($1, $2, NOW())
    ON CONFLICT ("menteeId", "mentorId") DO NOTHING
    RETURNING id, "menteeId", "mentorId", "createdAt";
  `;
    const { rows } = yield db_config_1.pool.query(query, [menteeId, mentorId]);
    return rows[0];
});
exports.createMatch = createMatch;
//# sourceMappingURL=mentorshipRequest.service.js.map