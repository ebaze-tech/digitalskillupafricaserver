"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.menteeOnly = exports.mentorOnly = exports.adminOnly = exports.getAuthenticatedUser = void 0;
const requireRole = (role) => {
    return (req, res, next) => {
        const user = req.user;
        if (!(user === null || user === void 0 ? void 0 : user.role)) {
            res.status(401).json({ message: "Unauthorized: No role found" });
            return;
        }
        if (user.role !== role) {
            res.status(403).json({ message: `Forbidden: Only ${role}s allowed` });
            return;
        }
        next();
    };
};
const getAuthenticatedUser = (req, res) => {
    console.log(req.user);
    if (!req.user) {
        res.status(401).json({ message: "Unauthorized: No user found" });
        return;
    }
    res.json({ user: req.user });
};
exports.getAuthenticatedUser = getAuthenticatedUser;
// Dedicated middlewares
exports.adminOnly = requireRole("admin");
exports.mentorOnly = requireRole("mentor");
exports.menteeOnly = requireRole("mentee");
//# sourceMappingURL=auth.middleware.js.map