import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { note: { create: vi.fn() } },
}));
vi.mock("@/lib/extractText", () => ({ extractText: vi.fn() }));
vi.mock("@/lib/embeddings", () => ({ saveEmbedding: vi.fn() }));
vi.mock("@/lib/gemini", () => ({
  ai: { models: { generateContent: vi.fn() } },
}));

import { auth } from "@/auth";

function uploadRequest(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return new Request("http://localhost", { method: "POST", body: formData });
}

describe("POST /api/notes/upload", () => {
  beforeEach(() => vi.resetAllMocks());

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const res = await POST(
      uploadRequest(new File(["hello"], "note.txt", { type: "text/plain" }))
    );

    expect(res.status).toBe(401);
  });

  it("rejects a disallowed file type", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-a" } } as never);

    const res = await POST(
      uploadRequest(
        new File(["x"], "virus.exe", { type: "application/x-msdownload" })
      )
    );

    expect(res.status).toBe(400);
  });
});