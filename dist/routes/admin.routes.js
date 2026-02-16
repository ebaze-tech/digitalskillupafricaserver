"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const admin_controller_1 = require("../controllers/admin.controller/admin.controller");
const userauth_middleware_1 = require("../middlewares/userauth.middleware");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
router.get('/user/:id', userauth_middleware_1.authenticateUser, auth_middleware_1.adminOnly, (req, res, next) => {
    Promise.resolve((0, admin_controller_1.getAdminById)(req, res))
        .then(result => {
        if (result !== undefined)
            return;
    })
        .catch(next);
});
// route for admin to assign mentor
router.post('/assign-mentor', userauth_middleware_1.authenticateUser, auth_middleware_1.adminOnly, (req, res, next) => {
    Promise.resolve((0, admin_controller_1.assignMentorToMentee)(req, res))
        .then(result => {
        if (result !== undefined)
            return;
    })
        .catch(next);
});
// route for admin to get match for mentorship
router.get('/mentorship-match', userauth_middleware_1.authenticateUser, auth_middleware_1.adminOnly, (req, res, next) => {
    Promise.resolve((0, admin_controller_1.getAllMentorshipMatches)(req, res))
        .then(result => {
        if (result !== undefined)
            return;
    })
        .catch(next);
});
//route to get sessions for mentorship
router.get('/mentorship/sessions', userauth_middleware_1.authenticateUser, auth_middleware_1.adminOnly, (req, res, next) => {
    Promise.resolve((0, admin_controller_1.getSessionStats)(req, res))
        .then(result => {
        if (result !== undefined)
            return;
    })
        .catch(next);
});
router.get('/total-sessions', userauth_middleware_1.authenticateUser, auth_middleware_1.adminOnly, (req, res, next) => {
    Promise.resolve((0, admin_controller_1.getTotalSessionsHeld)(req, res))
        .then(result => {
        if (result !== undefined)
            return;
    })
        .catch(next);
});
// route to get all users
router.get('/users', userauth_middleware_1.authenticateUser, auth_middleware_1.adminOnly, (req, res, next) => {
    Promise.resolve((0, admin_controller_1.getAllUsers)(req, res))
        .then(result => {
        if (result !== undefined)
            return;
    })
        .catch(next);
});
exports.default = router;
router.get('/sessions', userauth_middleware_1.authenticateUser, auth_middleware_1.adminOnly, (req, res, next) => {
    Promise.resolve((0, admin_controller_1.getAllSessions)(req, res))
        .then(result => {
        if (result !== undefined)
            return;
    })
        .catch(next);
});
router.post('/add-user', userauth_middleware_1.authenticateUser, auth_middleware_1.adminOnly, (req, res, next) => {
    Promise.resolve((0, admin_controller_1.addUser)(req, res))
        .then(result => {
        if (result !== undefined)
            return;
    })
        .catch(next);
});
router.put('/users/:id/role', userauth_middleware_1.authenticateUser, auth_middleware_1.adminOnly, (req, res, next) => {
    Promise.resolve((0, admin_controller_1.editUser)(req, res))
        .then(result => {
        if (result !== undefined)
            return;
    })
        .catch(next);
});
router.get('/user/:id', userauth_middleware_1.authenticateUser, auth_middleware_1.adminOnly, (req, res, next) => {
    Promise.resolve((0, admin_controller_1.getUserById)(req, res))
        .then(result => {
        if (result !== undefined)
            return;
    })
        .catch(next);
});
//# sourceMappingURL=admin.routes.js.map