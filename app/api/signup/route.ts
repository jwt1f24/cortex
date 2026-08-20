import bcrypt from "bcryptjs"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
    try {
        // parse request body
        const body = await req.json().catch(() => null);
        if (!body) return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 })
        
        const { name, email, password } = body;
        
        // empty credential fields
        if (!email || !password) return NextResponse.json({ error: "Fields cannot be empty."}, { status: 400 })
        
        // existing email
        const existing = await prisma.user.findUnique({ where: { email } })
        if (existing) return NextResponse.json({ error: "Email already exists." }, { status: 409 })

        // hash password
        const password_hash = await bcrypt.hash(password, 10)
        const user = await prisma.user.create({
            data: { name, email, password_hash }
        })

        // return successful json
        return NextResponse.json({ id: user.id, email: user.email }, { status: 201 })
    } catch (error) {
        console.error("Signup error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}