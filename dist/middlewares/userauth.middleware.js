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
exports.authenticateUser = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_config_1 = require("../config/db.config");
const JWT_SECRET = process.env.JWT_SECRET;
const authenticateUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ message: "No token provided" });
        return;
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = Object.assign(Object.assign({}, decoded.user), { id: String(decoded.user.id) });
        if (user.role === "mentor") {
            const result = yield db_config_1.pool.query(`SELECT "mentorId" FROM mentors WHERE "userId" = $1`, [user.id]);
            if (result.rows.length > 0) {
                user.mentorId = result.rows[0].mentorId;
            }
        }
        else if (user.role === "mentee") {
            const result = yield db_config_1.pool.query(`SELECT "menteeId" FROM mentees WHERE "userId" = $1`, [user.id]);
            if (result.rows.length > 0) {
                user.menteeId = result.rows[0].menteeId;
            }
        }
        else if (user.role === "admin") {
            const result = yield db_config_1.pool.query(`SELECT "adminId" FROM admins WHERE "userId" = $1`, [user.id]);
            if (result.rows.length > 0) {
                user.mentorId = result.rows[0].mentorId;
            }
        }
        req.user = user;
        next();
    }
    catch (err) {
        console.error("JWT verification failed:", err);
        res.status(401).json({ message: "Invalid token" });
    }
});
exports.authenticateUser = authenticateUser;
//# sourceMappingURL=userauth.middleware.js.map