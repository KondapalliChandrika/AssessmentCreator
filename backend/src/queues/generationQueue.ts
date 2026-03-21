import { Queue } from 'bullmq';
import { getRedis } from '../services/cacheService';

export interface GenerationJobData {
    assignmentId: string;
}

let generationQueue: Queue<GenerationJobData> | null = null;

export function getGenerationQueue(): Queue<GenerationJobData> {
    if (!generationQueue) {
        generationQueue = new Queue<GenerationJobData>('generation', {
            connection: getRedis() as any,
        });
    }
    return generationQueue;
}
