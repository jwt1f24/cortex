import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import NoteEditor from "@/app/components/NoteEditor";

export default async function NotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // auth check
  const session = await auth();
  if (!session?.user?.id) redirect(`/login`);

  // fetch note
  const { id } = await params;
  const note = await prisma.note.findUnique({ where: { id } });

  // edge case
  if (!note || note.userId !== session.user.id) notFound();

  return <NoteEditor note={note} />;
}
