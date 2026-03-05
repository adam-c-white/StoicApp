/**
 * Tests for journal entry ownership and access control.
 *
 * Verifies that users can only access, modify, and delete their own
 * journal entries, and that other users are denied access.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PATCH, DELETE } from "@/app/api/journal/[id]/route";
import { NextRequest } from "next/server";

// Mock auth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    journalEntry: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const mockedAuth = vi.mocked(auth);
const mockedPrisma = vi.mocked(prisma, true);

function createContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("GET /api/journal/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockedAuth.mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost:3000/api/journal/entry-1");
    const res = await GET(req, createContext("entry-1"));
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toContain("Unauthorized");
  });

  it("returns 404 for non-existent entry", async () => {
    mockedAuth.mockResolvedValueOnce({
      user: { id: "user-1", email: "test@example.com", role: "USER" },
      expires: new Date(Date.now() + 86400000).toISOString(),
    });
    mockedPrisma.journalEntry.findUnique.mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost:3000/api/journal/nonexist");
    const res = await GET(req, createContext("nonexist"));
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toContain("not found");
  });

  it("returns 403 when accessing another user's entry", async () => {
    mockedAuth.mockResolvedValueOnce({
      user: { id: "user-1", email: "test@example.com", role: "USER" },
      expires: new Date(Date.now() + 86400000).toISOString(),
    });
    mockedPrisma.journalEntry.findUnique.mockResolvedValueOnce({
      id: "entry-1",
      userId: "user-2", // Different user
      content: "Secret entry",
      isPrivate: true,
      prompt: null,
      sharedEntries: [],
    } as never);

    const req = new NextRequest("http://localhost:3000/api/journal/entry-1");
    const res = await GET(req, createContext("entry-1"));
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toContain("permission");
  });

  it("returns entry when user is the owner", async () => {
    mockedAuth.mockResolvedValueOnce({
      user: { id: "user-1", email: "test@example.com", role: "USER" },
      expires: new Date(Date.now() + 86400000).toISOString(),
    });
    mockedPrisma.journalEntry.findUnique.mockResolvedValueOnce({
      id: "entry-1",
      userId: "user-1",
      content: "My entry",
      isPrivate: true,
      prompt: null,
      sharedEntries: [],
    } as never);

    const req = new NextRequest("http://localhost:3000/api/journal/entry-1");
    const res = await GET(req, createContext("entry-1"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.entry.content).toBe("My entry");
  });
});

describe("PATCH /api/journal/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 when editing another user's entry", async () => {
    mockedAuth.mockResolvedValueOnce({
      user: { id: "user-1", email: "test@example.com", role: "USER" },
      expires: new Date(Date.now() + 86400000).toISOString(),
    });
    mockedPrisma.journalEntry.findUnique.mockResolvedValueOnce({
      id: "entry-1",
      userId: "user-2",
      content: "Not yours",
      isPrivate: true,
    } as never);

    const req = new NextRequest("http://localhost:3000/api/journal/entry-1", {
      method: "PATCH",
      body: JSON.stringify({ content: "Hacked!" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PATCH(req, createContext("entry-1"));
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toContain("permission");
  });

  it("allows owner to update their entry's privacy setting", async () => {
    mockedAuth.mockResolvedValueOnce({
      user: { id: "user-1", email: "test@example.com", role: "USER" },
      expires: new Date(Date.now() + 86400000).toISOString(),
    });
    mockedPrisma.journalEntry.findUnique.mockResolvedValueOnce({
      id: "entry-1",
      userId: "user-1",
      content: "My entry",
      isPrivate: true,
    } as never);
    mockedPrisma.journalEntry.update.mockResolvedValueOnce({
      id: "entry-1",
      userId: "user-1",
      content: "My entry",
      isPrivate: false,
    } as never);

    const req = new NextRequest("http://localhost:3000/api/journal/entry-1", {
      method: "PATCH",
      body: JSON.stringify({ isPrivate: false }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PATCH(req, createContext("entry-1"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(mockedPrisma.journalEntry.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isPrivate: false }),
      })
    );
    expect(data.entry.isPrivate).toBe(false);
  });
});

describe("DELETE /api/journal/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 when deleting another user's entry", async () => {
    mockedAuth.mockResolvedValueOnce({
      user: { id: "user-1", email: "test@example.com", role: "USER" },
      expires: new Date(Date.now() + 86400000).toISOString(),
    });
    mockedPrisma.journalEntry.findUnique.mockResolvedValueOnce({
      id: "entry-1",
      userId: "user-2",
      content: "Not yours",
      isPrivate: true,
    } as never);

    const req = new NextRequest("http://localhost:3000/api/journal/entry-1", {
      method: "DELETE",
    });
    const res = await DELETE(req, createContext("entry-1"));
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toContain("permission");
  });

  it("allows owner to delete their entry", async () => {
    mockedAuth.mockResolvedValueOnce({
      user: { id: "user-1", email: "test@example.com", role: "USER" },
      expires: new Date(Date.now() + 86400000).toISOString(),
    });
    mockedPrisma.journalEntry.findUnique.mockResolvedValueOnce({
      id: "entry-1",
      userId: "user-1",
      content: "My entry",
      isPrivate: true,
    } as never);
    mockedPrisma.journalEntry.delete.mockResolvedValueOnce({} as never);

    const req = new NextRequest("http://localhost:3000/api/journal/entry-1", {
      method: "DELETE",
    });
    const res = await DELETE(req, createContext("entry-1"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.message).toContain("deleted");
  });
});
