import { Worker, Job } from 'bullmq';
import { getRedis } from '../services/cacheService';
import { generateQuestionPaper } from '../services/aiService';
import { Assignment } from '../models/Assignment';
import { QuestionPaper } from '../models/QuestionPaper';
import { emitProgress, emitComplete, emitFailed } from '../websocket/socketServer';
import { cacheService } from '../services/cacheService';
import { GenerationJobData } from '../queues/generationQueue';

export function initWorker(): void {
    const worker = new Worker<GenerationJobData>(
        'generation',
        async (job: Job<GenerationJobData>) => {
            const { assignmentId } = job.data;

            try {
                // 1. Fetch assignment from DB
                const assignment = await Assignment.findById(assignmentId);
                if (!assignment) throw new Error(`Assignment ${assignmentId} not found`);

                // 2. Update status → processing
                assignment.status = 'processing';
                await assignment.save();

                emitProgress(assignmentId, 10, 'Starting AI generation...');
                await cacheService.setJobProgress(job.id || '', 10, 'Starting AI generation...');

                // 3. Build prompt and call Gemini
                emitProgress(assignmentId, 30, 'Calling AI model...');
                const parsed = await generateQuestionPaper(assignment);

                emitProgress(assignmentId, 70, 'Structuring question paper...');

                // 4. Compute total marks
                const totalMarks = assignment.questionConfig.reduce(
                    (sum, q) => sum + q.count * q.marksPerQuestion,
                    0
                );
                const totalQuestions = assignment.questionConfig.reduce((sum, q) => sum + q.count, 0);

                // 5. Save QuestionPaper to MongoDB
                const paper = await QuestionPaper.create({
                    assignmentId: assignment._id,
                    metadata: {
                        title: assignment.title,
                        subject: assignment.subject,
                        grade: assignment.grade,
                        timeAllowed: parsed.timeAllowed || '45 minutes',
                        totalMarks,
                        totalQuestions,
                        school: 'Delhi Public School',
                    },
                    sections: parsed.sections,
                    generatedAt: new Date(),
                });

                // 6. Cache the paper
                await cacheService.set(`paper:${assignmentId}`, paper.toObject(), 86400);

                // 7. Invalidate list cache
                await cacheService.del('assignments:list');

                // 8. Update assignment status → completed, and use quiz-style title from AI
                assignment.status = 'completed';
                assignment.totalMarks = totalMarks;
                assignment.totalQuestions = totalQuestions;
                if (parsed.suggestedTitle) {
                    assignment.title = parsed.suggestedTitle;
                }
                await assignment.save();

                emitProgress(assignmentId, 100, 'Question paper ready!');
                emitComplete(assignmentId, paper._id.toString());

                console.log(`✅ Generation complete for assignment ${assignmentId}`);
            } catch (err) {
                console.error(`❌ Generation failed for assignment ${assignmentId}:`, err);
                await Assignment.findByIdAndUpdate(assignmentId, { status: 'failed' });
                emitFailed(assignmentId, err instanceof Error ? err.message : 'Generation failed');
                throw err;
            }
        },
        {
            connection: getRedis(),
            concurrency: 3,
        }
    );

    worker.on('completed', (job) => {
        console.log(`✅ Job ${job.id} completed`);
    });

    worker.on('failed', (job, err) => {
        console.error(`❌ Job ${job?.id} failed:`, err.message);
    });

    console.log('✅ BullMQ Worker initialized');
}
