"use client";

import { useState, useRef, useEffect } from "react";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { Assignment } from "@/lib/types";

interface AssignmentCardProps {
  assignment: Assignment;
  onDelete: (id: string) => void;
}

function formatDate(d: string | Date) {
  return new Date(d)
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    .replace(/\//g, "-");
}

export default function AssignmentCard({
  assignment,
  onDelete,
}: AssignmentCardProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div
      className="bg-white border border-[#E5E7EB] rounded-xl p-5 cursor-pointer hover:shadow-md transition-shadow relative"
      onClick={() => router.push(`/assignments/${assignment._id}`)}
    >
      {/* Title row */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <h3 className="text-[15px] font-semibold text-[#111827] leading-snug line-clamp-2">
          {assignment.title}
        </h3>

        {/* 3-dot menu */}
        <div
          className="relative flex-shrink-0"
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-[#9CA3AF]"
          >
            <EllipsisVerticalIcon className="w-4 h-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 z-50 w-36 bg-white rounded-lg shadow-lg border border-[#E5E7EB] py-1">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  router.push(`/assignments/${assignment._id}`);
                }}
                className="w-full text-left px-3 py-2 text-sm text-[#111827] hover:bg-gray-50"
              >
                View Assignment
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(assignment._id);
                }}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Dates row — matches Figma: bold date values */}
      <div className="flex items-center gap-4 text-xs text-[#6B7280]">
        <span>
          <span className="font-semibold text-[#111827]">Assigned on: </span>
          {formatDate(assignment.createdAt)}
        </span>
        <span>
          <span className="font-semibold text-[#111827]">Due: </span>
          {formatDate(assignment.dueDate)}
        </span>
      </div>
    </div>
  );
}
