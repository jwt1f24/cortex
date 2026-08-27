"use client";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DeleteNoteButton({
  noteId,
  variant = "button",
}: {
  noteId: string;
  variant?: "button" | "menu";
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteNote = async () => {
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
    <>
      {variant === "menu" ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer text-left"
        >
          <Trash2 className="h-4 w-4" /> Delete
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="rounded-md px-4 py-2 bg-red-500 text-base font-semibold text-white hover:bg-red-600 transition cursor-pointer"
        >
          Delete Note
        </button>
      )}

      {/* confirmation modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-black">Delete note?</h2>
            <p className="mt-2 text-base text-gray-600">
              This cannot be undone. The note and its summary will be
              permanently removed.
            </p>

            {error && (
              <p className="mt-3 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setIsOpen(false)}
                disabled={isDeleting}
                className="rounded-md border border-gray-300 px-8 py-2 text-base font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={deleteNote}
                disabled={isDeleting}
                className="rounded-md px-8 py-2 bg-red-500 text-base font-semibold text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
