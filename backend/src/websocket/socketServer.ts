import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';

let io: SocketServer | null = null;

export function initSocketServer(server: HttpServer): void {
    io = new SocketServer(server, {
        cors: {
            origin: process.env.FRONTEND_URL,
            methods: ['GET', 'POST'],
        },
    });

    io.on('connection', (socket: Socket) => {
        console.log(`🔌 WS client connected: ${socket.id}`);

        socket.on('join:assignment', (assignmentId: string) => {
            socket.join(`assignment:${assignmentId}`);
            console.log(`Socket ${socket.id} joined room assignment:${assignmentId}`);
        });

        socket.on('disconnect', () => {
            console.log(`🔌 WS client disconnected: ${socket.id}`);
        });
    });

    console.log('✅ WebSocket server initialized');
}

export function getIO(): SocketServer {
    if (!io) throw new Error('Socket.io not initialized');
    return io;
}

export function emitProgress(assignmentId: string, progress: number, message: string): void {
    getIO().to(`assignment:${assignmentId}`).emit('generation:progress', {
        assignmentId,
        progress,
        message,
    });
}

export function emitComplete(assignmentId: string, paperId: string): void {
    getIO().to(`assignment:${assignmentId}`).emit('generation:complete', {
        assignmentId,
        paperId,
    });
}

export function emitFailed(assignmentId: string, error: string): void {
    getIO().to(`assignment:${assignmentId}`).emit('generation:failed', {
        assignmentId,
        error,
    });
}
