"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jointRoles = jointRoles;
function jointRoles(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403).json({ message: "Forbidden" });
            return;
        }
        next();
    };
}
//# sourceMappingURL=jointRoles.js.map