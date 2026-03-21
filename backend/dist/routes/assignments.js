"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignmentRoutes = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const promises_1 = __importDefault(require("fs/promises"));
const uuid_1 = require("uuid");
const Assignment_1 = require("../models/Assignment");
const QuestionPaper_1 = require("../models/QuestionPaper");
const generationQueue_1 = require("../queues/generationQueue");
const cacheService_1 = require("../services/cacheService");
const pdfService_1 = require("../services/pdfService");
const aiService_1 = require("../services/aiService");
const router = (0, express_1.Router)();
exports.assignmentRoutes = router;
// Multer setup
const uploadDir = path_1.default.join(__dirname, '../../uploads');
if (!fs_1.default.existsSync(uploadDir))
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => cb(null, `${(0, uuid_1.v4)()}-${file.originalname}`),
});
const upload = (0, multer_1.default)({ storage, limits: { fileSize: 10 * 1024 * 1024 } });
// POST /api/assignments — Create + enqueue
router.post('/', upload.single('file'), async (req, res) => {
    try {
        const { title, subject, grade, dueDate, questionConfig, additionalInstructions, } = req.body;
        // Parse questionConfig (always comes as JSON string from FormData)
        let parsedConfig;
        try {
            parsedConfig = typeof questionConfig === 'string'
                ? JSON.parse(questionConfig)
                : questionConfig;
        }
        catch {
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
                    const imageBuffer = await promises_1.default.readFile(req.file.path);
                    const extracted = await (0, aiService_1.extractMetadataFromImage)(imageBuffer, req.file.mimetype);
                    // Only override if the form fields were not explicitly provided
                    if (!resolvedSubject || resolvedSubject === 'General')
                        resolvedSubject = extracted.subject;
                    if (!resolvedGrade || resolvedGrade === 'General')
                        resolvedGrade = extracted.grade;
                    if (!resolvedTitle || resolvedTitle === 'Assignment')
                        resolvedTitle = extracted.title;
                }
                catch {
                    // Fall through to defaults
                }
            }
        }
        const assignment = await Assignment_1.Assignment.create({
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
        const queue = (0, generationQueue_1.getGenerationQueue)();
        const job = await queue.add('generate', { assignmentId: assignment._id.toString() });
        assignment.jobId = job.id?.toString() || null;
        await assignment.save();
        // Invalidate list cache
        await cacheService_1.cacheService.del('assignments:list');
        res.status(201).json({ success: true, data: assignment });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Failed to create assignment' });
    }
});
// GET /api/assignments — List all
router.get('/', async (_req, res) => {
    try {
        const cached = await cacheService_1.cacheService.get('assignments:list');
        if (cached)
            return res.json({ success: true, data: cached, cached: true });
        const assignments = await Assignment_1.Assignment.find().sort({ createdAt: -1 });
        await cacheService_1.cacheService.set('assignments:list', assignments, 300);
        res.json({ success: true, data: assignments });
    }
    catch (err) {
        res.status(500).json({ success: false, error: 'Failed to fetch assignments' });
    }
});
// GET /api/assignments/:id — Get single
router.get('/:id', async (req, res) => {
    try {
        const assignment = await Assignment_1.Assignment.findById(req.params.id);
        if (!assignment)
            return res.status(404).json({ success: false, error: 'Not found' });
        res.json({ success: true, data: assignment });
    }
    catch (err) {
        res.status(500).json({ success: false, error: 'Failed to fetch assignment' });
    }
});
// DELETE /api/assignments/:id
router.delete('/:id', async (req, res) => {
    try {
        await Assignment_1.Assignment.findByIdAndDelete(req.params.id);
        await QuestionPaper_1.QuestionPaper.deleteMany({ assignmentId: req.params.id });
        await cacheService_1.cacheService.del(`paper:${req.params.id}`);
        await cacheService_1.cacheService.del('assignments:list');
        res.json({ success: true, message: 'Deleted' });
    }
    catch (err) {
        res.status(500).json({ success: false, error: 'Failed to delete' });
    }
});
// GET /api/assignments/:id/paper — Get question paper
router.get('/:id/paper', async (req, res) => {
    try {
        const cached = await cacheService_1.cacheService.get(`paper:${req.params.id}`);
        if (cached)
            return res.json({ success: true, data: cached, cached: true });
        const paper = await QuestionPaper_1.QuestionPaper.findOne({ assignmentId: req.params.id });
        if (!paper)
            return res.status(404).json({ success: false, error: 'Paper not found' });
        await cacheService_1.cacheService.set(`paper:${req.params.id}`, paper.toObject(), 86400);
        res.json({ success: true, data: paper });
    }
    catch (err) {
        res.status(500).json({ success: false, error: 'Failed to fetch paper' });
    }
});
// POST /api/assignments/:id/regenerate — Re-trigger AI
router.post('/:id/regenerate', async (req, res) => {
    try {
        const assignment = await Assignment_1.Assignment.findByIdAndUpdate(req.params.id, { status: 'pending' }, { new: true });
        if (!assignment)
            return res.status(404).json({ success: false, error: 'Not found' });
        await QuestionPaper_1.QuestionPaper.deleteMany({ assignmentId: req.params.id });
        await cacheService_1.cacheService.del(`paper:${req.params.id}`);
        await cacheService_1.cacheService.del('assignments:list');
        const queue = (0, generationQueue_1.getGenerationQueue)();
        const job = await queue.add('generate', { assignmentId: req.params.id });
        assignment.jobId = job.id?.toString() || null;
        await assignment.save();
        res.json({ success: true, data: assignment });
    }
    catch (err) {
        res.status(500).json({ success: false, error: 'Failed to regenerate' });
    }
});
// GET /api/assignments/:id/pdf — Download PDF
router.get('/:id/pdf', async (req, res) => {
    try {
        const paper = await QuestionPaper_1.QuestionPaper.findOne({ assignmentId: req.params.id });
        if (!paper)
            return res.status(404).json({ success: false, error: 'Paper not found' });
        const pdfBuffer = await (0, pdfService_1.generatePDF)(paper);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${paper.metadata.title}.pdf"`);
        res.send(pdfBuffer);
    }
    catch (err) {
        res.status(500).json({ success: false, error: 'Failed to generate PDF' });
    }
});
