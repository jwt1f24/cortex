import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { note: { findUnique: vi.fn() } },
}));

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

describe("GET /api/notes/[id]", () => {
  beforeEach(() => vi.resetAllMocks());

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const res = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ id: "note-1" }),
    });

    expect(res.status).toBe(401);
  });

  it("returns 404 when the note belongs to another user", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-a" } } as never);
    vi.mocked(prisma.note.findUnique).mockResolvedValue({
      id: "note-1",
      userId: "user-b",
    } as never);

    const res = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ id: "note-1" }),
    });

    expect(res.status).toBe(403);
  });
});