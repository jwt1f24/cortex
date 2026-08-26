import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { embed } from "@/lib/embeddings";
import { matchType } from "better-auth/db/migration";

const MAX_DISTANCE = 0.40;

export async function POST(req: Request) {
    try {
        // auth check
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            
        // parse request body
        const body = await req.json().catch(() => null);
        if (!body?.query?.trim()) return NextResponse.json({ error: "Query is required" }, { status: 400 });

        const query = body.query.trim();

        // embed search query
        const vector = await embed(query);
        const literal = `[${vector.join(",")}]`;

        // find nearest notes by cosine distance
        const results = await prisma.$queryRaw
        <
            { 
                id: string; 
                title: string; 
                summary: string | null; 
                updated_at: Date;
                distance: number;
            }[]
        >`
            SELECT n.id, n.title, n.summary, n.updated_at, 
                e.embedding <=> ${literal}::vector AS distance
            FROM notes n
            JOIN note_embeddings e ON e."noteId" = n.id
            WHERE n."userId" = ${session.user.id}
                AND e.embedding <=> ${literal}::vector < ${MAX_DISTANCE}
            ORDER BY distance
            LIMIT 10
        `;

        // keyword match on title
        const keywordMatch = await prisma.note.findMany({
            where: {
                userId: session.user.id,
                title: { contains: query, mode: "insensitive" },
            },
            select: { id: true, title: true, summary: true, updated_at: true },
            take: 10,
        })

        // merge keyword with semantic search, deduped by id
        const seen = new Set(keywordMatch.map(n => n.id))
        const merged = [
            ...keywordMatch.map(n => ({ ...n, distance: 0, matchType: "keyword" as const })),
            ...results.filter(r => !seen.has(r.id)).map(r => ({ ...r, matchType: "semantic" as const })),
        ]
        
        return NextResponse.json(merged);
    } catch (error) {
        console.error("POST /api/notes/search error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}