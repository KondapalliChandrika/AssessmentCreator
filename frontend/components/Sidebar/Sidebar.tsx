'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAssignmentStore } from '@/store/assignmentStore';
import {
    HomeIcon,
    UsersIcon,
    ClipboardDocumentListIcon,
    SparklesIcon,
    BookOpenIcon,
    Cog6ToothIcon,
    PlusIcon,
} from '@heroicons/react/24/outline';

const navItems = [
    { label: 'Home', href: '/', icon: HomeIcon },
    { label: 'My Groups', href: '/groups', icon: UsersIcon },
    { label: 'Assignments', href: '/assignments', icon: ClipboardDocumentListIcon, showBadge: true },
    { label: "AI Teacher's Toolkit", href: '/toolkit', icon: SparklesIcon },
    { label: 'My Library', href: '/library', icon: BookOpenIcon },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { assignments } = useAssignmentStore();
    const assignmentCount = assignments.length;

    const isActive = (href: string) => {
        if (href === '/assignments') return pathname.startsWith('/assignment');
        return pathname === href;
    };

    return (
        <>
            {/* ── Desktop sidebar ── */}
            <aside className="hidden lg:flex w-[220px] min-h-screen bg-white border-r border-[#E5E7EB] flex-col fixed left-0 top-0 z-40">
                {/* Logo + Create button */}
                <div className="px-4 pt-5 pb-4 border-b border-[#E5E7EB]">
                    {/* Logo */}
                    <div className="flex items-center gap-2 mb-4">
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                            <path d="M14 2L4 7v7c0 5.25 4.27 10.16 10 11.37C19.73 24.16 24 19.25 24 14V7L14 2z" fill="#E8531D" />
                            <path d="M10 14l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="font-bold text-[#111827] text-[15px] tracking-tight">VedaAI</span>
                    </div>

                    {/* Create Assignment — dark pill with orange border */}
                    <Link
                        href="/assignments/create"
                        id="sidebar-create-btn"
                        className="flex items-center justify-center gap-1.5 w-full py-2 px-3 bg-[#1A1A2E] border-2 border-[#E8531D] hover:bg-[#0D0D1F] text-white text-sm font-semibold rounded-full transition-colors"
                    >
                        <PlusIcon className="w-4 h-4 text-[#E8531D]" />
                        Create Assignment
                    </Link>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 overflow-y-auto">
                    <ul className="space-y-0.5">
                        {navItems.map(({ label, href, icon: Icon, showBadge }) => {
                            const active = isActive(href);
                            return (
                                <li key={href}>
                                    <Link
                                        href={href}
                                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active
                                            ? 'bg-[#F3F0FF] text-[#E8531D]'
                                            : 'text-[#6B7280] hover:bg-gray-100 hover:text-[#111827]'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4 flex-shrink-0" />
                                        <span className="flex-1 truncate">{label}</span>
                                        {showBadge && assignmentCount > 0 && (
                                            <span className="text-[10px] font-bold bg-[#E8531D] text-white rounded-full px-1.5 py-0.5 leading-none min-w-[18px] text-center">
                                                {assignmentCount}
                                            </span>
                                        )}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Footer */}
                <div className="px-3 pb-4 border-t border-[#E5E7EB] pt-3 space-y-1">
                    <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer">
                        <Cog6ToothIcon className="w-4 h-4 text-[#6B7280]" />
                        <span className="text-sm text-[#6B7280] font-medium">Settings</span>
                    </div>
                    <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-gray-150">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-[#E8531D] font-bold text-sm">D</span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#111827] truncate">Delhi Public School</p>
                            <p className="text-[11px] text-[#9CA3AF] truncate">Bokaro Steel City</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* ── Mobile top bar ── */}
            <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#E5E7EB] px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
                        <path d="M14 2L4 7v7c0 5.25 4.27 10.16 10 11.37C19.73 24.16 24 19.25 24 14V7L14 2z" fill="#E8531D" />
                        <path d="M10 14l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="font-bold text-[#111827] text-sm">VedaAI</span>
                </div>
                <Link
                    href="/assignments/create"
                    className="flex items-center gap-1 px-3 py-1.5 border-2 border-[#E8531D] rounded-full text-xs font-semibold text-[#1A1A2E] hover:bg-orange-50"
                >
                    <PlusIcon className="w-3 h-3 text-[#E8531D]" />
                    Create
                </Link>
            </header>

            {/* ── Mobile bottom nav ── */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E5E7EB] safe-bottom">
                <div className="flex items-center justify-around px-2 py-1">
                    {[
                        { label: 'Home', href: '/', icon: HomeIcon },
                        { label: 'My Groups', href: '/groups', icon: UsersIcon },
                        { label: 'Assignments', href: '/assignments', icon: ClipboardDocumentListIcon },
                        { label: 'Library', href: '/library', icon: BookOpenIcon },
                    ].map(({ label, href, icon: Icon }) => {
                        const active = isActive(href);
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`flex flex-col items-center gap-0.5 py-1.5 px-4 rounded-lg ${active ? 'text-[#E8531D]' : 'text-[#6B7280]'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="text-[10px] font-medium">{label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
