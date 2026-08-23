import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ai } from "@/lib/gemini";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        // auth check
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error:"Unauthorized" }, { status: 401 });

        // fetch note
        const {id} = await params
        const note = await prisma.note.findUnique({ where: {id} });

        // note edge cases
        if (!note) return NextResponse.json({ error: "Note does not exist" }, { status: 404 });
        if (note.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        if (!note.content.trim()) return NextResponse.json({ error:"Nothing to summarize" }, { status: 400 });

        // gemini api call
        const truncatedContent = note.content.trim().slice(0, 10000);
        const prompt = `Summarize the following note in concise bullet points starting with "• ", with a short title (max 10 words) above for context. Return only the summary, no preamble.\n\nContent:\n${truncatedContent}`;
        const result = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: prompt,
        });

        // summarize note content
        const summary = result.text;
        if (!summary) return NextResponse.json({ error: "Could not generate summary" }, { status: 502 });

        const updatedNote = await prisma.note.update({
            where: {id},
            data: { summary: summary },
        });
        
        return NextResponse.json(updatedNote);
    } catch(error) {
        console.error("POST /api/notes/[id]/summarize error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
