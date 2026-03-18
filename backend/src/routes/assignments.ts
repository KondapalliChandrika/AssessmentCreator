import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import fsPromises from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { Assignment } from '../models/Assignment';
import { QuestionPaper } from '../models/QuestionPaper';
import { getGenerationQueue } from '../queues/generationQueue';
import { cacheService } from '../services/cacheService';
import { generatePDF } from '../services/pdfService';
import { extractMetadataFromImage } from '../services/aiService';

const router = Router();

// Multer setup
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => cb(null, `${uuidv4()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// POST /api/assignments — Create + enqueue
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
    try {
        const {
            title,
            subject,
            grade,
            dueDate,
            questionConfig,
            additionalInstructions,
        } = req.body;

        // Parse questionConfig (always comes as JSON string from FormData)
        let parsedConfig: Array<{ type: string; count: number; marksPerQuestion: number }>;
        try {
            parsedConfig = typeof questionConfig === 'string'
                ? JSON.parse(questionConfig)
                : questionConfig;
        } catch {
            return res.status(400).json({ success: false, error: 'Invalid questionConfig JSON' });
        }

        // Validate and sanitize — filter out entries missing type/count/marks
        const validConfig = parsedConfig
            .filter((q) => q && typeof q.type === 'string' && q.type.trim() !== '' && q.count > 0 && q.marksPerQuestion > 0)
            .map((q) => ({
                type: q.type.trim(),
                count: Number(q.count),
                marksPerQuestion: Number(q.marksPerQuestion),
            }));

        if (validConfig.length === 0) {
            return res.status(400).json({ success: false, error: 'At least one valid question type is required' });
        }

        if (!dueDate) {
            return res.status(400).json({ success: false, error: 'Due date is required' });
        }

        const totalQuestions = validConfig.reduce((s, q) => s + q.count, 0);
        const totalMarks = validConfig.reduce((s, q) => s + q.count * q.marksPerQuestion, 0);

        // ── If an image was uploaded, use Gemini Vision to extract metadata ──
        let resolvedTitle = title;
        let resolvedSubject = subject;
        let resolvedGrade = grade;

        if (req.file) {
            const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
            if (allowedImageTypes.includes(req.file.mimetype)) {
                try {
                    const imageBuffer = await fsPromises.readFile(req.file.path);
                    const extracted = await extractMetadataFromImage(imageBuffer, req.file.mimetype);
                    // Only override if the form fields were not explicitly provided
                    if (!resolvedSubject || resolvedSubject === 'General') resolvedSubject = extracted.subject;
                    if (!resolvedGrade || resolvedGrade === 'General') resolvedGrade = extracted.grade;
                    if (!resolvedTitle || resolvedTitle === 'Assignment') resolvedTitle = extracted.title;
                } catch {
                    // Fall through to defaults
                }
            }
        }

        const assignment = await Assignment.create({
            title: resolvedTitle || 'Assignment',
            subject: resolvedSubject || 'General',
            grade: resolvedGrade || 'General',
            dueDate: new Date(dueDate),
            uploadedFileUrl: req.file ? `/uploads/${req.file.filename}` : null,
            questionConfig: validConfig,
            additionalInstructions: additionalInstructions || '',
            totalQuestions,
            totalMarks,
            status: 'pending',
        });

        // Enqueue job
        const queue = getGenerationQueue();
        const job = await queue.add('generate', { assignmentId: assignment._id.toString() });
        assignment.jobId = job.id?.toString() || null;
        await assignment.save();

        // Invalidate list cache
        await cacheService.del('assignments:list');

        res.status(201).json({ success: true, data: assignment });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Failed to create assignment' });
    }
});

// GET /api/assignments — List all
router.get('/', async (_req: Request, res: Response) => {
    try {
        const cached = await cacheService.get<unknown>('assignments:list');
        if (cached) return res.json({ success: true, data: cached, cached: true });

        const assignments = await Assignment.find().sort({ createdAt: -1 });
        await cacheService.set('assignments:list', assignments, 300);
        res.json({ success: true, data: assignments });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to fetch assignments' });
    }
});

// GET /api/assignments/:id — Get single
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const assignment = await Assignment.findById(req.params.id);
        if (!assignment) return res.status(404).json({ success: false, error: 'Not found' });
        res.json({ success: true, data: assignment });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to fetch assignment' });
    }
});

// DELETE /api/assignments/:id
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        await Assignment.findByIdAndDelete(req.params.id);
        await QuestionPaper.deleteMany({ assignmentId: req.params.id });
        await cacheService.del(`paper:${req.params.id}`);
        await cacheService.del('assignments:list');
        res.json({ success: true, message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to delete' });
    }
});

// GET /api/assignments/:id/paper — Get question paper
router.get('/:id/paper', async (req: Request, res: Response) => {
    try {
        const cached = await cacheService.get<unknown>(`paper:${req.params.id}`);
        if (cached) return res.json({ success: true, data: cached, cached: true });

        const paper = await QuestionPaper.findOne({ assignmentId: req.params.id });
        if (!paper) return res.status(404).json({ success: false, error: 'Paper not found' });

        await cacheService.set(`paper:${req.params.id}`, paper.toObject(), 86400);
        res.json({ success: true, data: paper });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to fetch paper' });
    }
});

// POST /api/assignments/:id/regenerate — Re-trigger AI
router.post('/:id/regenerate', async (req: Request, res: Response) => {
    try {
        const assignment = await Assignment.findByIdAndUpdate(
            req.params.id,
            { status: 'pending' },
            { new: true }
        );
        if (!assignment) return res.status(404).json({ success: false, error: 'Not found' });

        await QuestionPaper.deleteMany({ assignmentId: req.params.id });
        await cacheService.del(`paper:${req.params.id}`);
        await cacheService.del('assignments:list');

        const queue = getGenerationQueue();
        const job = await queue.add('generate', { assignmentId: req.params.id });
        assignment.jobId = job.id?.toString() || null;
        await assignment.save();

        res.json({ success: true, data: assignment });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to regenerate' });
    }
});

// GET /api/assignments/:id/pdf — Download PDF
router.get('/:id/pdf', async (req: Request, res: Response) => {
    try {
        const paper = await QuestionPaper.findOne({ assignmentId: req.params.id });
        if (!paper) return res.status(404).json({ success: false, error: 'Paper not found' });

        const pdfBuffer = await generatePDF(paper);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${paper.metadata.title}.pdf"`);
        res.send(pdfBuffer);
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to generate PDF' });
    }
});

export { router as assignmentRoutes };
