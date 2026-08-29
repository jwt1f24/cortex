import { Client } from "@upstash/qstash";

const qstash = new Client({ token: process.env.QSTASH_TOKEN! });

export async function queueEmbedding(noteId: string) {
    // inline execution
    if (process.env.NODE_ENV !== "production") {
    const { embedNoteById } = await import("@/lib/embeddings");
    await embedNoteById(noteId);
    return;
    }

    await qstash.publishJSON({
    url: `https://${process.env.VERCEL_URL}/api/jobs/embed`,
    body: { noteId },
    });
}