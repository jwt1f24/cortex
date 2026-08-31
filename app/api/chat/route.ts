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

    const prompt = `You are an assistant helping the user with ONE specific note they have open — note [1]. You do not have access to, and must not reference, any of the user's other notes.

Decide which of two things the user is asking for, and reply with JSON only.

If they are asking a QUESTION:
{"action":"answer","answer":"..."}
- Answer using note [1]'s content as your primary source.
- You may also use your general knowledge, but ONLY to help with the note's topic — for example, explaining a related concept, giving background, comparing it to something similar, or answering a natural follow-up question about the same subject. (e.g. if the note is about git commands, you can explain why version control matters; if it's about apples, you can compare it to other fruits.)
- Do NOT answer questions that are unrelated to the note's topic. If the user asks something with no reasonable connection to what's in the note, say plainly that it's outside what this note covers, and don't answer it.
- Never reference or imply the existence of the user's other notes.
- Cite the note as [1] when using its content directly. Be concise.

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

    let result;
    try {
      result = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" },
      });
    } catch (aiError: unknown) {
      console.error("Gemini call failed:", aiError);

      const status =
        aiError && typeof aiError === "object" && "status" in aiError
          ? (aiError as { status?: number }).status
          : undefined;

      const errorCode =
        aiError &&
        typeof aiError === "object" &&
        "error" in aiError &&
        aiError.error &&
        typeof aiError.error === "object" &&
        "code" in aiError.error
          ? (aiError.error as { code?: number }).code
          : undefined;

      if (status === 429 || errorCode === 429) {
        return NextResponse.json(
          { error: "AI quota exceeded for today. Please try again later." },
          { status: 429 },
        );
      }

      return NextResponse.json(
        { error: "AI request failed. Please try again." },
        { status: 502 },
      );
    }

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