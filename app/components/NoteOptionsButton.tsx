"use client";
import { useState } from "react";
import DeleteNoteButton from "./DeleteNoteButton";

export default function NoteOptionsButton({ noteId }: { noteId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  // toggle popup visibility
  const loadOptions = () => setIsOpen(!isOpen);

  return (
    <div>
      <button onClick={loadOptions}>...</button>
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
