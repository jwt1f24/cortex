import { prisma } from "@/lib/prisma";
import { ai } from "@/lib/gemini";

export async function embed(text: string): Promise<number[]> {
    const result = await ai.models.embedContent({
        model: "gemini-embedding-2",
        contents: text,
        config: { outputDimensionality: 768 },
    })
    // check sdk response shape
    const values = result.embeddings?.[0]?.values
    if (!values) throw new Error("Failed to generate embedding")
    return values
}

export async function saveEmbedding(noteId: string, text: string) {
    const vector = await embed(text)
    const literal = `[${vector.join(",")}]`

    await prisma.$executeRaw`
        INSERT INTO note_embeddings (id, "noteId", embedding, created_at)
        VALUES (gen_random_uuid(), ${noteId}, ${literal}::vector, now())
        ON CONFLICT ("noteId")
        DO UPDATE SET embedding = ${literal}::vector, created_at = now()
    `
}

export async function embedNoteById(noteId: string) {
    const note = await prisma.note.findUnique({ where: { id: noteId } });
    if (!note || !note.content.trim()) return;

    await saveEmbedding(noteId, `${note.title}\n\n${note.content}`.slice(0, 30000));
}
