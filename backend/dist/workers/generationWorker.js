"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initWorker = initWorker;
const bullmq_1 = require("bullmq");
const cacheService_1 = require("../services/cacheService");
const aiService_1 = require("../services/aiService");
const Assignment_1 = require("../models/Assignment");
const QuestionPaper_1 = require("../models/QuestionPaper");
const socketServer_1 = require("../websocket/socketServer");
const cacheService_2 = require("../services/cacheService");
function initWorker() {
    const worker = new bullmq_1.Worker('generation', async (job) => {
        const { assignmentId } = job.data;
        try {
            // 1. Fetch assignment from DB
            const assignment = await Assignment_1.Assignment.findById(assignmentId);
            if (!assignment)
                throw new Error(`Assignment ${assignmentId} not found`);
            // 2. Update status → processing
            assignment.status = 'processing';
            await assignment.save();
            (0, socketServer_1.emitProgress)(assignmentId, 10, 'Starting AI generation...');
            await cacheService_2.cacheService.setJobProgress(job.id || '', 10, 'Starting AI generation...');
            // 3. Build prompt and call Gemini
            (0, socketServer_1.emitProgress)(assignmentId, 30, 'Calling AI model...');
            const parsed = await (0, aiService_1.generateQuestionPaper)(assignment);
            (0, socketServer_1.emitProgress)(assignmentId, 70, 'Structuring question paper...');
            // 4. Compute total marks
            const totalMarks = assignment.questionConfig.reduce((sum, q) => sum + q.count * q.marksPerQuestion, 0);
            const totalQuestions = assignment.questionConfig.reduce((sum, q) => sum + q.count, 0);
            // 5. Save QuestionPaper to MongoDB
            const paper = await QuestionPaper_1.QuestionPaper.create({
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
            await cacheService_2.cacheService.set(`paper:${assignmentId}`, paper.toObject(), 86400);
            // 7. Invalidate list cache
            await cacheService_2.cacheService.del('assignments:list');
            // 8. Update assignment status → completed, and use quiz-style title from AI
            assignment.status = 'completed';
            assignment.totalMarks = totalMarks;
            assignment.totalQuestions = totalQuestions;
            if (parsed.suggestedTitle) {
                assignment.title = parsed.suggestedTitle;
            }
            await assignment.save();
            (0, socketServer_1.emitProgress)(assignmentId, 100, 'Question paper ready!');
            (0, socketServer_1.emitComplete)(assignmentId, paper._id.toString());
            console.log(`✅ Generation complete for assignment ${assignmentId}`);
        }
        catch (err) {
            console.error(`❌ Generation failed for assignment ${assignmentId}:`, err);
            await Assignment_1.Assignment.findByIdAndUpdate(assignmentId, { status: 'failed' });
            (0, socketServer_1.emitFailed)(assignmentId, err instanceof Error ? err.message : 'Generation failed');
            throw err;
        }
    }, {
        connection: (0, cacheService_1.getRedis)(),
        concurrency: 3,
    });
    worker.on('completed', (job) => {
        console.log(`✅ Job ${job.id} completed`);
    });
    worker.on('failed', (job, err) => {
        console.error(`❌ Job ${job?.id} failed:`, err.message);
    });
    console.log('✅ BullMQ Worker initialized');
}
