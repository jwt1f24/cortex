"use client";
import { useState, useRef, useEffect } from "react";
import SummarizeButton from "./SummarizeButton";
import DeleteNoteButton from "./DeleteNoteButton";

export default function EditorOptionsButton({
  noteId,
  onSummary,
}: {
  noteId: string;
  onSummary: (summary: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  // toggle popup visibility
  const loadOptions = () => setIsOpen(!isOpen);

  // hide popup when clicking outside
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={loadOptions}
        aria-label="Note options"
        className="h-9 w-9 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition cursor-pointer"
      >
        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <circle cx="4" cy="10" r="2" />
          <circle cx="10" cy="10" r="2" />
          <circle cx="16" cy="10" r="2" />
        </svg>
      </button>

      {/* dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 border border-gray-300 bg-white shadow-lg py-1 z-50">
          {/* summarize note */}
          <SummarizeButton
            noteId={noteId}
            onSummary={onSummary}
            variant="menu"
          />

          {/* delete note */}
          <DeleteNoteButton noteId={noteId} variant="menu" />
        </div>
      )}
    </div>
  );
}
