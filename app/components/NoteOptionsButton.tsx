"use client";
import { useState, useRef, useEffect } from "react";
import { ExternalLink } from "lucide-react";
import DeleteNoteButton from "./DeleteNoteButton";
import RenameNoteButton from "./RenameNoteButton";

export default function NoteOptionsButton({
  noteId,
  noteTitle,
}: {
  noteId: string;
  noteTitle: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // toggle popup visibility
  const loadOptions = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const estimatedMenuHeight = 150;
    }

    setIsOpen(!isOpen);
  };

  // hide popup when clicking outside
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

  // button design
  const itemClass =
    "flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer text-left";

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
        <div className="absolute right-0 w-48 border border-gray-300 bg-white shadow-lg py-1 z-50">
          {/* edit note title */}
          <RenameNoteButton noteId={noteId} noteTitle={noteTitle} />

          {/* open in new tab */}
          <a
            href={`/notes/${noteId}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            className={itemClass}
          >
            <ExternalLink className="w-4 h-4" />
            Open in new tab
          </a>

          {/* delete note */}
          <DeleteNoteButton noteId={noteId} variant="menu" />
        </div>
      )}
    </div>
  );
}
