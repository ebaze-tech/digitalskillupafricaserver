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
exports.resetPassword = exports.forgotPassword = exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_config_1 = require("../../config/db.config");
const mailer_1 = __importDefault(require("../../utils/mailer"));
const JWT_SECRET = process.env.JWT_SECRET;
const CLIENT_URL = process.env.CLIENT_URL;
/**
 * POST /register
 */
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, email, password, role, shortBio = '', goals = '' } = req.body;
    if (!username || !email || !password || !role) {
        res.status(400).json({ message: 'All required fields must be provided.' });
        return;
    }
    const client = yield db_config_1.pool.connect();
    try {
        yield client.query('BEGIN');
        const userExists = yield client.query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
        if (userExists.rowCount > 0) {
            res.status(409).json({ message: 'Username or email already in use.' });
            yield client.query('ROLLBACK');
            return;
        }
        const hashedPassword = yield bcrypt_1.default.hash(password, 12);
        const userResult = yield client.query(`INSERT INTO users (username, email, "passwordHash", role) 
       VALUES ($1, $2, $3, $4) RETURNING id, username, email, role`, [username, email, hashedPassword, role]);
        const newUser = userResult.rows[0];
        const targetTable = role === 'mentor' ? 'mentor' : 'mentee';
        yield client.query(`INSERT INTO ${targetTable} ("userId", username, "shortBio", goals) 
       VALUES ($1, $2, $3, $4)`, [newUser.id, username, shortBio, goals]);
        yield client.query('COMMIT');
        res
            .status(201)
            .json({ message: 'User registered successfully', user: newUser });
    }
    catch (err) {
        yield client.query('ROLLBACK');
        res
            .status(500)
            .json({ message: 'Internal server error during registration.' });
    }
    finally {
        client.release();
    }
});
exports.register = register;
/**
 * POST /login
 */
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        const { rows } = yield db_config_1.pool.query('SELECT * FROM users WHERE email = $1', [
            email
        ]);
        const user = rows[0];
        if (!user || !(yield bcrypt_1.default.compare(password, user.passwordHash))) {
            res.status(401).json({ message: 'Invalid email or password.' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
        res.json({
            message: 'Login successful',
            token,
            user: { id: user.id, username: user.username, role: user.role }
        });
    }
    catch (err) {
        res.status(500).json({ message: 'Internal server error during login.' });
    }
});
exports.login = login;
/**
 * POST /forgot-password
 */
const forgotPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    try {
        const { rows } = yield db_config_1.pool.query('SELECT id FROM users WHERE email = $1', [
            email
        ]);
        if (rows.length === 0) {
            res.status(404).json({ message: 'User with this email does not exist.' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ userId: rows[0].id }, JWT_SECRET, {
            expiresIn: '15m'
        });
        const resetLink = `${CLIENT_URL}/reset-password?token=${token}`;
        yield (0, mailer_1.default)(email, resetLink);
        res.json({ message: 'Password reset email sent.' });
    }
    catch (err) {
        res.status(500).json({ message: 'Error sending reset email.' });
    }
});
exports.forgotPassword = forgotPassword;
/**
 * POST /reset-password
 */
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
        res.status(400).json({ message: 'Token and new password are required.' });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const hashedPassword = yield bcrypt_1.default.hash(newPassword, 12);
        yield db_config_1.pool.query('UPDATE users SET "passwordHash" = $1 WHERE id = $2', [
            hashedPassword,
            decoded.userId
        ]);
        res.json({ message: 'Password has been reset successfully.' });
    }
    catch (err) {
        res.status(400).json({ message: 'Invalid or expired token.' });
    }
});
exports.resetPassword = resetPassword;
//# sourceMappingURL=auth.controller.js.map