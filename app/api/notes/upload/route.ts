import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ai } from "@/lib/gemini";
import { extractText } from "@/lib/extractText";
import { saveEmbedding } from "@/lib/embeddings";
import { aiLimiter } from "@/lib/ratelimit";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
export const ALLOWED_TYPES: string[] = [
    "text/plain",
    "text/markdown",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// upload note
export async function POST(req: Request) {
    try {
        // auth check
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            
        // rate limiter
        const { success, limit, remaining, reset } = await aiLimiter.limit(session.user.id);
        if (!success) {
            return NextResponse.json(
                { error: "Rate limit exceeded. Try again later." },
                {
                    status: 429,
                    headers: {
                        "X-RateLimit-Limit": limit.toString(),
                        "X-RateLimit-Remaining": remaining.toString(),
                        "X-RateLimit-Reset": reset.toString(),
                    },
                }
            );
        }

        // parse form data body
        const formData = await req.formData();
        const file = formData.get("file") as File | null
        
        // file edge cases
        if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
        if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
        if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "File exceeds 5MB size limit" }, { status: 400 });

        // extract content
        const content = (await extractText(file)).trim();
        if (!content) {
            const msg = file.type === "application/pdf"
            ? "No text found"
            : "File is empty"
            return NextResponse.json({ error: msg }, { status: 400 });
        } 

        // gemini api call
        const truncatedContent = content.slice(0, 10000);
        const prompt = `Summarize the following document, respond only in JSON, matching exactly: {"title": string, "summary": string}\n- title: a short descriptive title, max 10 words\n- summary: concise bullet points, each on its own line starting with "• "\nPreserve important specifics verbatim - commands, function names, syntax, numbers, names, dates. Do not describe what the document is about; extract what it actually says.\n\nDocument:\n${truncatedContent}`;
        const result = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        });

        // parse json
        let title = file.name.replace(/\.[^/.]+$/, "");
        let summary: string | undefined = undefined;

        try {
            if (result.text) {
                const parsed = JSON.parse(result.text);
                if (parsed.title) title = parsed.title;
                if (parsed.summary) summary = parsed.summary;
            }
        } catch(parseError) {
            console.error("Failed to parse Gemini JSON:", parseError);
            // fallback, keep filename & empty summary
        }

        // create note
        const note = await prisma.note.create({
            data: {
                title,
                content,
                summary,
                source: "UPLOAD",
                userId: session.user.id,
            },
        });

        // save embedded content
        try {
            await saveEmbedding(note.id, `${title}\n\n${content}`.slice(0, 30000));
        } catch(embedError) {
            console.error("Failed to save embedding:", embedError);
        }
        
        return NextResponse.json(note, { status: 201 });
    } catch (error) {
        console.error("POST /api/notes/upload error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}