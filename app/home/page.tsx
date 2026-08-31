import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { embed } from "@/lib/embeddings";
import { redirect } from "next/navigation";
import { aiLimiter } from "@/lib/ratelimit";
import Link from "next/link";
import Navbar from "../components/Navbar";
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
  let notes = await prisma.note.findMany({
    where: {
      userId: session.user.id,
      ...(q && { title: { contains: q, mode: "insensitive" } }),
    },
    orderBy: { updated_at: "desc" },
  });

  // try meaning if no title matches
  if (q && notes.length === 0) {
    try {
      // rate limiter
      const { success } = await aiLimiter.limit(session.user.id);
      if (success) {
        const vector = await embed(q);
        const literal = `[${vector.join(",")}]`;

        notes = await prisma.$queryRaw<typeof notes>`
          SELECT n.* FROM notes n
          JOIN note_embeddings e ON e."noteId" = n.id
          WHERE n."userId" = ${session.user.id}
            AND e.embedding <=> ${literal}::vector < 0.4
          ORDER BY e.embedding <=> ${literal}::vector
          LIMIT 10
        `;
      }
    } catch (err) {
      console.error("Semantic search failed:", err);
    }
  }

  return (
    <>
      {/* navbar */}
      <Navbar user={session.user} />

      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 sm:mb-24">
        {/* header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-xl sm:text-2xl font-medium tracking-tight">
            {q ? "Search results" : "Welcome to Cortex"}
          </h1>
          <div className="flex gap-3 sm:gap-8">
            <NewNoteButton />
            <UploadNoteButton />
          </div>
        </div>

        {/* column headers */}
        <div className="border border-gray-400 shadow-xl">
          <div className="grid grid-cols-12 gap-2 sm:gap-4 px-3 sm:px-4 py-3 border-b border-gray-300 bg-white text-gray-800 text-sm sm:text-base font-medium tracking-wide">
            <span className="col-span-8 sm:col-span-7">Name</span>
            <span className="hidden sm:block sm:col-span-3">Last updated</span>
            <span className="col-span-4 sm:col-span-2" />
          </div>

          {/* note list */}
          <div className="w-full divide-y divide-gray-300 border-b border-gray-300 bg-white">
            {notes.length === 0 ? (
              <p className="py-16 text-center text-base text-gray-800">
                No documents available.
              </p>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className="group grid grid-cols-12 items-center gap-2 sm:gap-4 px-3 sm:px-4 py-3 hover:bg-gray-50 transition"
                >
                  <Link
                    href={`/notes/${note.id}`}
                    className="col-span-8 sm:col-span-7 min-w-0"
                  >
                    <span className="block text-sm sm:text-base text-black font-medium truncate">
                      {note.title}
                    </span>
                    <span className="block sm:hidden text-xs text-gray-500 truncate">
                      {note.updated_at.toLocaleDateString()}
                    </span>
                  </Link>

                  <span className="hidden sm:block sm:col-span-3 text-base text-gray-600">
                    {note.updated_at.toLocaleDateString()}
                  </span>

                  <div className="col-span-4 sm:col-span-2 flex justify-end">
                    <NoteOptionsButton
                      noteId={note.id}
                      noteTitle={note.title}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </>
  );
}
