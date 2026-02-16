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
exports.findMentors = void 0;
const db_config_1 = require("../config/db.config");
/**
 * Finds mentors with optional filtering by skill name or industry.
 */
const findMentors = (skill, industry) => __awaiter(void 0, void 0, void 0, function* () {
    const conditions = ["u.role = 'mentor'"];
    const params = [];
    // Dynamic filter building
    if (skill) {
        params.push(`%${skill}%`);
        conditions.push(`s.name ILIKE $${params.length}`);
    }
    if (industry) {
        params.push(`%${industry}%`);
        conditions.push(`u.industry ILIKE $${params.length}`);
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `
    SELECT 
      u.id, 
      u.username, 
      u.email, 
      u.industry, 
      u.experience, 
      u.availability,
      u."shortBio",
      ARRAY_AGG(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL) AS skills
    FROM users u
    LEFT JOIN user_skills us ON u.id = us."userId"
    LEFT JOIN skills s ON us."skillId" = s.id
    ${whereClause}
    GROUP BY u.id
    ORDER BY u.username ASC;
  `;
    try {
        const { rows } = yield db_config_1.pool.query(query, params);
        return rows;
    }
    catch (error) {
        console.error('Service Error [findMentors]:', error);
        throw new Error('Could not retrieve mentors');
    }
});
exports.findMentors = findMentors;
//# sourceMappingURL=mentor.service.js.map