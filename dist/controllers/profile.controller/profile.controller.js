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
exports.completeUserProfiles = exports.getUserProfile = void 0;
const db_config_1 = require("../../config/db.config");
const VALID_SKILLS = [
    'UI/UX',
    'Graphic Design',
    'Web Development',
    'Mobile Development',
    'Backend Development',
    'Data Science',
    'Machine Learning',
    'DevOps',
    'Project Management',
    'Product Management',
    'Marketing',
    'Content Creation'
];
const getUserProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    const client = yield db_config_1.pool.connect();
    try {
        yield client.query('BEGIN');
        const existingUser = yield client.query(`SELECT * FROM users WHERE id = $1`, [userId]);
        if (existingUser.rows.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        if (!existingUser) {
            yield client.query('ROLLBACK');
            res.status(409).json({ message: 'User does not exist' });
            return;
        }
        res.status(200).json({
            message: 'User profile fetched successfully',
            data: existingUser.rows[0]
        });
        return;
    }
    catch (error) {
        yield client.query('ROLLBACK');
        console.error('Could not fetch profile data: ', error);
        res.status(500).json({
            message: 'Failed to get profile data',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
    finally {
        client.release();
    }
});
exports.getUserProfile = getUserProfile;
const completeUserProfiles = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { username, shortBio, goals, skills, industry, experience, availability } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const role = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
    if (!userId || !role) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    if (!(username === null || username === void 0 ? void 0 : username.trim()) ||
        !(shortBio === null || shortBio === void 0 ? void 0 : shortBio.trim()) ||
        !(goals === null || goals === void 0 ? void 0 : goals.trim()) ||
        !Array.isArray(skills) ||
        skills.length === 0 ||
        !skills.every(s => VALID_SKILLS.includes(s)) ||
        !(industry === null || industry === void 0 ? void 0 : industry.trim()) ||
        !(experience === null || experience === void 0 ? void 0 : experience.trim()) ||
        (role === 'mentor' && !(availability === null || availability === void 0 ? void 0 : availability.trim()))) {
        res.status(400).json({
            message: 'All required fields must be provided with valid values'
        });
        return;
    }
    const client = yield db_config_1.pool.connect();
    try {
        yield client.query('BEGIN');
        const existingUser = yield client.query(`SELECT id FROM users WHERE username = $1 AND id != $2`, [username, userId]);
        if (existingUser.rows.length > 0) {
            yield client.query('ROLLBACK');
            res.status(409).json({ message: 'Username already taken' });
            return;
        }
        yield client.query(`UPDATE users SET
        username = $1,
        "shortBio" = $2,
        goals = $3,
        industry = $4,
        experience = $5,
        availability = $6,
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $7`, [username, shortBio, goals, industry, experience, availability, userId]);
        const skillIds = [];
        for (const skillName of skills) {
            const result = yield client.query(`INSERT INTO skills (name)
         VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`, [skillName]);
            skillIds.push(result.rows[0].id);
        }
        yield client.query(`DELETE FROM user_skills WHERE "userId" = $1`, [userId]);
        if (skillIds.length > 0) {
            const insertValues = skillIds
                .map((skillId, index) => `($${index * 2 + 1}, $${index * 2 + 2})`)
                .join(',');
            const flatParams = skillIds.flatMap(skillId => [userId, skillId]);
            yield client.query(`INSERT INTO user_skills ("userId", "skillId") VALUES ${insertValues}`, flatParams);
        }
        yield client.query('COMMIT');
        const userResult = yield client.query(`SELECT 
        u.id, u.username, u.email, u.role, 
        u."shortBio", u.goals, u.industry, u.experience, u.availability,
        COALESCE(
          array_agg(s.name) FILTER (WHERE s.name IS NOT NULL),
          ARRAY[]::text[]
        ) as skills
      FROM users u
      LEFT JOIN user_skills us ON u.id = us."userId"
      LEFT JOIN skills s ON us."skillId" = s.id
      WHERE u.id = $1
      GROUP BY u.id`, [userId]);
        res.status(200).json({
            message: 'Profile updated successfully',
            user: userResult.rows[0]
        });
    }
    catch (error) {
        yield client.query('ROLLBACK');
        console.error('Profile update error:', error);
        res.status(500).json({
            message: 'Failed to update profile',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
    finally {
        client.release();
    }
});
exports.completeUserProfiles = completeUserProfiles;
//# sourceMappingURL=profile.controller.js.map