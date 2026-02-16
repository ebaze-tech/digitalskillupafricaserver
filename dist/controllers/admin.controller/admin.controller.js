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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.editUser = exports.addUser = exports.assignMentorToMentee = exports.getSessionStats = exports.getAllUsers = void 0;
const db_config_1 = require("../../config/db.config");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
/**
 * Utility: Validate UUID format
 */
const isValidUUID = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
/**
 * GET /users
 */
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { rows } = yield db_config_1.pool.query(`SELECT id, username, email, role FROM users ORDER BY "createdAt" DESC`);
        return res.status(200).json(rows);
    }
    catch (error) {
        return res.status(500).json({ error: 'Failed to fetch users.' });
    }
});
exports.getAllUsers = getAllUsers;
/**
 * GET /sessions/stats
 */
const getSessionStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const query = `
      SELECT 
        (SELECT COUNT(*) FROM session_bookings WHERE status = 'completed') as "completed",
        (SELECT COUNT(*) FROM session_bookings WHERE date < CURRENT_DATE) as "total_held"
    `;
        const { rows } = yield db_config_1.pool.query(query);
        return res.status(200).json({
            totalCompletedSessions: parseInt(rows[0].completed, 10),
            totalSessionsHeld: parseInt(rows[0].total_held, 10)
        });
    }
    catch (error) {
        return res.status(500).json({ error: 'Failed to get session stats.' });
    }
});
exports.getSessionStats = getSessionStats;
/**
 * POST /mentorship/assign
 *
 */
const assignMentorToMentee = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { mentorId, menteeId, adminId } = req.body;
    if (![mentorId, menteeId, adminId].every(isValidUUID)) {
        return res.status(400).json({ error: 'Invalid UUID format for IDs.' });
    }
    const client = yield db_config_1.pool.connect();
    try {
        yield client.query('BEGIN');
        const existing = yield client.query('SELECT 1 FROM mentorship_match WHERE "menteeId" = $1', [menteeId]);
        if (existing.rowCount > 0) {
            throw new Error('Mentee already has a mentor.');
        }
        const insertQuery = `
      INSERT INTO mentorship_match ("mentorId", "menteeId", "adminId")
      VALUES ($1, $2, $3)
      RETURNING *
    `;
        const { rows } = yield client.query(insertQuery, [
            mentorId,
            menteeId,
            adminId
        ]);
        yield client.query('COMMIT');
        return res
            .status(201)
            .json({ message: 'Mentor assigned successfully.', data: rows[0] });
    }
    catch (error) {
        yield client.query('ROLLBACK');
        return res
            .status(error.message.includes('already') ? 409 : 500)
            .json({ error: error.message });
    }
    finally {
        client.release();
    }
});
exports.assignMentorToMentee = assignMentorToMentee;
/**
 * POST /users
 * Centralized user creation
 */
const addUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, email, password, role } = req.body;
    const validRoles = ['admin', 'mentor', 'mentee'];
    if (!username || !email || !password || !validRoles.includes(role)) {
        return res
            .status(400)
            .json({
            error: 'Valid username, email, password, and role are required.'
        });
    }
    const client = yield db_config_1.pool.connect();
    try {
        yield client.query('BEGIN');
        const passwordHash = yield bcryptjs_1.default.hash(password, 12);
        const userResult = yield client.query(`INSERT INTO users (username, email, "passwordHash", role)
       VALUES ($1, $2, $3, $4) RETURNING id, username, email, role`, [username, email, passwordHash, role]);
        const newUser = userResult.rows[0];
        const tableMap = {
            mentor: 'mentor',
            mentee: 'mentee',
            admin: 'admins'
        };
        yield client.query(`INSERT INTO ${tableMap[role]} ("userId") VALUES ($1)`, [
            newUser.id
        ]);
        yield client.query('COMMIT');
        return res
            .status(201)
            .json({ message: 'User added successfully.', user: newUser });
    }
    catch (error) {
        yield client.query('ROLLBACK');
        return res.status(500).json({ error: 'Server error adding user.' });
    }
    finally {
        client.release();
    }
});
exports.addUser = addUser;
/**
 * PATCH /users/:id
 */
const editUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const updates = req.body;
    if (!isValidUUID(id))
        return res.status(400).json({ error: 'Invalid User ID.' });
    const fields = [];
    const values = [];
    Object.entries(updates).forEach(([key, value], index) => {
        if (['username', 'email', 'role'].includes(key)) {
            fields.push(`"${key}" = $${index + 1}`);
            values.push(value);
        }
    });
    if (fields.length === 0)
        return res.status(400).json({ error: 'No valid fields to update.' });
    values.push(id);
    const query = `UPDATE users SET ${fields.join(', ')}, "updatedAt" = NOW() WHERE id = $${values.length} RETURNING id, username, email, role`;
    try {
        const { rows } = yield db_config_1.pool.query(query, values);
        if (rows.length === 0)
            return res.status(404).json({ error: 'User not found.' });
        return res
            .status(200)
            .json({ message: 'User updated successfully.', user: rows[0] });
    }
    catch (error) {
        return res.status(500).json({ error: 'Server error updating user.' });
    }
});
exports.editUser = editUser;
//# sourceMappingURL=admin.controller.js.map