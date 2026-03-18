'use client';

import Link from 'next/link';
import { BellIcon, ChevronDownIcon, Squares2X2Icon, ArrowLeftIcon } from '@heroicons/react/24/outline';

interface TopHeaderProps {
    /** The breadcrumb link label (e.g. "Assignment") */
    breadcrumb?: string;
    breadcrumbHref?: string;
    /** Whether to show the back arrow before the breadcrumb */
    showBack?: boolean;
}

export default function TopHeader({
    breadcrumb = 'Assignment',
    breadcrumbHref = '/assignments',
    showBack = false,
}: TopHeaderProps) {
    return (
        <header className="bg-white border-b border-[#E9ECEF] px-4 sm:px-6 flex items-center justify-between h-12 sticky top-0 z-30">
            {/* Left: optional back arrow + grid icon + breadcrumb */}
            <div className="flex items-center gap-2 text-[#9CA3AF] text-sm">
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

            {/* Right: Bell + John Doe */}
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
            </div>
        </header>
    );
}
