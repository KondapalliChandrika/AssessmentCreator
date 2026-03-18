'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAssignmentStore } from '@/store/assignmentStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { api } from '@/lib/api';
import { QuestionPaper, Question } from '@/lib/types';
import ProgressModal from '@/components/ProgressModal/ProgressModal';
import TopHeader from '@/components/TopHeader/TopHeader';
import {
    ArrowPathIcon,
    DocumentArrowDownIcon,
    SparklesIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';


export default function AssignmentDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { currentAssignment, currentPaper, fetchAssignment, fetchPaper, regenerate, generationStatus, setGenerating, resetGeneration } = useAssignmentStore();
    const [regenerating, setRegenerating] = useState(false);

    useWebSocket(id);

    useEffect(() => {
        fetchAssignment(id);
        fetchPaper(id);
    }, [id, fetchAssignment, fetchPaper]);

    // When regeneration completes, reload paper
    useEffect(() => {
        if (generationStatus.progress === 100 && regenerating) {
            setRegenerating(false);
            setTimeout(() => {
                resetGeneration();
                fetchPaper(id);
            }, 1500);
        }
    }, [generationStatus.progress, regenerating, id, fetchPaper, resetGeneration]);

    const handleRegenerate = async () => {
        setRegenerating(true);
        setGenerating(true);
        await regenerate(id);
    };

    const handleDownloadPDF = () => {
        window.open(api.getPDFUrl(id), '_blank');
    };

    if (!currentAssignment) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin w-8 h-8 border-4 border-primary-0 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (currentAssignment.status === 'processing' || currentAssignment.status === 'pending') {
        return (
            <ProgressModal
                isOpen={true}
                progress={generationStatus.progress || 10}
                message={generationStatus.message || 'Processing...'}
                status="generating"
            />
        );
    }

    // While regenerating — paper is temporarily null, show progress overlay instead of error
    if (!currentPaper) {
        if (regenerating) {
            return (
                <ProgressModal
                    isOpen={true}
                    progress={generationStatus.progress || 10}
                    message={generationStatus.message || 'Generating question paper…'}
                    status="generating"
                />
            );
        }
        return (
            <div className="p-8 text-center">
                <p className="text-text-1">
                    {currentAssignment.status === 'failed'
                        ? 'Generation failed. Please regenerate.'
                        : 'Paper not found. Try regenerating.'}
                </p>
                <button
                    onClick={handleRegenerate}
                    className="mt-4 px-5 py-2 bg-primary-0 text-white rounded-lg text-sm font-medium"
                >
                    Regenerate
                </button>
            </div>
        );
    }

    const paper = currentPaper as QuestionPaper;

    return (
        <>
            {regenerating && (
                <ProgressModal
                    isOpen={true}
                    progress={generationStatus.progress}
                    message={generationStatus.message}
                    status={generationStatus.progress === 100 ? 'done' : 'generating'}
                />
            )}

            {/* ── Top navigation bar ── */}
            <TopHeader
                breadcrumb="Create New"
                breadcrumbHref="/assignments"
                showBack={true}
            />

            {/* ── Dark AI message banner ── */}
            <div className="bg-[#1A1A2E] text-white px-6 py-4">
                <div className="flex items-start gap-2 mb-3">
                    <SparklesIcon className="w-4 h-4 text-[#E8531D] flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-300 leading-relaxed">
                        Here&apos;s your customized Question Paper for{' '}
                        <strong className="text-white">{paper.metadata.subject}</strong> — Class{' '}
                        <strong className="text-white">{paper.metadata.grade}</strong>.
                        Download the PDF below.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        id="download-pdf-btn"
                        onClick={handleDownloadPDF}
                        className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-[#1A1A2E] text-sm font-semibold rounded-lg transition-colors"
                    >
                        <DocumentArrowDownIcon className="w-4 h-4" />
                        Download as PDF
                    </button>
                </div>
            </div>

            {/* ── Regenerate button row (LEFT-aligned) ── */}
            <div className="px-6 py-3 border-b border-[#E9ECEF] bg-white">
                <button
                    id="regenerate-btn"
                    onClick={handleRegenerate}
                    disabled={regenerating}
                    className="flex items-center gap-2 px-4 py-2 border border-[#D1D5DB] rounded-lg text-sm font-medium text-[#374151] hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    <ArrowPathIcon className="w-4 h-4" />
                    {regenerating ? 'Regenerating…' : 'Regenerate'}
                </button>
            </div>

            {/* ── Paper Content ── */}
            <div className="p-6">
                <div className="bg-background-1 border border-border-0 rounded-xl overflow-hidden max-w-4xl">
                    {/* Paper Header */}
                    <div className="text-center border-b border-border-0 py-6 px-8 bg-background-2">
                        <h2 className="text-xl font-bold text-text-0">{paper.metadata.school}</h2>
                        <p className="text-base font-semibold text-text-0 mt-1">Subject: {paper.metadata.subject}</p>
                        <p className="text-base font-semibold text-text-0">Class: {paper.metadata.grade}</p>
                    </div>

                    <div className="px-8 py-6">
                        {/* Meta row */}
                        <div className="flex justify-between text-sm text-text-1 mb-6">
                            <span>Time Allowed: <strong className="text-text-0">{paper.metadata.timeAllowed}</strong></span>
                            <span>Maximum Marks: <strong className="text-text-0">{paper.metadata.totalMarks}</strong></span>
                        </div>

                        {/* Student Info */}
                        <div className="mb-6 space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-text-0 w-32">Name:</span>
                                <div className="flex-1 border-b border-text-0" />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-text-0 w-32">Roll Number:</span>
                                <div className="flex-1 border-b border-text-0" />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-text-0 w-32">Class: 5th Section:</span>
                                <div className="flex-1 border-b border-text-0" />
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="bg-background-2 rounded-lg px-4 py-3 mb-6 text-sm text-text-1">
                            All questions are compulsory unless stated otherwise.
                        </div>

                        {/* Sections */}
                        {paper.sections.map((section) => (
                            <div key={section.label} className="mb-8">
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="text-base font-bold text-text-0">
                                        Section {section.label}: {section.title}
                                    </h3>
                                </div>
                                <p className="text-sm italic text-text-1 mb-4">{section.instruction}</p>

                                <ol className="space-y-4">
                                    {section.questions.map((q: Question) => {
                                        const diffLabel = q.difficulty === 'easy' ? 'Easy' : q.difficulty === 'medium' ? 'Moderate' : 'Hard';
                                        const diffStyle = q.difficulty === 'easy'
                                            ? 'bg-green-50 text-green-700 border border-green-200'
                                            : q.difficulty === 'medium'
                                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                : 'bg-red-50 text-red-700 border border-red-200';
                                        return (
                                            <li key={q.number} className="flex gap-3">
                                                <span className="text-sm font-semibold text-text-0 w-6 flex-shrink-0">{q.number}.</span>
                                                <div className="flex-1">
                                                    {/* Question + difficulty + marks all inline */}
                                                    <p className="text-sm text-text-0">
                                                        {q.text}&nbsp;
                                                        <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full align-middle ${diffStyle}`}>
                                                            {diffLabel}
                                                        </span>
                                                        <span className="text-xs text-text-2 font-medium ml-1.5 align-middle">
                                                            {q.marks} mark{q.marks > 1 ? 's' : ''}
                                                        </span>
                                                    </p>
                                                    {q.options && q.options.length > 0 && (
                                                        <ul className="mt-2 space-y-1 pl-4">
                                                            {q.options.map((opt, i) => (
                                                                <li key={i} className="text-sm text-text-1">{opt}</li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ol>
                            </div>
                        ))}

                        <div className="border-t border-border-0 pt-4 mt-4">
                            <p className="text-sm font-bold text-text-0">End of Question Paper</p>
                        </div>

                        {/* ── Answer Key ── */}
                        <div className="border-t-2 border-border-0 pt-6 mt-8">
                            <h3 className="text-base font-bold text-text-0 mb-4">Answer Key</h3>
                            <ol className="space-y-3">
                                {(() => {
                                    let n = 0;
                                    return paper.sections.flatMap((section) =>
                                        section.questions.map((q: Question) => {
                                            n++;
                                            const ans = q.answer?.trim() || 'Refer to solution guide.';
                                            return (
                                                <li key={`ans-${section.label}-${q.number}`} className="flex gap-2 text-sm">
                                                    <span className="font-semibold text-text-0 w-6 flex-shrink-0">{n}.</span>
                                                    <span className="text-text-1">{ans}</span>
                                                </li>
                                            );
                                        })
                                    );
                                })()}
                            </ol>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
