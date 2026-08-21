import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import NewNoteButton from "../components/NewNoteButton";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const notes = await prisma.note.findMany({
    where: { userId: session.user.id },
    orderBy: { updated_at: "desc" },
  });

  return (
    <main>
      {/* header */}
      <div>
        <h1>Welcome to Cortex.</h1>
        <NewNoteButton />
      </div>

      {/* note list */}
      <div>
        {notes.length === 0 ? (
          <p>No documents available.</p>
        ) : (
          notes.map((note) => (
            <Link href={`/notes/${note.id}`} key={note.id}>
              <div>
                <h3>{note.title}</h3>
                <p>{note.content.slice(0, 120)}</p>
                <p>{note.updated_at.toLocaleDateString()}</p>
              </div>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
