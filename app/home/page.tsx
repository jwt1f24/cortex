import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import NewNoteButton from "../components/NewNoteButton";
import UploadNoteButton from "../components/UploadNoteButton";
import NoteOptionsButton from "../components/NoteOptionsButton";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // search for note keywords
  const { q } = await searchParams;
  const where: Prisma.NoteWhereInput = {
    userId: session.user.id,
    ...(q && {
      OR: [{ title: { contains: q, mode: "insensitive" } }],
    }),
  };

  // fetch all of current user's notes
  const notes = await prisma.note.findMany({
    where: where,
    orderBy: { updated_at: "desc" },
  });

  return (
    <main>
      {/* header */}
      <div className="flex gap-10 mb-4">
        <h1>Welcome to Cortex.</h1>
        <NewNoteButton />
        <UploadNoteButton />
      </div>

      {/* note list */}
      <div>
        {notes.length === 0 ? (
          <p>No documents available.</p>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="flex gap-10">
              <Link href={`/notes/${note.id}`}>
                <div className="flex gap-10">
                  <h3>{note.title}</h3>
                  <p>{note.updated_at.toLocaleDateString()}</p>
                </div>
              </Link>
              <NoteOptionsButton noteId={note.id} />
            </div>
          ))
        )}
      </div>
    </main>
  );
}
