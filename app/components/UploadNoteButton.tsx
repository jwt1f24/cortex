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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
            {/* header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-black">
                Upload a document
              </h2>
              <button
                onClick={closeModal}
                aria-label="Close"
                className="h-8 w-8 flex items-center justify-center rounded-full text-gray-600 hover:bg-gray-200 transition cursor-pointer"
              >
                ✖
              </button>
            </div>

            {/* drop area */}
            <div className="px-5 py-6">
              <label className="flex flex-col items-center justify-center py-12 gap-2 rounded-lg border-2 border-dashed border-gray-400 hover:bg-gray-50 transition cursor-pointer">
                <span className="text-base text-black">
                  {file ? file.name : "Click to select a file"}
                </span>
                <span className="text-sm text-gray-600">
                  TXT, MD, PDF, or DOCX • max 5MB
                </span>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  accept=".txt,.md,.pdf,.docx,text/plain,text/markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                />
              </label>
            </div>

            {/* footer */}
            <div className="border-t border-gray-200 px-5 py-4">
              <button
                onClick={upload}
                disabled={!file || isUploading}
                className="w-full px-4 py-2 rounded-md bg-gray-900 text-base text-white font-semibold hover:bg-gray-800 transition cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed"
              >
                {isUploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
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
