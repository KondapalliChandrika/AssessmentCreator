import { create } from 'zustand';
import { Assignment, QuestionPaper, GenerationStatus } from '@/lib/types';
import { api } from '@/lib/api';

interface AssignmentStore {
    assignments: Assignment[];
    currentAssignment: Assignment | null;
    currentPaper: QuestionPaper | null;
    generationStatus: GenerationStatus;
    loading: boolean;
    error: string | null;

    // Actions
    fetchAssignments: () => Promise<void>;
    fetchAssignment: (id: string) => Promise<void>;
    createAssignment: (formData: FormData) => Promise<string>;
    deleteAssignment: (id: string) => Promise<void>;
    fetchPaper: (assignmentId: string) => Promise<void>;
    regenerate: (assignmentId: string) => Promise<void>;
    setGenerationProgress: (progress: number, message: string) => void;
    setGenerating: (isGenerating: boolean) => void;
    resetGeneration: () => void;
    setCurrentAssignment: (a: Assignment | null) => void;
}

export const useAssignmentStore = create<AssignmentStore>((set, get) => ({
    assignments: [],
    currentAssignment: null,
    currentPaper: null,
    generationStatus: { isGenerating: false, progress: 0, message: '' },
    loading: false,
    error: null,

    fetchAssignments: async () => {
        set({ loading: true, error: null });
        try {
            const res = await api.getAssignments();
            set({ assignments: res.data as Assignment[], loading: false });
        } catch (err) {
            set({ error: (err as Error).message, loading: false });
        }
    },

    fetchAssignment: async (id: string) => {
        set({ loading: true, error: null });
        try {
            const res = await api.getAssignment(id);
            set({ currentAssignment: res.data as Assignment, loading: false });
        } catch (err) {
            set({ error: (err as Error).message, loading: false });
        }
    },

    createAssignment: async (formData: FormData) => {
        set({ loading: true, error: null });
        try {
            const res = await api.createAssignment(formData);
            const newAssignment = res.data as Assignment;
            set((state) => ({
                assignments: [newAssignment, ...state.assignments],
                loading: false,
            }));
            return newAssignment._id;
        } catch (err) {
            set({ error: (err as Error).message, loading: false });
            throw err;
        }
    },

    deleteAssignment: async (id: string) => {
        try {
            await api.deleteAssignment(id);
            set((state) => ({
                assignments: state.assignments.filter((a) => a._id !== id),
            }));
        } catch (err) {
            set({ error: (err as Error).message });
        }
    },

    fetchPaper: async (assignmentId: string) => {
        set({ loading: true, error: null });
        try {
            const res = await api.getPaper(assignmentId);
            set({ currentPaper: res.data as QuestionPaper, loading: false });
        } catch (err) {
            set({ error: (err as Error).message, loading: false });
        }
    },

    regenerate: async (assignmentId: string) => {
        try {
            await api.regenerate(assignmentId);
            set({ currentPaper: null });
        } catch (err) {
            set({ error: (err as Error).message });
        }
    },

    setGenerationProgress: (progress: number, message: string) => {
        set({ generationStatus: { isGenerating: true, progress, message } });
    },

    setGenerating: (isGenerating: boolean) => {
        set((state) => ({ generationStatus: { ...state.generationStatus, isGenerating } }));
    },

    resetGeneration: () => {
        set({ generationStatus: { isGenerating: false, progress: 0, message: '' } });
    },

    setCurrentAssignment: (a: Assignment | null) => {
        set({ currentAssignment: a });
    },
}));
