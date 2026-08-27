"use client";
import { useState } from "react";

export default function SummarizeButton({
  noteId,
  onSummary,
}: {
  noteId: string;
  onSummary: (summary: string) => void;
}) {
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const summarize = async () => {
    setError(null);
    setIsSummarizing(true);

    try {
      // send http patch request to api
      const res = await fetch(`/api/notes/${noteId}/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        throw new Error("Unable to summarize note.");
      }

      // generate summary
      const data = await res.json();
      onSummary(data.summary);
    } catch (error) {
      console.error("Error summarizing note:", error);
      setError(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div>
      {error && <p>{error}</p>}
      <button
        onClick={summarize}
        disabled={isSummarizing}
        className="rounded-md px-4 py-2 bg-blue-500 text-base font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
      >
        {isSummarizing ? "Summarizing..." : "Summarize Note"}
      </button>
    </div>
  );
}
