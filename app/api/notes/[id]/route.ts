import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { saveEmbedding } from "@/lib/embeddings";

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
        const { title, content, source, summary, version } = body;
        
        if (typeof version !== "number") {
            return NextResponse.json({ error: "Version is required"}, { status:400})
        }
        
        if (source !== undefined && !VALID_SOURCES.includes(source)) {
            return NextResponse.json({ error: "Invalid source value" }, { status: 400 });
        }
        
        // fetch note
        const { id } = await params;
        const note = await prisma.note.findUnique({ where: { id } });

        // note edge cases
        if (!note) return NextResponse.json({ error: "Note does not exist" }, { status: 404 });
        if (note.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const result = await prisma.note.updateMany({
            where: { id, version },
            data: {
                ...(title !== undefined && { title }),
                ...(content !== undefined && { content }),
                ...(source !== undefined && { source }),
                ...(summary !== undefined && { summary }),
                version: {increment: 1},
            },
        });

        if (result.count === 0) {
            return NextResponse.json({error: "This note was changed elsewhere, reload to see updated version."}, {status: 409})
        }

        // refetch so client gets new version number
        const updatedNote = await prisma.note.findUnique({ where: { id } });

        // save embedded content
        if (content !== undefined && content !== note.content && updatedNote) {
            try {
                await saveEmbedding(id, `${updatedNote.title}\n\n${updatedNote.content}`.slice(0, 30000));
            } catch(embedError) {
                console.error("Failed to save embedding:", embedError);
            }    
        }

        return NextResponse.json(updatedNote);
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