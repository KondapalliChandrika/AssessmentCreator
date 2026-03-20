'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAssignmentStore } from '@/store/assignmentStore';

export function useWebSocket(assignmentId: string | null) {
    const socketRef = useRef<Socket | null>(null);
    const { setGenerationProgress, setGenerating, fetchAssignments, fetchPaper, fetchAssignment } = useAssignmentStore();

    useEffect(() => {
        if (!assignmentId) return;

        const socket = io(process.env.NEXT_PUBLIC_WS_URL, {
            transports: ['websocket'],
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            socket.emit('join:assignment', assignmentId);
        });

        socket.on('generation:progress', (data: { assignmentId: string; progress: number; message: string }) => {
            if (data.assignmentId === assignmentId) {
                setGenerationProgress(data.progress, data.message);
            }
        });

        socket.on('generation:complete', async (data: { assignmentId: string; paperId: string }) => {
            if (data.assignmentId === assignmentId) {
                setGenerationProgress(100, 'Question paper ready!');
                await fetchAssignment(assignmentId);
                await fetchPaper(assignmentId);
                await fetchAssignments();
            }
        });

        socket.on('generation:failed', (data: { assignmentId: string; error: string }) => {
            if (data.assignmentId === assignmentId) {
                setGenerating(false);
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [assignmentId, setGenerationProgress, setGenerating, fetchAssignments, fetchPaper, fetchAssignment]);

    return socketRef;
}
