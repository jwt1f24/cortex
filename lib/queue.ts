import { Client } from "@upstash/qstash";

const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
  baseUrl: process.env.QSTASH_URL,
});

export async function queueEmbedding(noteId: string) {
    // inline execution
    if (process.env.NODE_ENV !== "production") {
        const { embedNoteById } = await import("@/lib/embeddings");

        await embedNoteById(noteId);
        return;
    }

    await qstash.publishJSON({
        url: `${process.env.APP_URL}/api/jobs/embed`,
        body: { noteId },
        headers: {
            "x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET!,
        },
    });
}