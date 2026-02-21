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
exports.getAdminById = exports.getTotalSessionsHeld = exports.getSessionStats = exports.getAllSessions = exports.getAllMentorshipMatches = exports.assignMentor = exports.editUser = exports.addUser = exports.getUserById = exports.getAllUsers = void 0;
const db_config_1 = require("../../config/db.config");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const uuid_1 = require("uuid");
const BCRYPT_ROUNDS = 12;
const VALID_ROLES = ['admin', 'mentor', 'mentee'];
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const client = yield db_config_1.pool.connect();
    try {
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.adminId;
        const id = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
        if (!id) {
            res.status(400).json({ message: 'Invalid user' });
            return;
        }
        const existingAdmin = yield client.query(`SELECT adminId FROM admins WHERE userId = $1 AND adminId = $2`, [id, adminId]);
        if (existingAdmin.rows.length === 0) {
            res.status(403).json({ message: 'Access prohibited' });
            return;
        }
        const { rows } = yield client.query('SELECT id, username, email, role FROM users ORDER BY created_at DESC');
        res.status(200).json({
            message: 'User details fetched successfully',
            data: rows
        });
        return;
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Failed to fetch users' });
        return;
    }
    finally {
        client.release();
    }
});
exports.getAllUsers = getAllUsers;
const getUserById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const client = yield db_config_1.pool.connect();
    try {
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.adminId;
        const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
        if (!userId) {
            res.status(400).json({ message: 'Invalid user' });
            return;
        }
        const existingAdmin = yield client.query(`SELECT adminId FROM admins WHERE userId = $1 AND adminId = $2`, [userId, adminId]);
        if (existingAdmin.rows.length === 0) {
            res.status(403).json({ message: 'Access prohibited' });
            return;
        }
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ message: 'User ID is required' });
            return;
        }
        const { rows } = yield client.query(`SELECT id, username, email, role, "shortBio", goals, industry, experience, availability
       FROM users WHERE id = $1`, [id]);
        if (rows.length === 0) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.status(200).json({
            message: 'User details fetched successfully',
            data: rows[0]
        });
        return;
    }
    catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Internal server error' });
        return;
    }
    finally {
        client.release();
    }
});
exports.getUserById = getUserById;
const addUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { username, email, password, role } = req.body;
    if (!username || !email || !password || !role) {
        res.status(400).json({ message: 'All fields are required' });
        return;
    }
    if (!VALID_ROLES.includes(role)) {
        res.status(400).json({ message: 'Invalid role specified' });
        return;
    }
    const client = yield db_config_1.pool.connect();
    try {
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.adminId;
        const id = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
        if (!id) {
            res.status(400).json({ message: 'Invalid user' });
            return;
        }
        const existingAdmin = yield client.query(`SELECT adminId FROM admins WHERE userId = $1 AND adminId = $2`, [id, adminId]);
        if (existingAdmin.rows.length === 0) {
            res.status(403).json({ message: 'Access prohibited' });
            return;
        }
        yield client.query('BEGIN');
        const existingUser = yield client.query('SELECT id FROM users WHERE username = $1 OR email = $2', [username, email]);
        if (existingUser.rows.length > 0) {
            res.status(400).json({ message: 'Username or email already exists' });
            return;
        }
        const passwordHash = yield bcryptjs_1.default.hash(password, BCRYPT_ROUNDS);
        const userId = (0, uuid_1.v4)();
        const { rows } = yield client.query(`INSERT INTO users (id, username, email, "passwordHash", role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, role`, [userId, username, email, passwordHash, role]);
        const roleId = (0, uuid_1.v4)();
        const roleTable = role === 'mentor' ? 'mentors' : role === 'mentee' ? 'mentees' : 'admins';
        const roleIdColumn = role === 'mentor'
            ? 'mentorId'
            : role === 'mentee'
                ? 'menteeId'
                : 'adminId';
        yield client.query(`INSERT INTO ${roleTable} ("${roleIdColumn}", "userId") VALUES ($1, $2)`, [roleId, userId]);
        yield client.query('COMMIT');
        res.status(201).json({
            message: 'User added successfully',
            data: rows[0]
        });
        return;
    }
    catch (error) {
        yield client.query('ROLLBACK');
        console.error('Error adding user:', error);
        if (error.message.includes('exists')) {
            res.status(409).json({ message: 'Username or email already exists' });
            return;
        }
        else {
            res.status(500).json({ message: 'Failed to add user' });
            return;
        }
    }
    finally {
        client.release();
    }
});
exports.addUser = addUser;
const editUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { id } = req.params;
    const { username, email, password, role } = req.body;
    if (!id) {
        res.status(400).json({ message: 'User ID is required' });
        return;
    }
    const client = yield db_config_1.pool.connect();
    try {
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.adminId;
        const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
        if (!userId) {
            res.status(400).json({ message: 'Invalid user' });
            return;
        }
        const existingAdmin = yield client.query(`SELECT adminId FROM admins WHERE userId = $1 AND adminId = $2`, [userId, adminId]);
        if (existingAdmin.rows.length === 0) {
            res.status(403).json({ message: 'Access prohibited' });
            return;
        }
        yield client.query('BEGIN');
        const existingUser = yield client.query('SELECT id, role FROM users WHERE id = $1', [id]);
        if (existingUser.rows.length === 0) {
            yield client.query('ROLLBACK');
            res.status(404).json({ message: 'User not found' });
            return;
        }
        const currentUser = existingUser.rows[0];
        const updates = [];
        const values = [];
        let paramIndex = 1;
        if (username) {
            updates.push(`username = $${paramIndex++}`);
            values.push(username);
        }
        if (email) {
            updates.push(`email = $${paramIndex++}`);
            values.push(email);
        }
        if (password) {
            const hashedPassword = yield bcryptjs_1.default.hash(password, BCRYPT_ROUNDS);
            updates.push(`"passwordHash" = $${paramIndex++}`);
            values.push(hashedPassword);
        }
        if (role) {
            if (!VALID_ROLES.includes(role)) {
                yield client.query('ROLLBACK');
                res.status(400).json({ message: 'Invalid role' });
                return;
            }
            updates.push(`role = $${paramIndex++}`);
            values.push(role);
        }
        if (updates.length === 0) {
            yield client.query('ROLLBACK');
            res.status(400).json({ message: 'No fields to update' });
            return;
        }
        values.push(id);
        const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, username, email, role
    `;
        const { rows } = yield client.query(query, values);
        if (role && role !== currentUser.role) {
            const oldRoleTable = currentUser.role === 'mentor'
                ? 'mentors'
                : currentUser.role === 'mentee'
                    ? 'mentees'
                    : 'admins';
            const oldRoleIdColumn = currentUser.role === 'mentor'
                ? 'mentorId'
                : currentUser.role === 'mentee'
                    ? 'menteeId'
                    : 'adminId';
            yield client.query(`DELETE FROM ${oldRoleTable} WHERE "userId" = $1`, [
                id
            ]);
            const newRoleId = (0, uuid_1.v4)();
            const newRoleTable = role === 'mentor' ? 'mentors' : role === 'mentee' ? 'mentees' : 'admins';
            const newRoleIdColumn = role === 'mentor'
                ? 'mentorId'
                : role === 'mentee'
                    ? 'menteeId'
                    : 'adminId';
            yield client.query(`INSERT INTO ${newRoleTable} ("${newRoleIdColumn}", "userId") VALUES ($1, $2)`, [newRoleId, id]);
        }
        yield client.query('COMMIT');
        res.status(200).json({
            message: 'User updated successfully',
            data: rows[0]
        });
        return;
    }
    catch (error) {
        yield client.query('ROLLBACK');
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Failed to update user' });
        return;
    }
    finally {
        client.release();
    }
});
exports.editUser = editUser;
const assignMentor = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { mentorId, menteeId } = req.body;
    if (!mentorId || !menteeId) {
        res.status(400).json({ message: 'MentorId and MenteeId are required' });
        return;
    }
    const client = yield db_config_1.pool.connect();
    try {
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.adminId;
        const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
        if (!userId) {
            res.status(400).json({ message: 'Invalid user' });
            return;
        }
        const existingAdmin = yield client.query(`SELECT adminId FROM admins WHERE userId = $1 AND adminId = $2`, [userId, adminId]);
        if (existingAdmin.rows.length === 0) {
            res.status(403).json({ message: 'Access prohibited' });
            return;
        }
        yield client.query('BEGIN');
        const users = yield client.query(`SELECT id, role FROM users WHERE id = ANY($1::uuid[])`, [[mentorId, menteeId]]);
        const userMap = new Map(users.rows.map(u => [u.id, u.role]));
        if (userMap.get(mentorId) !== 'mentor') {
            yield client.query('ROLLBACK');
            res.status(400).json({ message: 'Invalid mentor ID' });
            return;
        }
        if (userMap.get(menteeId) !== 'mentee') {
            yield client.query('ROLLBACK');
            res.status(400).json({ message: 'Invalid mentee ID' });
            return;
        }
        const existingMatch = yield client.query('SELECT id FROM mentorship_match WHERE "mentorId" = $1 AND "menteeId" = $2', [mentorId, menteeId]);
        if (existingMatch.rows.length > 0) {
            yield client.query('ROLLBACK');
            res.status(409).json({ message: 'Match already exists' });
            return;
        }
        const { rows } = yield client.query(`INSERT INTO mentorship_match (id, "mentorId", "menteeId")
       VALUES ($1, $2, $3)
       RETURNING *`, [(0, uuid_1.v4)(), mentorId, menteeId]);
        yield client.query('COMMIT');
        res.status(201).json({
            message: 'Mentor assigned successfully',
            match: rows[0]
        });
        return;
    }
    catch (error) {
        yield client.query('ROLLBACK');
        console.error('Error assigning mentor:', error);
        res.status(500).json({ message: 'Failed to assign mentor' });
        return;
    }
    finally {
        client.release();
    }
});
exports.assignMentor = assignMentor;
const getAllMentorshipMatches = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.adminId;
        const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
        if (!userId) {
            res.status(400).json({ message: 'Invalid user' });
            return;
        }
        const existingAdmin = yield db_config_1.pool.query(`SELECT adminId FROM admins WHERE userId = $1 AND adminId = $2`, [userId, adminId]);
        if (existingAdmin.rows.length === 0) {
            res.status(403).json({ message: 'Access prohibited' });
            return;
        }
        const { rows } = yield db_config_1.pool.query(`
      SELECT 
        m."menteeId",
        m."mentorId",
        mentee.username AS "menteeUsername",
        mentee.email AS "menteeEmail",
        mentor.username AS "mentorUsername",
        mentor.email AS "mentorEmail"
      FROM mentorship_match m
      JOIN users mentee ON mentee.id = m."menteeId"
      JOIN users mentor ON mentor.id = m."mentorId"
      ORDER BY m."createdAt" DESC
    `);
        res.status(200).json({
            message: 'All mentorship matches fetched successfully',
            data: rows
        });
        return;
    }
    catch (error) {
        console.error('Error fetching mentorship matches:', error);
        res.status(500).json({ message: 'Failed to fetch matches' });
        return;
    }
});
exports.getAllMentorshipMatches = getAllMentorshipMatches;
const getAllSessions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.adminId;
        const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
        if (!userId) {
            res.status(400).json({ message: 'Invalid user' });
            return;
        }
        const existingAdmin = yield db_config_1.pool.query(`SELECT adminId FROM admins WHERE userId = $1 AND adminId = $2`, [userId, adminId]);
        if (existingAdmin.rows.length === 0) {
            res.status(403).json({ message: 'Access prohibited' });
            return;
        }
        const { rows } = yield db_config_1.pool.query(`
      SELECT 
        s.id,
        s.date,
        s.status,
        u_mentees.username AS "menteeUsername",
        u_mentors.username AS "mentorUsername"
      FROM session_bookings s
      JOIN users u_mentees ON u_mentees.id = s."menteeId"
      JOIN users u_mentors ON u_mentors.id = s."mentorId"
      ORDER BY s.date DESC
    `);
        res.status(200).json({
            message: 'Sessions retrieved successfully',
            data: rows
        });
        return;
    }
    catch (error) {
        console.error('Error fetching sessions:', error);
        res.status(500).json({ message: 'Failed to retrieve sessions' });
        return;
    }
});
exports.getAllSessions = getAllSessions;
const getSessionStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.adminId;
        const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
        if (!userId) {
            res.status(400).json({ message: 'Invalid user' });
            return;
        }
        const existingAdmin = yield db_config_1.pool.query(`SELECT adminId FROM admins WHERE userId = $1 AND adminId = $2`, [userId, adminId]);
        if (existingAdmin.rows.length === 0) {
            res.status(403).json({ message: 'Access prohibited' });
            return;
        }
        const { rows } = yield db_config_1.pool.query('SELECT COUNT(*) FROM session_bookings WHERE status = $1', ['completed']);
        res.status(200).json({
            message: 'Session stats fetched successfully',
            totalCompletedSessions: parseInt(rows[0].count, 10)
        });
        return;
    }
    catch (error) {
        console.error('Error getting session stats:', error);
        res.status(500).json({ message: 'Failed to get session stats' });
    }
    return;
});
exports.getSessionStats = getSessionStats;
const getTotalSessionsHeld = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.adminId;
        const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
        if (!userId) {
            res.status(400).json({ message: 'Invalid user' });
            return;
        }
        const existingAdmin = yield db_config_1.pool.query(`SELECT adminId FROM admins WHERE userId = $1 AND adminId = $2`, [userId, adminId]);
        if (existingAdmin.rows.length === 0) {
            res.status(403).json({ message: 'Access prohibited' });
            return;
        }
        const { rows } = yield db_config_1.pool.query(`
      SELECT COUNT(*) AS session_count
      FROM session_bookings
      WHERE date < CURRENT_DATE
    `);
        const count = parseInt(rows[0].session_count, 10);
        res.status(200).json({
            message: 'Total session data fetched successfully',
            totalSessions: count
        });
        return;
    }
    catch (error) {
        console.error('Error fetching total sessions:', error);
        res.status(500).json({ message: 'Failed to fetch total sessions' });
    }
});
exports.getTotalSessionsHeld = getTotalSessionsHeld;
const getAdminById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.adminId;
        const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
        if (!userId) {
            res.status(400).json({ message: 'Invalid user' });
            return;
        }
        const existingAdmin = yield db_config_1.pool.query(`SELECT adminId FROM admins WHERE userId = $1 AND adminId = $2`, [userId, adminId]);
        if (existingAdmin.rows.length === 0) {
            res.status(403).json({ message: 'Access prohibited' });
            return;
        }
        const { rows } = yield db_config_1.pool.query(`
      SELECT 
        a."adminId", 
        u.id as "userId",
        u.username, 
        u.email, 
        'admin' AS role
      FROM admins a
      JOIN users u ON u.id = a."userId"
      WHERE a."adminId" = $1
    `, [adminId]);
        if (rows.length === 0) {
            res.status(404).json({ message: 'Admin not found' });
            return;
        }
        res.status(200).json(rows[0]);
    }
    catch (error) {
        console.error('Error fetching admin:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.getAdminById = getAdminById;
//# sourceMappingURL=admin.controller.js.map