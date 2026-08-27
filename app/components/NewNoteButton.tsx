"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NewNoteButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createNewNote = async () => {
    setError(null);
    setIsLoading(true);

    try {
      // send http post empty body request to api
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Unable to create note.");
      }

      // parse http response body from json to javascript arr/obj format
      const note = await res.json();

      // navigate to the created note's editor via server-generated id
      router.push(`/notes/${note.id}`);
    } catch (error) {
      console.error("Error creating note:", error);
      setError(
        error instanceof Error ? error.message : "Something went wrong.",
      );
      setIsLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <p className="absolute top-full right-0 mt-1 whitespace-nowrap text-xs text-red-600">
          {error}
        </p>
      )}
      <button
        onClick={createNewNote}
        disabled={isLoading}
        className="rounded-md px-4 py-2 bg-blue-500 text-base font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
      >
        <div className="flex gap-2">
          <Plus />
          {isLoading ? "Creating note..." : "New Note"}
        </div>
      </button>
    </div>
  );
}
