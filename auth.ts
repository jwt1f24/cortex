import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Credentials({
            credentials: {
                email: {},
                password: {},
            },
            authorize: async (credentials) => {
                // user
                const user = await prisma.user.findUnique({
                    where: {email: credentials.email as string},
                })
                if (!user) {
                    return null
                }

                // password
                const valid = await bcrypt.compare(
                    credentials.password as string,
                    user.password_hash
                )
                if (!valid) {
                    return null
                }

                // return user credentials
                return { id: user.id, name: user.name, email: user.email }
            },
        }),
    ],
    callbacks: {
        jwt({ token, user }) {
            if (user) token.id = user.id
            return token
        },
        session({ session, token }) {
            if (session.user) session.user.id = token.id as string
            return session
        },
    }
})