import express from 'express';
import cors from 'cors';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { connectMongoDB } from './models/db';
import { assignmentRoutes } from './routes/assignments';
import { healthRoutes } from './routes/health';
import { initSocketServer } from './websocket/socketServer';
import { initWorker } from './workers/generationWorker';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/assignments', assignmentRoutes);
app.use('/api/health', healthRoutes);

// Init WebSocket
initSocketServer(server);

// Init BullMQ Worker
initWorker();

const PORT = process.env.PORT || 5000;

connectMongoDB().then(() => {
    server.listen(PORT, () => {
        console.log(`🚀 VedaAI Backend running on http://localhost:${PORT}`);
    });
});
