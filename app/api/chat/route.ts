import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ai } from "@/lib/gemini";
import { embed } from "@/lib/embeddings";
import { aiLimiter } from "@/lib/ratelimit";

const MAX_DISTANCE = 0.45;
const MAX_RELATED = 3;
const MAX_CHARS_PER_NOTE = 4000;

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { success } = await aiLimiter.limit(session.user.id);
    if (!success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later." },
        { status: 429 },
      );
    }

    const body = await req.json().catch(() => null);
    if (!body?.question?.trim() || !body?.noteId) {
      return NextResponse.json(
        { error: "Question and noteId are required." },
        { status: 400 },
      );
    }

    const question = body.question.trim();
    const noteId = body.noteId as string;

    // the note the user is looking at — always in context
    const currentNote = await prisma.note.findUnique({ where: { id: noteId } });
    if (!currentNote)
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    if (currentNote.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // retrieve related notes
    let related: { id: string; title: string; content: string }[] = [];
    try {
      const vector = await embed(question);
      const literal = `[${vector.join(",")}]`;

      related = await prisma.$queryRaw`
        SELECT n.id, n.title, n.content
        FROM notes n
        JOIN note_embeddings e ON e."noteId" = n.id
        WHERE n."userId" = ${session.user.id}
          AND n.id != ${noteId}
          AND e.embedding <=> ${literal}::vector < ${MAX_DISTANCE}
        ORDER BY e.embedding <=> ${literal}::vector
        LIMIT ${MAX_RELATED}
      `;
    } catch (retrievalError) {
      console.error(
        "Retrieval failed, answering from current note only:",
        retrievalError,
      );
    }

    // build context
    const sources = [currentNote, ...related];
    const context = sources
      .map(
        (n, i) => `[${i + 1}] ${n.title}\n${n.content.slice(0, MAX_CHARS_PER_NOTE)}`,
      )
      .join("\n\n---\n\n");

    const summaryBlock = currentNote.summary?.trim()
      ? `CURRENT SUMMARY OF NOTE [1]:\n${currentNote.summary}`
      : `NOTE [1] HAS NO SUMMARY YET.`;

    const history = Array.isArray(body.history) ? body.history.slice(-6) : [];
    const historyBlock = history.length
      ? `CONVERSATION SO FAR:\n${history
          .map(
            (m: { role: string; text: string }) =>
              `${m.role === "user" ? "User" : "Assistant"}: ${m.text}`,
          )
          .join("\n")}\n`
      : "";

    const prompt = `You are an assistant working with the user's own notes.

Decide which of two things the user is asking for, and reply with JSON only.

If they are asking a QUESTION about the notes:
{"action":"answer","answer":"..."}
- Answer using ONLY the notes below. Do not use outside knowledge.
- If the notes lack the information, say so plainly. Do not guess.
- Cite notes by number, like [1] or [2]. Be concise.

If they are asking you to WRITE, REWRITE, FIX, IMPROVE, SHORTEN or EXPAND the summary of note [1]:
{"action":"update_summary","summary":"...","message":"..."}
- "summary" is the full replacement text for note [1]'s summary, nothing else.
- "message" is one short sentence telling the user what you changed.
- Preserve important specifics verbatim — commands, function names, syntax, numbers, dates.
- Base it only on note [1]'s content.

Anything that is not clearly a request to change the summary is an "answer".

NOTES:
${context}

${summaryBlock}
${historyBlock}

USER: ${question}`;

    const result = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    const raw = result.text;
    if (!raw) {
      return NextResponse.json(
        { error: "Could not generate an answer." },
        { status: 502 },
      );
    }

    const sourceList = sources.map((n, i) => ({
      number: i + 1,
      id: n.id,
      title: n.title,
    }));

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // model ignored the format — treat it as a plain answer
      return NextResponse.json({
        action: "answer",
        answer: raw,
        sources: sourceList,
      });
    }

    if (parsed.action === "update_summary" && typeof parsed.summary === "string") {
      return NextResponse.json({
        action: "update_summary",
        summary: parsed.summary,
        answer:
          parsed.message ||
          "I've updated the summary — review it in the Summary tab.",
        sources: sourceList,
      });
    }

    return NextResponse.json({
      action: "answer",
      answer: typeof parsed.answer === "string" ? parsed.answer : raw,
      sources: sourceList,
    });
  } catch (error) {
    console.error("POST /api/chat error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}