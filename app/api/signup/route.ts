import bcrypt from "bcryptjs"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
    const { name, email, password } = await req.json()

    // empty credential field
    if (!email || !password) {
        return NextResponse.json({ error: "Fields cannot be empty"}, { status: 400 })
    }

    // existing email
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
        return NextResponse.json({ error: "Email already exists" }, { status: 409 })
    }

    // hash password
    const password_hash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
        data: { name, email, password_hash }
    })

    // return user credentials
    return NextResponse.json({ id: user.id, email: user.email })
}