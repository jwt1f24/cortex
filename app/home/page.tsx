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
    <main className="max-w-6xl mx-auto px-6 py-8">
      {/* header row */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-medium tracking-tight">
          Welcome to Cortex.
        </h1>
        <div className="flex gap-2">
          <NewNoteButton />
          <UploadNoteButton />
        </div>
      </div>

      {/* note list */}
      <div className="divide-y divide-gray-200 border-y border-gray-200 bg-white">
        {notes.length === 0 ? (
          <p>No documents available.</p>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="group flex items-center gap-4 px-2 py-3 hover:bg-gray-50 transition"
            >
              <Link href={`/notes/${note.id}`} className="flex-1 min-w-0">
                <span className="block text-base text-black font-medium truncate">
                  {note.title}
                </span>
              </Link>

              <span className="shrink-0 text-base text-gray-500">
                {note.updated_at.toLocaleDateString()}
              </span>

              <div className="shrink-0">
                <NoteOptionsButton noteId={note.id} />
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
