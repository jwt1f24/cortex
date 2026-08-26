"use client";
import { useState } from "react";
import DeleteNoteButton from "./DeleteNoteButton";

export default function NoteOptionsButton({ noteId }: { noteId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  // toggle popup visibility
  const loadOptions = () => setIsOpen(!isOpen);

  return (
    <div>
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
        <div>
          <DeleteNoteButton noteId={noteId} />
          {/* rename title btn (later) */}
          {/* open in new tab (later) */}
        </div>
      )}
    </div>
  );
}
