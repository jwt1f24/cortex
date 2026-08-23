import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const VALID_SOURCES = ["MANUAL", "UPLOAD"];

// get one note
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        // auth check
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            
        // fetch note
        const { id } = await params;
        const note = await prisma.note.findUnique({ where: { id } });

        // note edge cases
        if (!note) return NextResponse.json({ error: "Note does not exist" }, { status: 404 });
        if (note.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        
        return NextResponse.json(note);
    } catch (error) {
        console.error("GET /api/notes/[id] error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// update note
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        // auth check
        const session = await auth()
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // parse request body
        const body = await req.json().catch(() => null);
        if (!body) return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
        
        // destructure summary from request body
        const { title, content, source, summary } = body;
        if (source !== undefined && !VALID_SOURCES.includes(source)) {
            return NextResponse.json({ error: "Invalid source value" }, { status: 400 });
        }
        
        // fetch note
        const { id } = await params;
        const note = await prisma.note.findUnique({ where: { id } });

        // note edge cases
        if (!note) return NextResponse.json({ error: "Note does not exist" }, { status: 404 });
        if (note.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const updateNote = await prisma.note.update({
            where: { id },
            data: {
                ...(title !== undefined && { title }),
                ...(content !== undefined && { content }),
                ...(source !== undefined && { source }),
                ...(summary !== undefined && { summary }),
            },
        });

        return NextResponse.json(updateNote);
    } catch (error) {
        console.error("PATCH /api/notes/[id] error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// delete note
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try { 
        // auth check
        const session = await auth()
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // fetch note
        const { id } = await params;
        const note = await prisma.note.findUnique({ where: { id } });

        // note edge cases
        if (!note) return NextResponse.json({ error: "Note does not exist" }, { status: 404 });
        if (note.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        await prisma.note.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/notes/[id] error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}