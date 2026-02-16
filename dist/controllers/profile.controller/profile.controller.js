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
exports.completeUserProfiles = void 0;
console.log("Importing Request and Response from express");
const uuid_1 = require("uuid");
console.log("Importing v4 as uuidv4 from uuid");
const db_config_1 = require("../../config/db.config");
console.log("Importing pool from db.config");
console.log("Defined AuthenticatedRequest interface");
const completeUserProfiles = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    console.log("Entering completeUserProfiles function");
    const { username, shortBio, goals, skills, industry, experience, availability, } = req.body;
    console.log("Destructured req.body:", { username, shortBio, goals, skills, industry, experience, availability });
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    console.log("Retrieved userId:", userId);
    const role = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
    console.log("Retrieved role:", role);
    const skillOptions = [
        "UI/UX",
        "Graphic Design",
        "Web Development",
        "Mobile Development",
        "Backend Development",
        "Data Science",
        "Machine Learning",
        "DevOps",
        "Project Management",
        "Product Management",
        "Marketing",
        "Content Creation",
    ];
    console.log("Defined skillOptions:", skillOptions);
    if (!userId || !role) {
        console.log("Unauthorized: userId or role missing");
        return res.status(401).json({ message: "Unauthorized" });
    }
    console.log("Passed userId and role check");
    if (!username ||
        !shortBio ||
        !goals ||
        !Array.isArray(skills) ||
        skills.length === 0 ||
        skills.some((skill) => !skill.trim() || !skillOptions.includes(skill)) ||
        !industry ||
        !experience ||
        (role === "mentor" && !availability)) {
        console.log("Validation failed:", {
            username,
            shortBio,
            goals,
            skills,
            industry,
            experience,
            availability,
            role,
        });
        return res.status(400).json({
            message: "All required fields must be provided, and skills must be a non-empty array of valid strings",
        });
    }
    console.log("Passed input validation");
    const client = yield db_config_1.pool.connect();
    console.log("Connected to database client");
    try {
        console.log("Beginning transaction");
        yield client.query("BEGIN");
        console.log("Checking for existing username");
        const existingUser = yield client.query(`SELECT id FROM users WHERE username = $1 AND id != $2`, [username, userId]);
        console.log("Existing user query result:", existingUser.rows);
        if (existingUser.rows.length > 0) {
            console.log("Username already taken:", username);
            yield client.query("ROLLBACK");
            console.log("Transaction rolled back due to duplicate username");
            return res.status(409).json({ message: "Username already taken" });
        }
        console.log("No duplicate username found");
        const query = `
      UPDATE users SET
        username = $1,
        "shortBio" = $2,
        goals = $3,
        industry = $4,
        experience = $5,
        availability = $6,
        skills = $7::text[],
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $8
    `;
        console.log("Defined update users query:", query);
        const values = [
            username,
            shortBio,
            goals,
            industry,
            experience,
            availability,
            skills,
            userId,
        ];
        console.log("Prepared values for users update:", values);
        yield db_config_1.pool.query(query, values);
        console.log("Executed users table update");
        let mentorId;
        console.log("Initialized mentorId:", mentorId);
        let menteeId;
        console.log("Initialized menteeId:", menteeId);
        switch (role) {
            case "admin": {
                console.log("Processing admin role");
                const exists = yield client.query(`SELECT 1 FROM admins WHERE "userId" = $1`, [userId]);
                console.log("Admin exists query result:", exists.rows);
                if (((_c = exists.rowCount) !== null && _c !== void 0 ? _c : 0) > 0) {
                    console.log("Updating existing admin");
                    yield client.query(`UPDATE admins SET "shortBio" = $1, goals = $2, skills = $3::text[] WHERE "userId" = $4`, [shortBio, goals, skills, userId]);
                    console.log("Admin updated");
                }
                else {
                    console.log("Inserting new admin");
                    yield client.query(`INSERT INTO admins ("adminId", "userId", "shortBio", goals, skills)
             VALUES ($1, $2, $3, $4, $5::text[])`, [(0, uuid_1.v4)(), userId, shortBio, goals, skills]);
                    console.log("New admin inserted");
                }
                break;
            }
            case "mentor": {
                console.log("Processing mentor role");
                const result = yield client.query(`SELECT "mentorId" FROM mentors WHERE "userId" = $1`, [userId]);
                console.log("Mentor query result:", result.rows);
                if (((_d = result.rowCount) !== null && _d !== void 0 ? _d : 0) > 0) {
                    mentorId = result.rows[0].mentorId;
                    console.log("Existing mentorId:", mentorId);
                    yield client.query(`UPDATE mentors
             SET "shortBio" = $1, goals = $2, username = $3, industry = $4,
                 experience = $5, availability = $6, skills = $7::text[]
             WHERE "userId" = $8`, [
                        shortBio,
                        goals,
                        username,
                        industry,
                        experience,
                        availability,
                        skills,
                        userId,
                    ]);
                    console.log("Mentor updated");
                }
                else {
                    mentorId = (0, uuid_1.v4)();
                    console.log("Generated new mentorId:", mentorId);
                    yield client.query(`INSERT INTO mentors ("mentorId", "userId", "shortBio", goals, username, industry, experience, availability, skills)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::text[])`, [
                        mentorId,
                        userId,
                        shortBio,
                        goals,
                        username,
                        industry,
                        experience,
                        availability,
                        skills,
                    ]);
                    console.log("New mentor inserted");
                }
                break;
            }
            case "mentee": {
                console.log("Processing mentee role");
                const result = yield client.query(`SELECT "menteeId" FROM mentees WHERE "userId" = $1`, [userId]);
                console.log("Mentee query result:", result.rows);
                if (((_e = result.rowCount) !== null && _e !== void 0 ? _e : 0) > 0) {
                    menteeId = result.rows[0].menteeId;
                    console.log("Existing menteeId:", menteeId);
                    yield client.query(`UPDATE mentees
             SET "shortBio" = $1, goals = $2, username = $3, skills = $4::text[]
             WHERE "userId" = $5`, [shortBio, goals, username, skills, userId]);
                    console.log("Mentee updated");
                }
                else {
                    menteeId = (0, uuid_1.v4)();
                    console.log("Generated new menteeId:", menteeId);
                    yield client.query(`INSERT INTO mentees ("menteeId", "userId", "shortBio", goals, username, skills)
             VALUES ($1, $2, $3, $4, $5, $6::text[])`, [menteeId, userId, shortBio, goals, username, skills]);
                    console.log("New mentee inserted");
                }
                break;
            }
            default:
                console.log("Invalid role detected:", role);
                yield client.query("ROLLBACK");
                console.log("Transaction rolled back due to invalid role");
                return res.status(400).json({ message: "Invalid user role" });
        }
        console.log("Completed role-specific processing");
        const skillIds = [];
        console.log("Initialized skillIds array");
        for (const skillName of skills) {
            console.log("Processing skill:", skillName);
            const result = yield client.query(`INSERT INTO skills (name)
         VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`, [skillName.trim()]);
            console.log("Skill insert result:", result.rows);
            if ((_f = result.rows[0]) === null || _f === void 0 ? void 0 : _f.id) {
                skillIds.push(result.rows[0].id);
                console.log("Added skillId to skillIds:", result.rows[0].id);
            }
        }
        console.log("Collected skillIds:", skillIds);
        if (role === "mentor" && mentorId) {
            console.log("Processing mentor skills for mentorId:", mentorId);
            if (skillIds.length > 0) {
                console.log("Deleting outdated mentor skills");
                yield client.query(`DELETE FROM mentor_skills WHERE "mentorId" = $1 AND "skillId" NOT IN (${skillIds
                    .map((_, i) => `$${i + 2}`)
                    .join(", ")})`, [mentorId, ...skillIds]);
                console.log("Deleted outdated mentor skills");
            }
            else {
                console.log("Deleting all mentor skills due to empty skillIds");
                yield client.query(`DELETE FROM mentor_skills WHERE "mentorId" = $1`, [mentorId]);
                console.log("Deleted all mentor skills");
            }
            for (const skillId of skillIds) {
                console.log("Inserting mentor skill:", skillId);
                yield client.query(`INSERT INTO mentor_skills ("mentorId", "skillId")
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`, [mentorId, skillId]);
                console.log("Inserted mentor skill:", skillId);
            }
        }
        console.log("Completed mentor skills processing");
        if (role === "mentee" && menteeId) {
            console.log("Processing mentee skills for menteeId:", menteeId);
            if (skillIds.length > 0) {
                console.log("Deleting outdated user skills");
                yield client.query(`DELETE FROM user_skills WHERE "menteeId" = $1 AND "skillId" NOT IN (${skillIds
                    .map((_, i) => `$${i + 2}`)
                    .join(", ")})`, [menteeId, ...skillIds]);
                console.log("Deleted outdated user skills");
            }
            else {
                console.log("Deleting all user skills due to empty skillIds");
                yield client.query(`DELETE FROM user_skills WHERE "menteeId" = $1`, [menteeId]);
                console.log("Deleted all user skills");
            }
            for (const skillId of skillIds) {
                console.log("Inserting user skill:", skillId);
                yield client.query(`INSERT INTO user_skills ("menteeId", "skillId", "userId")
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING`, [menteeId, skillId, userId]);
                console.log("Inserted user skill:", skillId);
            }
        }
        console.log("Completed mentee skills processing");
        console.log("Fetching updated user data");
        const userResult = yield client.query(`SELECT u.id, u.username, u.email, u.role, m."shortBio", m.goals, m.industry, m.experience, m.availability
       FROM users u
       LEFT JOIN mentors m ON u.id = m."userId"
       LEFT JOIN mentees mt ON u.id = mt."userId"
       WHERE u.id = $1`, [userId]);
        console.log("User query result:", userResult.rows);
        const updatedUser = userResult.rows[0];
        console.log("Retrieved updated user:", updatedUser);
        updatedUser.skills = skills;
        console.log("Assigned skills to updatedUser:", skills);
        console.log("Committing transaction");
        yield client.query("COMMIT");
        console.log("Transaction committed");
        console.log("Returning success response");
        return res.status(200).json({
            message: "Profile updated successfully",
            user: updatedUser,
        });
    }
    catch (error) {
        console.log("Caught error in try block:", error);
        yield client.query("ROLLBACK");
        console.log("Transaction rolled back due to error");
        // console.error("Profile update error:", error);
        return res.status(500).json({
            message: "Server error",
            error: error.message || "Unexpected error",
        });
    }
    finally {
        console.log("Releasing database client");
        client.release();
        console.log("Database client released");
    }
});
exports.completeUserProfiles = completeUserProfiles;
console.log("Exported completeUserProfiles function");
//# sourceMappingURL=profile.controller.js.map