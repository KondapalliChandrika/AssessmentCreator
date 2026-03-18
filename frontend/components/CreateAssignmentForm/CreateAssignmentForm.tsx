'use client';

import { useState, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import { useAssignmentStore } from '@/store/assignmentStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import ProgressModal from '@/components/ProgressModal/ProgressModal';
import TopHeader from '@/components/TopHeader/TopHeader';
import {
    CloudArrowUpIcon,
    PlusCircleIcon,
    TrashIcon,
    MinusIcon,
    PlusIcon,
    CalendarDaysIcon,
    ArrowLeftIcon,
    ArrowRightIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

const schema = z.object({
    dueDate: z.string().min(1, 'Due date is required'),
    additionalInstructions: z.string().optional(),
    questionConfig: z.array(z.object({
        type: z.string().min(1),
        count: z.number().min(1),
        marksPerQuestion: z.number().min(1),
    })).min(1),
});

type FormValues = z.infer<typeof schema>;

const DEFAULT_QUESTION_TYPES = [
    'Multiple Choice Questions',
    'Short Questions',
    'Diagram/Graph Based Questions',
    'Numerical Problems',
    'Long Answer Questions',
    'True or False',
    'Fill in the Blanks',
];

export default function CreateAssignmentForm() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [fileError, setFileError] = useState(false);
    const [assignmentId, setAssignmentId] = useState<string | null>(null);
    const [modalStatus, setModalStatus] = useState<'generating' | 'done' | 'failed'>('generating');
    const { createAssignment, generationStatus, setGenerating, resetGeneration } = useAssignmentStore();

    const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            dueDate: '',
            additionalInstructions: '',
            questionConfig: [
                { type: 'Multiple Choice Questions', count: 4, marksPerQuestion: 1 },
                { type: 'Short Questions', count: 3, marksPerQuestion: 2 },
                { type: 'Diagram/Graph Based Questions', count: 5, marksPerQuestion: 5 },
                { type: 'Numerical Problems', count: 5, marksPerQuestion: 5 },
            ],
        },
    });

    const { fields, append, remove } = useFieldArray({ control, name: 'questionConfig' });
    const questionConfig = watch('questionConfig');

    const totalQuestions = questionConfig.reduce((s, q) => s + (q.count || 0), 0);
    const totalMarks = questionConfig.reduce((s, q) => s + (q.count || 0) * (q.marksPerQuestion || 0), 0);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles[0]) {
            setFile(acceptedFiles[0]);
            setFileError(false);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'], 'image/*': ['.jpg', '.jpeg', '.png'] },
        maxFiles: 1,
    });

    useWebSocket(assignmentId);

    const onSubmit = async (data: FormValues) => {
        if (!file) {
            setFileError(true);
            return;
        }
        const formData = new FormData();
        formData.append('title', 'Assignment');
        formData.append('subject', 'General');
        formData.append('grade', 'General');
        formData.append('dueDate', data.dueDate);
        formData.append('additionalInstructions', data.additionalInstructions || '');
        formData.append('questionConfig', JSON.stringify(data.questionConfig));
        if (file) formData.append('file', file);

        try {
            setGenerating(true);
            const id = await createAssignment(formData);
            setAssignmentId(id);
        } catch {
            setModalStatus('failed');
        }
    };

    if (generationStatus.progress === 100 && assignmentId && modalStatus === 'generating') {
        setModalStatus('done');
        setTimeout(() => { resetGeneration(); router.push(`/assignments/${assignmentId}`); }, 1500);
    }

    return (
        <>
            <ProgressModal
                isOpen={generationStatus.isGenerating || modalStatus === 'done' || modalStatus === 'failed'}
                progress={generationStatus.progress}
                message={generationStatus.message}
                status={modalStatus}
                onClose={() => { setGenerating(false); resetGeneration(); setModalStatus('generating'); }}
            />

            {/* ── Top navigation bar — back arrow + "Assignment" breadcrumb ── */}
            <TopHeader
                breadcrumb="Assignment"
                breadcrumbHref="/assignments"
                showBack={true}
            />

            {/* ── Page title section: green dot + title + subtitle + progress bar ── */}
            <div className="bg-white border-b border-[#E9ECEF] px-4 sm:px-6 pb-4 pt-4">
                <div className="flex items-center gap-2 mb-0.5">
                    {/* Green status dot */}
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0" />
                    <h1 className="text-base font-bold text-[#111827]">Create Assignment</h1>
                </div>
                <p className="text-xs text-[#9CA3AF] ml-[18px]">Manage and create assignments for your classes </p>
                {/* Progress bar */}
                <div className="mt-3 h-1 bg-[#E9ECEF] rounded-full overflow-hidden">
                    <div className="h-full bg-[#1A1A2E] rounded-full w-1/2 transition-all" />
                </div>
            </div>

            {/* ── Centered form ── */}
            <div className="flex justify-center px-4 py-6">
                <div className="w-full max-w-2xl">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

                        {/* ── Assignment Details Card ── */}
                        <div className="bg-white border border-[#E9ECEF] rounded-xl overflow-hidden shadow-sm">
                            <div className="px-5 py-4 border-b border-[#E9ECEF]">
                                <h2 className="text-sm font-semibold text-[#111827]">Assignment Details</h2>
                                <p className="text-xs text-[#9CA3AF] mt-0.5">Basic information about your assignment</p>
                            </div>

                            <div className="p-5 space-y-5">
                                {/* ── File upload ── */}
                                <div>
                                    <label className="block text-sm font-medium text-[#374151] mb-1.5">
                                        Upload Material <span className="text-red-500">*</span>
                                    </label>
                                    <div
                                        {...getRootProps()}
                                        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${fileError
                                                ? 'border-red-400 bg-red-50'
                                                : isDragActive
                                                    ? 'border-[#E8531D] bg-orange-50'
                                                    : 'border-[#D1D5DB] hover:border-[#E8531D] bg-[#FAFAFA]'
                                            }`}
                                    >
                                        <input {...getInputProps()} />
                                        <CloudArrowUpIcon className="w-8 h-8 text-[#9CA3AF] mb-2" />
                                        {file ? (
                                            <p className="text-sm font-medium text-[#111827]">{file.name}</p>
                                        ) : (
                                            <>
                                                <p className="text-sm text-[#6B7280] text-center font-medium">
                                                    Choose a file or drag &amp; drop it here
                                                </p>
                                                <p className="text-xs text-[#9CA3AF] mt-0.5">JPG, PNG, GIF up to 10MB</p>
                                                <button
                                                    type="button"
                                                    className="mt-3 px-4 py-1.5 border border-[#D1D5DB] rounded-lg text-xs text-[#374151] font-medium hover:bg-white bg-white transition-colors shadow-sm"
                                                >
                                                    Browse Files
                                                </button>
                                            </>
                                        )}
                                    </div>
                                    {fileError && (
                                        <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                                            <span>⚠</span> Please upload an image or PDF before continuing.
                                        </p>
                                    )}
                                    {!fileError && (
                                        <p className="text-xs text-[#9CA3AF] mt-1.5">Upload images of your preferred document/image</p>
                                    )}
                                </div>

                                {/* ── Due Date ── */}
                                <div>
                                    <label className="block text-sm font-medium text-[#374151] mb-1.5">Due Date</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            {...register('dueDate')}
                                            placeholder="Choose a chapter"
                                            className="w-full pl-3 pr-10 py-2.5 text-sm border border-[#D1D5DB] rounded-lg bg-white text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#E8531D]/20 focus:border-[#E8531D]"
                                        />
                                        <CalendarDaysIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
                                    </div>
                                    {errors.dueDate && <p className="text-xs text-red-500 mt-1">{errors.dueDate.message}</p>}
                                </div>

                                {/* ── Question Type Table ── */}
                                <div>
                                    <div className="border border-[#E9ECEF] rounded-xl overflow-hidden">
                                        {/* Table header */}
                                        <div className="grid grid-cols-[1fr_auto_auto_auto] bg-[#F9FAFB] px-4 py-2.5 border-b border-[#E9ECEF] gap-4">
                                            <span className="text-xs font-semibold text-[#6B7280]">Question Type</span>
                                            <span className="text-xs font-semibold text-[#6B7280] w-32 text-center">No. of Questions</span>
                                            <span className="text-xs font-semibold text-[#6B7280] w-16 text-center">Marks</span>
                                            <span className="w-8" />
                                        </div>

                                        {fields.map((field, idx) => (
                                            <div
                                                key={field.id}
                                                className="grid grid-cols-[1fr_auto_auto_auto] px-4 py-3 border-b border-[#E9ECEF] last:border-b-0 items-center gap-4"
                                            >
                                                {/* Question type select */}
                                                <select
                                                    {...register(`questionConfig.${idx}.type`)}
                                                    className="text-sm border border-[#D1D5DB] rounded-lg px-2.5 py-2 bg-white text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#E8531D]/20 focus:border-[#E8531D] w-full"
                                                >
                                                    {DEFAULT_QUESTION_TYPES.map((t) => (
                                                        <option key={t} value={t}>{t}</option>
                                                    ))}
                                                </select>

                                                {/* Count stepper */}
                                                <div className="flex items-center gap-1.5 w-32 justify-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const cur = questionConfig[idx]?.count || 1;
                                                            if (cur > 1) setValue(`questionConfig.${idx}.count`, cur - 1);
                                                        }}
                                                        className="w-6 h-6 rounded border border-[#D1D5DB] flex items-center justify-center text-[#6B7280] hover:bg-gray-100 flex-shrink-0"
                                                    >
                                                        <MinusIcon className="w-3 h-3" />
                                                    </button>
                                                    <input
                                                        type="number"
                                                        {...register(`questionConfig.${idx}.count`, { valueAsNumber: true })}
                                                        className="w-10 text-center text-sm border border-[#D1D5DB] rounded-lg py-1.5 bg-white text-[#111827] focus:outline-none"
                                                        min={1}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setValue(`questionConfig.${idx}.count`, (questionConfig[idx]?.count || 0) + 1)}
                                                        className="w-6 h-6 rounded border border-[#D1D5DB] flex items-center justify-center text-[#6B7280] hover:bg-gray-100 flex-shrink-0"
                                                    >
                                                        <PlusIcon className="w-3 h-3" />
                                                    </button>
                                                </div>

                                                {/* Marks */}
                                                <div className="flex items-center gap-1.5 w-16 justify-center">
                                                    <input
                                                        type="number"
                                                        {...register(`questionConfig.${idx}.marksPerQuestion`, { valueAsNumber: true })}
                                                        className="w-14 text-center text-sm border border-[#D1D5DB] rounded-lg py-1.5 bg-white text-[#111827] focus:outline-none"
                                                        min={1}
                                                    />
                                                </div>

                                                {/* Delete */}
                                                <button
                                                    type="button"
                                                    onClick={() => remove(idx)}
                                                    disabled={fields.length === 1}
                                                    className="w-8 h-8 flex items-center justify-center text-[#9CA3AF] hover:text-red-500 disabled:opacity-30 transition-colors"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Add Question Type */}
                                    <button
                                        type="button"
                                        onClick={() => append({ type: DEFAULT_QUESTION_TYPES[0], count: 2, marksPerQuestion: 2 })}
                                        className="mt-3 flex items-center gap-1.5 text-sm text-[#E8531D] font-semibold hover:text-[#D44417] transition-colors"
                                    >
                                        <PlusCircleIcon className="w-4 h-4" />
                                        Add Question Type
                                    </button>
                                </div>

                                {/* Totals */}
                                <div className="flex gap-8 text-sm text-[#6B7280] justify-end border-t border-[#E9ECEF] pt-3">
                                    <span>Total Questions : <strong className="text-[#111827]">{totalQuestions}</strong></span>
                                    <span>Total Marks : <strong className="text-[#111827]">{totalMarks}</strong></span>
                                </div>

                                {/* Additional Instructions */}
                                <div>
                                    <label className="block text-sm font-medium text-[#374151] mb-1.5">
                                        Additional Information <span className="text-[#9CA3AF] font-normal text-xs">(For better output)</span>
                                    </label>
                                    <textarea
                                        {...register('additionalInstructions')}
                                        rows={3}
                                        placeholder="e.g Generate a question paper for 3 hour exam duration..."
                                        className="w-full px-3 py-2.5 text-sm border border-[#D1D5DB] rounded-lg bg-white text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#E8531D]/20 focus:border-[#E8531D] resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ── Action Buttons ── */}
                        <div className="flex items-center justify-between pb-6">
                            <Link
                                href="/assignments"
                                className="flex items-center gap-2 px-5 py-2.5 border border-[#D1D5DB] rounded-lg text-sm font-medium text-[#374151] hover:bg-gray-100 transition-colors"
                            >
                                <ArrowLeftIcon className="w-4 h-4" />
                                Previous
                            </Link>
                            <button
                                type="submit"
                                id="submit-assignment-btn"
                                disabled={generationStatus.isGenerating}
                                className="flex items-center gap-2 px-6 py-2.5 bg-[#1A1A2E] hover:bg-[#0D0D1F] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                            >
                                {generationStatus.isGenerating ? 'Generating...' : (
                                    <>Next <ArrowRightIcon className="w-4 h-4" /></>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
