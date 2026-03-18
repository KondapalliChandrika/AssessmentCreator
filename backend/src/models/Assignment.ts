import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestionConfig {
    type: string;
    count: number;
    marksPerQuestion: number;
}

export interface IAssignment extends Document {
    title: string;
    subject: string;
    grade: string;
    dueDate: Date;
    uploadedFileUrl: string | null;
    questionConfig: IQuestionConfig[];
    additionalInstructions: string;
    totalQuestions: number;
    totalMarks: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    jobId: string | null;
    createdAt: Date;
    updatedAt: Date;
}

const QuestionConfigSchema = new Schema<IQuestionConfig>({
    type: { type: String, required: true },
    count: { type: Number, required: true, min: 1 },
    marksPerQuestion: { type: Number, required: true, min: 1 },
});

const AssignmentSchema = new Schema<IAssignment>(
    {
        title: { type: String, required: true },
        subject: { type: String, required: true },
        grade: { type: String, required: true },
        dueDate: { type: Date, required: true },
        uploadedFileUrl: { type: String, default: null },
        questionConfig: { type: [QuestionConfigSchema], required: true },
        additionalInstructions: { type: String, default: '' },
        totalQuestions: { type: Number, default: 0 },
        totalMarks: { type: Number, default: 0 },
        status: {
            type: String,
            enum: ['pending', 'processing', 'completed', 'failed'],
            default: 'pending',
        },
        jobId: { type: String, default: null },
    },
    { timestamps: true }
);

export const Assignment = mongoose.model<IAssignment>('Assignment', AssignmentSchema);
