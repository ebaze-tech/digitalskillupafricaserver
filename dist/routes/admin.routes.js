"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = __importDefault(require("express"));
const admin_controller_1 = require("../controllers/admin.controller/admin.controller");
const userauth_middleware_1 = require("../middlewares/userauth.middleware");
const auth_middleware_1 = require("../middlewares/auth.middleware");
exports.router = express_1.default.Router();
exports.router.get('/user/:id', userauth_middleware_1.authenticateUser, auth_middleware_1.adminOnly, (req, res, next) => {
    Promise.resolve((0, admin_controller_1.getAdminById)(req, res))
        .then(result => {
        if (result !== undefined)
            return;
    })
        .catch(next);
});
// route for admin to assign mentor
exports.router.post('/assign-mentor', userauth_middleware_1.authenticateUser, auth_middleware_1.adminOnly, (req, res, next) => {
    Promise.resolve((0, admin_controller_1.assignMentor)(req, res))
        .then(result => {
        if (result !== undefined)
            return;
    })
        .catch(next);
});
// route for admin to get match for mentorship
exports.router.get('/mentorship-match', userauth_middleware_1.authenticateUser, auth_middleware_1.adminOnly, (req, res, next) => {
    Promise.resolve((0, admin_controller_1.getAllMentorshipMatches)(req, res))
        .then(result => {
        if (result !== undefined)
            return;
    })
        .catch(next);
});
//route to get sessions for mentorship
exports.router.get('/mentorship/sessions', userauth_middleware_1.authenticateUser, auth_middleware_1.adminOnly, (req, res, next) => {
    Promise.resolve((0, admin_controller_1.getSessionStats)(req, res))
        .then(result => {
        if (result !== undefined)
            return;
    })
        .catch(next);
});
exports.router.get('/total-sessions', userauth_middleware_1.authenticateUser, auth_middleware_1.adminOnly, (req, res, next) => {
    Promise.resolve((0, admin_controller_1.getTotalSessionsHeld)(req, res))
        .then(result => {
        if (result !== undefined)
            return;
    })
        .catch(next);
});
// route to get all users
exports.router.get('/users', userauth_middleware_1.authenticateUser, auth_middleware_1.adminOnly, (req, res, next) => {
    Promise.resolve((0, admin_controller_1.getAllUsers)(req, res))
        .then(result => {
        if (result !== undefined)
            return;
    })
        .catch(next);
});
exports.router.get('/sessions', userauth_middleware_1.authenticateUser, auth_middleware_1.adminOnly, (req, res, next) => {
    Promise.resolve((0, admin_controller_1.getAllSessions)(req, res))
        .then(result => {
        if (result !== undefined)
            return;
    })
        .catch(next);
});
exports.router.post('/add-user', userauth_middleware_1.authenticateUser, auth_middleware_1.adminOnly, (req, res, next) => {
    Promise.resolve((0, admin_controller_1.addUser)(req, res))
        .then(result => {
        if (result !== undefined)
            return;
    })
        .catch(next);
});
exports.router.put('/users/:id/role', userauth_middleware_1.authenticateUser, auth_middleware_1.adminOnly, (req, res, next) => {
    Promise.resolve((0, admin_controller_1.editUser)(req, res))
        .then(result => {
        if (result !== undefined)
            return;
    })
        .catch(next);
});
exports.router.get('/user/:id', userauth_middleware_1.authenticateUser, auth_middleware_1.adminOnly, (req, res, next) => {
    Promise.resolve((0, admin_controller_1.getUserById)(req, res))
        .then(result => {
        if (result !== undefined)
            return;
    })
        .catch(next);
});
//# sourceMappingURL=admin.routes.js.map