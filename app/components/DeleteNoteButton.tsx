"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteNoteButton({ noteId }: { noteId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteNote = async () => {
    const confirmed = window.confirm("Confirm deletion?");
    if (!confirmed) return;

    setError(null);
    setIsDeleting(true);

    try {
      // send delete request to api
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Unable to delete note.");
      }

      // navigate to home & refresh list
      router.push(`/home`);
      router.refresh();
    } catch (error) {
      console.error("Error deleting note:", error);
      setError(
        error instanceof Error ? error.message : "Something went wrong.",
      );
      setIsDeleting(false);
    }
  };

  return (
    <div>
      {error && <p>{error}</p>}
      <button onClick={deleteNote} disabled={isDeleting}>
        {isDeleting ? "Deleting note..." : "Delete Note"}
      </button>
    </div>
  );
}
