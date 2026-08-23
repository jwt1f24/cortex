"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UploadNoteButton() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // open modal for uploading document
  const openModal = () => setIsOpen(!isOpen);

  // close modal via cancel button
  const closeModal = () => {
    setFile(null);
    setError(null);
    openModal();
  };

  // upload document process
  const upload = async () => {
    if (!file) return;
    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // send http post empty body request to api
      const res = await fetch("/api/notes/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Unable to create note.");
      }

      // close modal and refresh
      closeModal();
      router.refresh();
    } catch (error) {
      console.error("Error uploading file:", error);
      setError(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      {error && <p>{error}</p>}
      <button onClick={openModal}>Upload File</button>
      {isOpen && (
        <div>
          {/* cancel button */}
          <button onClick={closeModal}>✖</button>

          {/* upload field */}
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            accept=".txt,.md"
          />

          {/* upload button */}
          <button onClick={upload} disabled={!file || isUploading}>
            Upload
          </button>
        </div>
      )}
    </div>
  );
}
