// Shared TypeScript types for the VedaAI frontend

export interface QuestionConfig {
    type: string;
    count: number;
    marksPerQuestion: number;
}

export interface Assignment {
    _id: string;
    title: string;
    subject: string;
    grade: string;
    dueDate: string;
    uploadedFileUrl: string | null;
    questionConfig: QuestionConfig[];
    additionalInstructions: string;
    totalQuestions: number;
    totalMarks: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    jobId: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface Question {
    number: number;
    text: string;
    difficulty: 'easy' | 'medium' | 'hard';
    marks: number;
    type: string;
    options?: string[];
    answer?: string;
}

export interface Section {
    label: string;
    title: string;
    instruction: string;
    questions: Question[];
}

export interface PaperMetadata {
    title: string;
    subject: string;
    grade: string;
    timeAllowed: string;
    totalMarks: number;
    totalQuestions: number;
    school: string;
}

export interface QuestionPaper {
    _id: string;
    assignmentId: string;
    metadata: PaperMetadata;
    sections: Section[];
    generatedAt: string;
    pdfUrl: string | null;
}

export interface CreateAssignmentInput {
    title: string;
    subject: string;
    grade: string;
    dueDate: string;
    questionConfig: QuestionConfig[];
    additionalInstructions?: string;
    file?: File | null;
}

export interface GenerationStatus {
    isGenerating: boolean;
    progress: number;
    message: string;
}
