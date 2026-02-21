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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_config_1 = require("./config/db.config");
// import { modelAssociations } from "./models/models.assocation/models.assocation";
const auth_routes_1 = require("./routes/auth.routes");
const profile_routes_1 = require("./routes/profile.routes");
const mentorship_routes_1 = require("./routes/mentorship.routes");
const admin_routes_1 = require("./routes/admin.routes");
const initDB_1 = require("./initDB");
const db_route_1 = require("./routes/db.route");
// Initialize environment variables
dotenv_1.default.config();
// Setup
exports.app = (0, express_1.default)();
const PORT = process.env.PORT;
const allowedOrigins = [
    (_a = process.env.CLIENT_URL) !== null && _a !== void 0 ? _a : 'https://digitalskillupafrica.vercel.app'
];
// Middleware
exports.app.use((0, cors_1.default)({
    origin: allowedOrigins,
    credentials: true
}));
exports.app.use(express_1.default.json());
// Routes
exports.app.use('/auth', auth_routes_1.router);
exports.app.use('/users', profile_routes_1.router);
exports.app.use('/mentorship', mentorship_routes_1.router);
exports.app.use('/admin', admin_routes_1.router);
exports.app.use('/manage', db_route_1.dbRouter);
// Health check
exports.app.get('/', (req, res) => {
    res.send('Server is running');
});
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, initDB_1.initializeDb)();
        // await dropDb()
        yield db_config_1.pool.connect();
        console.log('Connected to DB');
        // modelAssociations();
        exports.app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
});
exports.startServer = startServer;
(0, exports.startServer)();
//# sourceMappingURL=app.js.map