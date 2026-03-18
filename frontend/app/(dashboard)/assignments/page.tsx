'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MagnifyingGlassIcon, FunnelIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useAssignmentStore } from '@/store/assignmentStore';
import AssignmentCard from '@/components/AssignmentCard/AssignmentCard';
import TopHeader from '@/components/TopHeader/TopHeader';

export default function AssignmentsPage() {
    const { assignments, fetchAssignments, deleteAssignment, loading } = useAssignmentStore();
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchAssignments();
    }, [fetchAssignments]);

    const filtered = assignments.filter((a) =>
        a.title.toLowerCase().includes(search.toLowerCase())
    );

    // ── Empty state ──────────────────────────────────────────────
    if (!loading && assignments.length === 0) {
        return (
            <div className="flex flex-col h-full">
                <TopHeader
                    breadcrumb="Assignment"
                    breadcrumbHref="/assignments"
                />
                <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
                    {/* Illustration: magnifying glass with X */}
                    <div className="mb-6">
                        <svg width="180" height="160" viewBox="0 0 180 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                            {/* Background blobs */}
                            <ellipse cx="90" cy="130" rx="70" ry="20" fill="#E8E8F0" opacity="0.5" />
                            <circle cx="65" cy="75" r="52" fill="#EDECF6" />
                            {/* Document icon */}
                            <rect x="42" y="38" width="46" height="58" rx="4" fill="white" stroke="#C4C2D4" strokeWidth="1.5" />
                            <rect x="50" y="50" width="30" height="3" rx="1.5" fill="#C4C2D4" />
                            <rect x="50" y="58" width="22" height="3" rx="1.5" fill="#C4C2D4" />
                            <rect x="50" y="66" width="26" height="3" rx="1.5" fill="#C4C2D4" />
                            {/* Magnifying glass */}
                            <circle cx="105" cy="88" r="32" fill="white" stroke="#9B99B5" strokeWidth="3" />
                            <circle cx="105" cy="88" r="24" fill="#F5F4FB" />
                            {/* X mark */}
                            <line x1="96" y1="79" x2="114" y2="97" stroke="#E8531D" strokeWidth="4" strokeLinecap="round" />
                            <line x1="114" y1="79" x2="96" y2="97" stroke="#E8531D" strokeWidth="4" strokeLinecap="round" />
                            {/* Handle */}
                            <line x1="129" y1="112" x2="148" y2="131" stroke="#9B99B5" strokeWidth="5" strokeLinecap="round" />
                            {/* Sparkles */}
                            <circle cx="38" cy="50" r="3" fill="#E8531D" opacity="0.6" />
                            <circle cx="148" cy="55" r="2" fill="#9B99B5" opacity="0.6" />
                            <circle cx="160" cy="90" r="3" fill="#E8531D" opacity="0.4" />
                        </svg>
                    </div>
                    <h2 className="text-base font-semibold text-text-primary mb-2">No assignments yet</h2>
                    <p className="text-sm text-text-secondary max-w-xs mb-8">
                        Create your first assignment to start collecting and grading student submissions.
                        You can set up rubrics, define marking criteria, and let AI assist with grading.
                    </p>
                    <Link
                        href="/assignments/create"
                        id="create-first-assignment-btn"
                        className="flex items-center gap-2 px-6 py-2.5 bg-cta-bg hover:bg-cta-hover text-white text-sm font-semibold rounded-full transition-colors"
                    >
                        <PlusIcon className="w-4 h-4" />
                        Create Your First Assignment
                    </Link>
                </div>
            </div>
        );
    }

    // ── Filled state ─────────────────────────────────────────────
    return (
        <div className="flex flex-col min-h-full relative">
            <TopHeader
                breadcrumb="Assignment"
                breadcrumbHref="/assignments"
            />

            <div className="px-6 py-5">
                {/* Page heading with green dot — matches Figma */}
                <div className="mb-4">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                        <h1 className="text-base font-semibold text-[#111827]">Assignments</h1>
                    </div>
                    <p className="text-xs text-[#6B7280] ml-4">Manage and create assignments for your classes.</p>
                </div>

                {/* Filter + Search bar — full width, matching Figma layout */}
                <div className="flex items-center gap-2 mb-5">
                    <button className="flex items-center gap-1.5 text-xs text-[#374151] border border-[#D1D5DB] rounded-md px-3 py-2 bg-white hover:bg-gray-50 whitespace-nowrap flex-shrink-0">
                        <FunnelIcon className="w-3.5 h-3.5 text-[#6B7280]" />
                        Filter by
                    </button>
                    <div className="relative flex-1">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search Assignment"
                            className="w-full pl-9 pr-3 py-2 text-sm border border-[#D1D5DB] rounded-md bg-white text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#E8531D] focus:border-[#E8531D]"
                        />
                    </div>
                </div>

                {/* Assignment cards grid — 2 cols on desktop, 1 col on mobile */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="bg-white border border-[#E5E7EB] rounded-xl p-5 h-24 animate-pulse" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <p className="text-sm text-[#9CA3AF] text-center py-12">No assignments match your search.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {filtered.map((assignment) => (
                            <AssignmentCard
                                key={assignment._id}
                                assignment={assignment}
                                onDelete={deleteAssignment}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Floating "+ Create Assignment" — always horizontally centered */}
            <div className="fixed bottom-20 lg:bottom-8 left-1/2 -translate-x-1/2 z-40">
                <Link
                    href="/assignments/create"
                    id="floating-create-btn"
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#1A1A2E] hover:bg-[#2a2a40] text-white text-sm font-semibold rounded-full shadow-lg transition-colors"
                >
                    <PlusIcon className="w-4 h-4" />
                     Create Assignment
                </Link>
            </div>
        </div>
    );
}
