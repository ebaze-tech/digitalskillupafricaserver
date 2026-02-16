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
const sendRequest = (menteeId, mentorId) => __awaiter(void 0, void 0, void 0, function* () {
    const query = `
    INSERT INTO mentorship_request ("menteeId", "mentorId", "status", "createdAt", id)
    VALUES ($1, $2, 'pending', NOW(), gen_random_uuid())
    RETURNING 
      id,
      status,
      "createdAt",
      "menteeId",
      (SELECT username FROM users WHERE id = $1) AS "username",
      (SELECT email FROM users WHERE id = $1) AS "email"
  `;
    const { rows } = yield db_config_1.pool.query(query, [menteeId, mentorId]);
    return rows[0];
});
exports.sendRequest = sendRequest;
const getIncomingRequests = (mentorId) => __awaiter(void 0, void 0, void 0, function* () {
    const query = `
    SELECT 
      r.id,
      r.status,
      r."createdAt",
      r."menteeId",
      r."mentorId",
      u.username AS "username",
      u.email AS "email"
    FROM "mentorship_request" r
    JOIN "users" u ON r."menteeId" = u.id
    WHERE r."mentorId" = $1
    ORDER BY r."createdAt" DESC;
  `;
    const { rows } = yield db_config_1.pool.query(query, [mentorId]);
    console.log(rows);
    return rows;
});
exports.getIncomingRequests = getIncomingRequests;
const updateRequestStatus = (id, status, mentorId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const checkQuery = `
      SELECT id, status, "menteeId", "mentorId" 
      FROM "mentorship_request" 
      WHERE id = $1 AND "mentorId" = $2;
    `;
        const checkResult = yield db_config_1.pool.query(checkQuery, [id, mentorId]);
        const existingRequest = checkResult.rows[0];
        if (!existingRequest)
            return null;
        const updateQuery = `
      UPDATE "mentorship_request"
      SET status = $1, "updatedAt" = NOW()
      WHERE id = $2 AND "mentorId" = $3
      RETURNING 
        id,
        "menteeId",
        "mentorId",
        status,
        "createdAt",
        (SELECT username FROM users WHERE id = "menteeId") AS "username",
        (SELECT email FROM users WHERE id = "menteeId") AS "email"
    `;
        const { rows } = yield db_config_1.pool.query(updateQuery, [status, id, mentorId]);
        return rows[0];
    }
    catch (error) {
        console.error("Error updating request status:", error);
        throw error;
    }
});
exports.updateRequestStatus = updateRequestStatus;
const createMatch = (menteeId, mentorId) => __awaiter(void 0, void 0, void 0, function* () {
    const query = `
    INSERT INTO "mentorship_match" ("menteeId", "mentorId", "createdAt")
    VALUES ($1, $2, NOW())
    RETURNING ID, "menteeId", "mentorId", "createdAt";
  `;
    const values = [menteeId, mentorId];
    const { rows } = yield db_config_1.pool.query(query, values);
    return rows[0];
});
exports.createMatch = createMatch;
//# sourceMappingURL=mentorshipRequest.service.js.map