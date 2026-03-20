'use client';

import Link from 'next/link';
import { BellIcon, ChevronDownIcon, Squares2X2Icon, ArrowLeftIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { useUIStore } from '@/store/uiStore';

interface TopHeaderProps {
    breadcrumb?: string;
    breadcrumbHref?: string;
    showBack?: boolean;
}

export default function TopHeader({
    breadcrumb = 'Assignment',
    breadcrumbHref = '/assignments',
    showBack = false,
}: TopHeaderProps) {
    const { openSidebar } = useUIStore();

    return (
        <header className="bg-white rounded-2xl mx-3  px-4 sm:px-5 flex items-center justify-between h-12 sticky top-2 z-30 shadow-sm">

            {/* ── Mobile left: VedaAI logo + name ── */}
            <div className="flex lg:hidden items-center gap-2">
                <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
                    <path d="M14 2L4 7v7c0 5.25 4.27 10.16 10 11.37C19.73 24.16 24 19.25 24 14V7L14 2z" fill="#E8531D" />
                    <path d="M10 14l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="font-bold text-[#111827] text-sm">VedaAI</span>
            </div>

            {/* ── Desktop left: back arrow + grid icon + breadcrumb ── */}
            <div className="hidden lg:flex items-center gap-2 text-[#9CA3AF] text-sm">
                {showBack && (
                    <Link href={breadcrumbHref} className="p-1 hover:text-[#6B7280] transition-colors">
                        <ArrowLeftIcon className="w-4 h-4" />
                    </Link>
                )}
                <div className="flex items-center gap-1.5">
                    <Squares2X2Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <Link href={breadcrumbHref} className="hover:text-[#6B7280] transition-colors font-medium">
                        {breadcrumb}
                    </Link>
                </div>
            </div>

            {/* ── Right: Bell + Avatar + Hamburger (mobile only) ── */}
            <div className="flex items-center gap-2">
                <button className="relative p-2 rounded-full hover:bg-gray-100">
                    <BellIcon className="w-5 h-5 text-[#6B7280]" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#E8531D] rounded-full border-2 border-white" />
                </button>
                <button className="flex items-center gap-2 hover:bg-gray-100 rounded-lg px-2 py-1.5 transition-colors">
                    <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#E8531D] font-bold text-xs">J</span>
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-[#111827]">John Doe</span>
                    <ChevronDownIcon className="w-4 h-4 text-[#9CA3AF] hidden sm:block" />
                </button>

                {/* Hamburger — mobile only, after profile */}
                <button
                    onClick={openSidebar}
                    className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-[#6B7280]"
                    aria-label="Open menu"
                >
                    <Bars3Icon className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
}
