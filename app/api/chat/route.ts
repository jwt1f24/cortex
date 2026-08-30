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
      return NextResponse.json({ error: "Rate limit exceeded. Try again later." }, { status: 429 });
    }

    const body = await req.json().catch(() => null);
    if (!body?.question?.trim() || !body?.noteId) {
      return NextResponse.json({ error: "Question and noteId are required." }, { status: 400 });
    }

    const question = body.question.trim();
    const noteId = body.noteId as string;

    // the note the user is looking at — always in context
    const currentNote = await prisma.note.findUnique({ where: { id: noteId } });
    if (!currentNote) return NextResponse.json({ error: "Note not found" }, { status: 404 });
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
      console.error("Retrieval failed, answering from current note only:", retrievalError);
    }

    // build context
    const sources = [currentNote, ...related];
    const context = sources
      .map((n, i) => `[${i + 1}] ${n.title}\n${n.content.slice(0, MAX_CHARS_PER_NOTE)}`)
      .join("\n\n---\n\n");

    const prompt = `You are an assistant that answers questions using only the user's own notes.

Rules:
- Answer using ONLY the notes provided below. Do not use outside knowledge.
- If the notes do not contain enough information, say so plainly. Do not guess.
- Cite the notes you used by their number, like [1] or [2].
- Be concise.

NOTES:
${context}

QUESTION: ${question}`;

    const result = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    const answer = result.text;
    if (!answer) {
      return NextResponse.json({ error: "Could not generate an answer." }, { status: 502 });
    }

    return NextResponse.json({
      answer,
      sources: sources.map((n, i) => ({ number: i + 1, id: n.id, title: n.title })),
    });
  } catch (error) {
    console.error("POST /api/chat error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}