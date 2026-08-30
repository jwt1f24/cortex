"use client";
import { useState, useEffect } from "react";
import { MoveLeft, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Note } from "@/app/generated/prisma";
import EditorOptionsButton from "./EditorOptionsButton";
import ProfileMenu from "./ProfileMenu";
import ChatPanel, { type Message } from "./ChatPanel";

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
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(note.version);
  const [messages, setMessages] = useState<Message[]>([]);
  const [view, setView] = useState<"summary" | "original">(
    note.source === "UPLOAD" && note.summary ? "summary" : "original",
  );
  const isDirty =
    title !== note.title ||
    content !== note.content ||
    summary !== (note.summary ?? "");

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
      return true;
    } catch (error) {
      console.error("Error updating note:", error);
      setError(
        error instanceof Error ? error.message : "Something went wrong.",
      );
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  // hotkey to save note
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (isDirty && !isUpdating) saveChanges();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // save confirmation
  const saveAndLeave = async () => {
    const ok = await saveChanges();
    if (ok) router.push("/home");
  };

  return (
    <>
      {/* toolbar */}
      <div className="sticky top-0 z-40 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-4 px-6 h-14">
          {/* return button */}
          <button
            onClick={() =>
              isDirty ? setShowLeaveConfirm(true) : router.push("/home")
            }
            className="shrink-0 mr-6 text-base text-gray-600 font-semibold hover:text-gray-800 cursor-pointer"
          >
            <div className="flex gap-2">
              <MoveLeft />
              Back
            </div>
          </button>

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
              Updated {note.updated_at.toLocaleDateString()} •{" "}
              <span
                className={
                  isDirty ? "text-amber-600 font-semibold" : "text-gray-600"
                }
              >
                {isDirty ? "Unsaved changes" : "Saved"}
              </span>
            </span>
          </div>

          {/* action buttons */}
          <div className="flex shrink-0 items-center gap-4 pr-8">
            <button
              onClick={saveChanges}
              disabled={isUpdating}
              className="rounded-md bg-gray-700 px-4 py-2 text-sm text-white font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
            >
              {isUpdating ? "Saving..." : "Save Changes"}
            </button>

            <EditorOptionsButton
              noteId={note.id}
              onSummary={(s) => {
                setSummary(s);
                setView("summary");
              }}
            />
          </div>

          {/* user profile */}
          <ProfileMenu user={user} />
        </div>
      </div>

      {/* editor */}
      <div className="flex">
        <main
          className={
            isChatOpen
              ? "flex-1 min-w-0 px-6 pt-4 pb-8"
              : "w-full max-w-5xl mx-auto px-6 pt-4 pb-8"
          }
        >
          {error && (
            <p className="mb-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          {/* tabs */}
          <div className="flex items-end justify-between border-b border-gray-300">
            <div className="flex gap-1">
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

            {/* chatbot toggle */}
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`mb-1.5 flex items-center gap-2 rounded-md px-3 py-1.5 text-base font-semibold text-white transition cursor-pointer ${
                isChatOpen
                  ? "bg-gray-700 hover:bg-gray-800"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isChatOpen ? (
                <>
                  <X className="h-5 w-5" />
                  Collapse AI
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Ask AI
                </>
              )}
            </button>
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

        {/* chatbot panel */}
        {isChatOpen && (
          <ChatPanel
            noteId={note.id}
            onClose={() => setIsChatOpen(false)}
            onSummary={(s) => {
              setSummary(s);
              setView("summary");
            }}
            messages={messages}
            setMessages={setMessages}
          />
        )}
      </div>

      {/* save confirmation modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-black">
              Unsaved changes
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              You have unsaved changes to this note. What would you like to do?
            </p>

            {error && (
              <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                disabled={isUpdating}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 font-semibold hover:bg-gray-100 disabled:opacity-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => router.push("/home")}
                disabled={isUpdating}
                className="rounded-md bg-red-500 px-4 py-2 text-sm text-white font-semibold hover:bg-red-600 disabled:opacity-50 transition cursor-pointer"
              >
                Don&apos;t save
              </button>
              <button
                onClick={saveAndLeave}
                disabled={isUpdating}
                className="rounded-md bg-gray-700 px-4 py-2 text-sm text-white font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
              >
                {isUpdating ? "Saving..." : "Save & Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
