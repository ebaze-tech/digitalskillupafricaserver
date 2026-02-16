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
const findMentors = (skill, industry) => __awaiter(void 0, void 0, void 0, function* () {
    const params = [];
    let whereClause = `WHERE u.role = 'mentor'`;
    let i = 1;
    if (skill) {
        whereClause += ` AND s.name ILIKE $${i++}`;
        params.push(`%${skill}%`);
    }
    if (industry) {
        whereClause += ` AND m.industry ILIKE $${i++}`;
        params.push(`%${industry}%`);
    }
    const query = `
    SELECT 
      u.id, u.username, u.email, u.role,
      m.industry, m.experience, m.availability,
      m."shortBio",
      array_agg(DISTINCT s.name) AS skills
    FROM users u
    LEFT JOIN mentors m ON u.id = m."userId"
    LEFT JOIN mentor_skills ms ON m."mentorId" = ms."mentorId"
    LEFT JOIN skills s ON ms."skillId" = s.id
    ${whereClause}
    GROUP BY 
      u.id, u.username, u.email, u.role,
      m.industry, m.experience, m.availability, m."shortBio"
    ORDER BY u.username;
  `;
    const { rows } = yield db_config_1.pool.query(query, params);
    return rows;
});
exports.findMentors = findMentors;
//# sourceMappingURL=mentor.service.js.map