"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const db_1 = require("./models/db");
const assignments_1 = require("./routes/assignments");
const health_1 = require("./routes/health");
const socketServer_1 = require("./websocket/socketServer");
const generationWorker_1 = require("./workers/generationWorker");
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// Middleware
app.use((0, cors_1.default)({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express_1.default.json());
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// Routes
app.use('/api/assignments', assignments_1.assignmentRoutes);
app.use('/api/health', health_1.healthRoutes);
// Init WebSocket
(0, socketServer_1.initSocketServer)(server);
// Init BullMQ Worker
(0, generationWorker_1.initWorker)();
const PORT = process.env.PORT || 5000;
(0, db_1.connectMongoDB)().then(() => {
    server.listen(PORT, () => {
        console.log(`🚀 VedaAI Backend running on http://localhost:${PORT}`);
    });
});
