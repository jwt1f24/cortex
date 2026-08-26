-- CreateTable
CREATE TABLE "note_embeddings" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "embedding" vector(768) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "note_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "note_embeddings_noteId_key" ON "note_embeddings"("noteId");

-- AddForeignKey
ALTER TABLE "note_embeddings" ADD CONSTRAINT "note_embeddings_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
