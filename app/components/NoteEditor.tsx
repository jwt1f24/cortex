"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Note } from "@/app/generated/prisma";
import SummarizeButton from "./SummarizeButton";
import DeleteNoteButton from "./DeleteNoteButton";

export default function NoteEditor({ note }: { note: Note }) {
  const router = useRouter();
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [summary, setSummary] = useState(note.summary ?? "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveChanges = async () => {
    setError(null);
    setIsUpdating(true);

    try {
      // send patch request to api
      const res = await fetch(`/api/notes/${note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, summary }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Unable to save changes.");
      }

      // refresh to dave updated data
      router.refresh();
    } catch (error) {
      console.error("Error updating note:", error);
      setError(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex gap-10">
      {/* editor fields */}
      <input value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="p-2 w-100 h-100"
      />
      <textarea
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        className="p-2 w-100 h-100"
      />

      {/* summarize note button */}
      <SummarizeButton noteId={note.id} onSummary={setSummary} />

      {/* save button */}
      {error && <p>{error}</p>}
      <button
        onClick={saveChanges}
        disabled={isUpdating}
        className="cursor-pointer"
      >
        {isUpdating ? "Saving..." : "Save Changes"}
      </button>

      {/* delete button */}
      <DeleteNoteButton noteId={note.id} />
    </div>
  );
}
