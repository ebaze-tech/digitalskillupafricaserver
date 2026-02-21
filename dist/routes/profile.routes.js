"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = __importDefault(require("express"));
const profile_controller_1 = require("../controllers/profile.controller/profile.controller");
const userauth_middleware_1 = require("../middlewares/userauth.middleware");
const jointRoles_1 = require("../middlewares/jointRoles");
exports.router = express_1.default.Router();
function asyncHandler(fn) {
    return function (req, res, next) {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
exports.router.put('/me/profile', userauth_middleware_1.authenticateUser, (0, jointRoles_1.jointRoles)('mentor', 'mentee', 'admin'), asyncHandler(profile_controller_1.completeUserProfiles));
//# sourceMappingURL=profile.routes.js.map