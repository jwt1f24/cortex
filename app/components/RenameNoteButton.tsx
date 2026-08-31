"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";

export default function RenameNoteButton({
  noteId,
  noteTitle,
  noteVersion,
}: {
  noteId: string;
  noteTitle: string;
  noteVersion: number;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState(noteTitle);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openModal = () => {
    setTitle(noteTitle);
    setError(null);
    setIsOpen(true);
  };

  const rename = async () => {
    setError(null);
    setIsSaving(true);

    try {
      // send patch request to api
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, version: noteVersion }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        if (res.status === 409) {
          throw new Error(
            data?.error ||
              "This note was changed elsewhere. Refresh and try again.",
          );
        }
        throw new Error(data?.error || "Unable to rename note.");
      }

      setIsOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error renaming note:", error);
      setError(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={openModal}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer text-left"
      >
        <Pencil className="h-4 w-4" /> Rename
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-black">Rename note</h2>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              className="mt-4 w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            {error && (
              <p className="mt-3 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={() => setIsOpen(false)}
                disabled={isSaving}
                className="rounded-md border border-gray-300 px-8 py-2 text-base font-semibold text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={rename}
                disabled={isSaving || !title.trim()}
                className="rounded-md bg-gray-900 px-8 py-2 text-base font-semibold text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
