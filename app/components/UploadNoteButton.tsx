"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UploadNoteButton() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState<{
    status: "uploading" | "success" | "error";
    message: string;
  } | null>(null);

  // open modal for uploading document
  const openModal = () => setIsOpen(!isOpen);

  // close modal via cancel button
  const closeModal = () => {
    setIsOpen(false);
    setFile(null);
  };

  // upload document process
  const upload = async () => {
    if (!file) return;
    const name = file.name;

    // close modal & load toast
    closeModal();
    setToast({ status: "uploading", message: `Uploading ${name}...` });
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

      // complete toast and refresh after 3s
      setToast({ status: "success", message: `${name} uploaded` });
      setTimeout(() => setToast(null), 3000);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong.";
      console.error("Error uploading file:", error);
      setToast({ status: "error", message });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <button onClick={openModal}>Upload File</button>

      {/* modal */}
      {isOpen && (
        <div>
          {/* cancel button */}
          <button onClick={closeModal}>✖</button>

          {/* upload field */}
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            accept=".txt,.md,.pdf,.docx,text/plain,text/markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          />

          {/* upload button */}
          <button onClick={upload} disabled={!file || isUploading}>
            Upload
          </button>
        </div>
      )}

      {/* toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 flex gap-4 rounded-lg border bg-white text-black p-3 shadow-lg">
          <p>{toast.message}</p>
          {toast.status !== "uploading" && (
            <button onClick={() => setToast(null)}>✖</button>
          )}
        </div>
      )}
    </div>
  );
}
