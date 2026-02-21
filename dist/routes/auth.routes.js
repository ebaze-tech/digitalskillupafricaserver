"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../controllers/auth.controller/auth.controller");
const validator_1 = require("../middlewares/validator");
exports.router = express_1.default.Router();
exports.router.post('/register', validator_1.validateRegister, auth_controller_1.register);
exports.router.post('/login', auth_controller_1.login);
exports.router.post('/forgot-password', auth_controller_1.forgotPassword);
exports.router.post('/reset-password', auth_controller_1.resetPassword);
//# sourceMappingURL=auth.routes.js.map