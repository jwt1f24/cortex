"use client";
import { useState } from "react";
import { MoveLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Note } from "@/app/generated/prisma";
import Link from "next/link";
import SummarizeButton from "./SummarizeButton";
import DeleteNoteButton from "./DeleteNoteButton";
import ProfileMenu from "./ProfileMenu";

const TABS = [
  { key: "original", label: "Original" },
  { key: "summary", label: "Summary" },
] as const;

export default function NoteEditor({
  note,
  user,
}: {
  note: Note;
  user: { name?: string | null; email?: string | null };
}) {
  const router = useRouter();
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [summary, setSummary] = useState(note.summary ?? "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(note.version);
  const [view, setView] = useState<"summary" | "original">(
    note.source === "UPLOAD" && note.summary ? "summary" : "original",
  );

  const saveChanges = async () => {
    setError(null);
    setIsUpdating(true);

    try {
      // send patch request to api
      const res = await fetch(`/api/notes/${note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, summary, version }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Unable to save changes.");
      }

      const data = await res.json();
      setVersion(data.version);

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
    <>
      {/* toolbar */}
      <div className="sticky top-0 z-40 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-4 px-6 h-14">
          {/* return button */}
          <Link
            href="/home"
            className="shrink-0 mr-6 text-base text-gray-600 font-semibold hover:text-gray-800 cursor-pointer"
          >
            <div className="flex gap-2">
              <MoveLeft />
              Back
            </div>
          </Link>

          {/* title */}
          <div className="flex flex-1 min-w-0 items-center gap-4">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled"
              className="w-full max-w-md rounded-md border border-transparent px-2 py-1 text-base text-black font-semibold placeholder:text-gray-400 hover:border-gray-200 focus:border-gray-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gray-300 transition"
            />

            {/* description */}
            <span className="shrink-0 text-sm text-gray-600 truncate">
              {note.source === "UPLOAD" ? "Uploaded document" : "Note"} • Last
              Updated {note.updated_at.toLocaleDateString()}
            </span>
          </div>

          {/* action buttons */}
          <div className="flex shrink-0 items-center gap-4 pr-16">
            {/* summarize note */}
            <SummarizeButton
              noteId={note.id}
              onSummary={(s) => {
                setSummary(s);
                setView("summary");
              }}
            />

            {/* save note */}
            <button
              onClick={saveChanges}
              disabled={isUpdating}
              className="rounded-md bg-gray-700 px-4 py-2 text-base text-white font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
            >
              {isUpdating ? "Saving..." : "Save Changes"}
            </button>

            {/* delete note */}
            <DeleteNoteButton noteId={note.id} />
          </div>

          {/* user profile */}
          <ProfileMenu user={user} />
        </div>
      </div>

      <main className="w-full max-w-3xl mx-auto px-6 pt-4 pb-6">
        {error && (
          <p className="mb-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {/* tabs */}
        <div className="flex gap-1 border-b border-gray-300">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key)}
              className={`px-4 py-2 text-base font-semibold border-b-2 -mb-px transition cursor-pointer ${
                view === tab.key
                  ? "border-black text-black"
                  : "border-transparent text-gray-500 hover:text-black"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* panel */}
        {view === "original" ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mt-2 p-6 w-full min-h-[calc(100vh-10rem)] resize-none border border-gray-400 bg-white text-base leading-relaxed text-black focus:outline-none"
          />
        ) : (
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="No summary yet..."
            className="mt-2 p-6 w-full min-h-[calc(100vh-10rem)] resize-none border border-gray-400 bg-white text-base leading-relaxed text-black focus:outline-none placeholder:text-gray-400"
          />
        )}
      </main>
    </>
  );
}
