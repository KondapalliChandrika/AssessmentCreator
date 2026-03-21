"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionPaper = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const QuestionSchema = new mongoose_1.Schema({
    number: { type: Number, required: true },
    text: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    marks: { type: Number, required: true },
    type: { type: String, required: true },
    options: { type: [String], default: undefined },
    answer: { type: String, default: undefined },
});
const SectionSchema = new mongoose_1.Schema({
    label: { type: String, required: true },
    title: { type: String, required: true },
    instruction: { type: String, required: true },
    questions: [QuestionSchema],
});
const QuestionPaperSchema = new mongoose_1.Schema({
    assignmentId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Assignment', required: true },
    metadata: {
        title: { type: String, required: true },
        subject: { type: String, required: true },
        grade: { type: String, required: true },
        timeAllowed: { type: String, required: true },
        totalMarks: { type: Number, required: true },
        totalQuestions: { type: Number, required: true },
        school: { type: String, default: 'School' },
    },
    sections: [SectionSchema],
    generatedAt: { type: Date, default: Date.now },
    pdfUrl: { type: String, default: null },
}, { timestamps: true });
exports.QuestionPaper = mongoose_1.default.model('QuestionPaper', QuestionPaperSchema);
