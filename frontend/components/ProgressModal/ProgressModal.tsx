'use client';

import { useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface Props {
    isOpen: boolean;
    progress: number;
    message: string;
    onComplete?: () => void;
    onClose?: () => void;
    status?: 'generating' | 'done' | 'failed';
}

export default function ProgressModal({ isOpen, progress, message, status, onClose }: Props) {
    useEffect(() => {
        if (status === 'done' && onClose) {
            const timer = setTimeout(onClose, 1500);
            return () => clearTimeout(timer);
        }
    }, [status, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-8 flex flex-col items-center">
                {status === 'done' ? (
                    <>
                        <CheckCircleIcon className="w-16 h-16 text-green-500 mb-4" />
                        <h2 className="text-xl font-bold text-[#111827] mb-1">Question Paper Ready!</h2>
                        <p className="text-sm text-[#6B7280]">Redirecting you to the paper...</p>
                    </>
                ) : status === 'failed' ? (
                    <>
                        <XCircleIcon className="w-16 h-16 text-red-500 mb-4" />
                        <h2 className="text-xl font-bold text-[#111827] mb-1">Generation Failed</h2>
                        <p className="text-sm text-[#6B7280] mb-4">Something went wrong. Please try again.</p>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="px-5 py-2 bg-[#E8531D] text-white rounded-lg text-sm font-medium"
                            >
                                Close
                            </button>
                        )}
                    </>
                ) : (
                    <>
                        {/* Circular progress */}
                        <div className="relative w-24 h-24 mb-6">
                            {/* Track */}
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
                                <circle
                                    cx="48" cy="48" r="40"
                                    fill="none"
                                    stroke="#F3F4F6"
                                    strokeWidth="8"
                                />
                                <circle
                                    cx="48" cy="48" r="40"
                                    fill="none"
                                    stroke="#E8531D"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeDasharray={`${2 * Math.PI * 40}`}
                                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
                                    style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-base font-bold text-[#E8531D]">{progress}%</span>
                            </div>
                        </div>

                        <h2 className="text-lg font-bold text-[#111827] mb-1">Generating Question Paper</h2>
                        {/* <p className="text-sm text-[#6B7280] text-center">{message || 'Please wait...'}</p> */}

                        {/* Slim progress bar */}
                        <div className="w-full bg-[#F3F4F6] rounded-full h-1.5 mt-5">
                            <div
                                className="bg-[#E8531D] h-1.5 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
