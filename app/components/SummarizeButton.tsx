"use client";
import { useState } from "react";
import { Sparkles } from "lucide-react";

export default function SummarizeButton({
  noteId,
  onSummary,
  variant = "button",
}: {
  noteId: string;
  onSummary: (summary: string) => void;
  variant?: "button" | "menu";
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

  // button design check
  if (variant === "menu") {
    return (
      <button
        onClick={summarize}
        disabled={isSummarizing}
        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
      >
        <Sparkles className="h-4 w-4" />
        {isSummarizing ? "Summarizing..." : "Summarize note"}
      </button>
    );
  }

  return (
    <div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        onClick={summarize}
        disabled={isSummarizing}
        className="rounded-md px-4 py-2 bg-blue-500 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
      >
        {isSummarizing ? "Summarizing..." : "Summarize Note"}
      </button>
    </div>
  );
}
