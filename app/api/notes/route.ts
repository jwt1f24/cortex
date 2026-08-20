import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const VALID_SOURCES = ["MANUAL", "UPLOAD"];

// create note
export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            
        // parse request body
        const body = await req.json().catch(() => null);
        if (!body) return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });

        const { title, content, source } = body;
        if (source !== undefined && !VALID_SOURCES.includes(source)) {
            return NextResponse.json({ error: "Invalid source value" }, { status: 400 });
        }

        const note = await prisma.note.create({
            data: {
                title: title || "Untitled",
                content: content || "",
                source: source || "MANUAL",
                userId: session.user.id,
            },
        });

        return NextResponse.json(note, { status: 201 });
    } catch (error) {
        console.error("POST /api/notes error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// get note list
export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            
        const notes = await prisma.note.findMany({ 
            where: { userId: session.user.id },
            orderBy: { updated_at: "desc" },
        });
        
        return NextResponse.json(notes);
    } catch (error) {
        console.error("GET /api/notes error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}