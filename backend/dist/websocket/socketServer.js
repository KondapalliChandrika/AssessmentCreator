"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocketServer = initSocketServer;
exports.getIO = getIO;
exports.emitProgress = emitProgress;
exports.emitComplete = emitComplete;
exports.emitFailed = emitFailed;
const socket_io_1 = require("socket.io");
let io = null;
function initSocketServer(server) {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL,
            methods: ['GET', 'POST'],
        },
    });
    io.on('connection', (socket) => {
        console.log(`🔌 WS client connected: ${socket.id}`);
        socket.on('join:assignment', (assignmentId) => {
            socket.join(`assignment:${assignmentId}`);
            console.log(`Socket ${socket.id} joined room assignment:${assignmentId}`);
        });
        socket.on('disconnect', () => {
            console.log(`🔌 WS client disconnected: ${socket.id}`);
        });
    });
    console.log('✅ WebSocket server initialized');
}
function getIO() {
    if (!io)
        throw new Error('Socket.io not initialized');
    return io;
}
function emitProgress(assignmentId, progress, message) {
    getIO().to(`assignment:${assignmentId}`).emit('generation:progress', {
        assignmentId,
        progress,
        message,
    });
}
function emitComplete(assignmentId, paperId) {
    getIO().to(`assignment:${assignmentId}`).emit('generation:complete', {
        assignmentId,
        paperId,
    });
}
function emitFailed(assignmentId, error) {
    getIO().to(`assignment:${assignmentId}`).emit('generation:failed', {
        assignmentId,
        error,
    });
}
