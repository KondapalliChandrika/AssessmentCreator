import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion {
    number: number;
    text: string;
    difficulty: 'easy' | 'medium' | 'hard';
    marks: number;
    type: string;
    options?: string[];
    answer?: string; // model answer / correct option key
}

export interface ISection {
    label: string;
    title: string;
    instruction: string;
    questions: IQuestion[];
}

export interface IQuestionPaper extends Document {
    assignmentId: mongoose.Types.ObjectId;
    metadata: {
        title: string;
        subject: string;
        grade: string;
        timeAllowed: string;
        totalMarks: number;
        totalQuestions: number;
        school: string;
    };
    sections: ISection[];
    generatedAt: Date;
    pdfUrl: string | null;
}

const QuestionSchema = new Schema<IQuestion>({
    number: { type: Number, required: true },
    text: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    marks: { type: Number, required: true },
    type: { type: String, required: true },
    options: { type: [String], default: undefined },
    answer: { type: String, default: undefined },
});

const SectionSchema = new Schema<ISection>({
    label: { type: String, required: true },
    title: { type: String, required: true },
    instruction: { type: String, required: true },
    questions: [QuestionSchema],
});

const QuestionPaperSchema = new Schema<IQuestionPaper>(
    {
        assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
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
    },
    { timestamps: true }
);

export const QuestionPaper = mongoose.model<IQuestionPaper>('QuestionPaper', QuestionPaperSchema);
