import { NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { embedNoteById } from "@/lib/embeddings";

async function handler(req: Request) {
  try {
    const { noteId } = await req.json();
    if (!noteId) return NextResponse.json({ error: "noteId required" }, { status: 400 });

    await embedNoteById(noteId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/jobs/embed error:", error);
    return NextResponse.json({ error: "Embedding failed" }, { status: 500 });
  }
}

export const POST = verifySignatureAppRouter(handler);