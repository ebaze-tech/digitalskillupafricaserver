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
exports.initializeDb = void 0;
const pg_1 = require("pg");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const initializeDb = () => __awaiter(void 0, void 0, void 0, function* () {
    const client = new pg_1.Client({
        connectionString: process.env.DATABASE_URL
    });
    try {
        yield client.connect();
        // Path to your SQL file
        const sqlFile = fs_1.default.readFileSync(path_1.default.join(__dirname, 'init.sql'), 'utf8');
        // Execute the SQL queries
        yield client.query(sqlFile);
        console.log('Database initialized successfully');
    }
    catch (err) {
        console.error('Initialization failed:', err);
    }
    finally {
        yield client.end();
    }
});
exports.initializeDb = initializeDb;
//# sourceMappingURL=initDB.js.map