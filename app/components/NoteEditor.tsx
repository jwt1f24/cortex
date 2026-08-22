"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Note } from "@/app/generated/prisma";
import DeleteNoteButton from "./DeleteNoteButton";

export default function NoteEditor({ note }: { note: Note }) {
  const router = useRouter();
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveChanges = async () => {
    setError(null);
    setIsUpdating(true);

    try {
      // patch update to api
      const res = await fetch(`/api/notes/${note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
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
    <div>
      {/* editor fields */}
      <input value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea value={content} onChange={(e) => setContent(e.target.value)} />

      {/* save button */}
      {error && <p>{error}</p>}
      <button onClick={saveChanges} disabled={isUpdating}>
        {isUpdating ? "Saving..." : "Save Changes"}
      </button>

      {/* delete button */}
      <DeleteNoteButton noteId={note.id} />
    </div>
  );
}
