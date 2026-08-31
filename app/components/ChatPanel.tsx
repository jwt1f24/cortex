"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { X, Send } from "lucide-react";

export type Source = { number: number; id: string; title: string };
export type Message = {
  role: "user" | "assistant";
  text: string;
  sources?: Source[];
};

export default function ChatPanel({
  noteId,
  onClose,
  onSummary,
  messages,
  setMessages,
}: {
  noteId: string;
  onClose: () => void;
  onSummary: (summary: string) => void;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}) {
  const [question, setQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // keep the newest message in view
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAsking]);

  const ask = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || isAsking) return;

    setMessages((m) => [...m, { role: "user", text: trimmed }]);
    setQuestion("");
    setIsAsking(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noteId,
          question: trimmed,
          history: messages.slice(-6),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Something went wrong.");
      }

      const data = await res.json();
      setMessages((m) => [
        ...m,
        { role: "assistant", text: data.answer, sources: data.sources },
      ]);

      if (data.action === "update_summary" && data.summary) {
        onSummary(data.summary);
      }
    } catch (error) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text:
            error instanceof Error ? error.message : "Something went wrong.",
        },
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <aside className="w-full lg:w-96 lg:shrink-0 flex flex-col border-t lg:border-t-0 lg:border-1 border-gray-200 bg-white h-[100vh] lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)]">
      {/* header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Ask AI</h2>
          <p className="text-sm text-gray-500">
            Answers from this note and related ones. Detailed prompts may take
            longer response times.
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="h-8 w-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-sm text-gray-400">
            Ask a question about this note, or anything else you&apos;ve
            written.
          </p>
        )}

        {messages.map((m, i) => (
          <div key={i}>
            {m.role === "user" ? (
              <div className="ml-auto w-fit max-w-[85%] rounded-lg bg-gray-900 px-3 py-2 text-sm text-white">
                {m.text}
              </div>
            ) : (
              <div className="max-w-[95%]">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
                  {m.text}
                </p>

                {m.sources && m.sources.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-medium text-gray-400">Sources</p>
                    {m.sources.map((s) => (
                      <Link
                        key={s.id}
                        href={`/notes/${s.id}`}
                        className="block truncate text-xs text-blue-600 hover:underline"
                      >
                        [{s.number}] {s.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {isAsking && <p className="text-sm text-gray-400">Thinking...</p>}
        <div ref={bottomRef} />
      </div>

      {/* input */}
      <form onSubmit={ask} className="border-t border-gray-200 p-3">
        <div className="flex gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 min-w-0 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!question.trim() || isAsking}
            aria-label="Send"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gray-800 text-white hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </aside>
  );
}
