/**
 * Tests for journal entry sharing API.
 *
 * Verifies sharing controls including ownership checks, share type
 * validation, and privacy visibility settings.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/journal/[id]/share/route";
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
    },
    sharedEntry: {
      create: vi.fn(),
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

function createRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/journal/entry-1/share", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/journal/[id]/share", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockedAuth.mockResolvedValueOnce(null);

    const req = createRequest({ shareType: "PUBLIC" });
    const res = await POST(req, createContext("entry-1"));
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toContain("Unauthorized");
  });

  it("returns 403 when sharing another user's entry", async () => {
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

    const req = createRequest({ shareType: "PUBLIC" });
    const res = await POST(req, createContext("entry-1"));
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toContain("permission");
  });

  it("returns 400 for invalid share type", async () => {
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

    const req = createRequest({ shareType: "INVALID" });
    const res = await POST(req, createContext("entry-1"));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("Invalid share type");
  });

  it("requires recipient email for PRIVATE_MESSAGE shares", async () => {
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

    const req = createRequest({ shareType: "PRIVATE_MESSAGE" });
    const res = await POST(req, createContext("entry-1"));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("recipient email");
  });

  it("creates PUBLIC share and marks entry as non-private", async () => {
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
    mockedPrisma.journalEntry.update.mockResolvedValueOnce({} as never);
    mockedPrisma.sharedEntry.create.mockResolvedValueOnce({
      id: "share-1",
      shareType: "PUBLIC",
      journalEntryId: "entry-1",
      sharedByUserId: "user-1",
    } as never);

    const req = createRequest({ shareType: "PUBLIC" });
    const res = await POST(req, createContext("entry-1"));
    const data = await res.json();

    expect(res.status).toBe(201);
    // Verify the entry was marked as non-private
    expect(mockedPrisma.journalEntry.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "entry-1" },
        data: { isPrivate: false },
      })
    );
    expect(data.shared.shareType).toBe("PUBLIC");
  });

  it("creates LINK share with a token and expiry", async () => {
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
    mockedPrisma.sharedEntry.create.mockResolvedValueOnce({
      id: "share-1",
      shareType: "LINK",
      shareToken: "abc123",
      expiresAt: new Date(),
    } as never);

    const req = createRequest({ shareType: "LINK", expiresInHours: 24 });
    const res = await POST(req, createContext("entry-1"));
    const data = await res.json();

    expect(res.status).toBe(201);
    // Verify token and expiry were set
    expect(mockedPrisma.sharedEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          shareType: "LINK",
          shareToken: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      })
    );
    expect(data.shared.shareType).toBe("LINK");
  });
});
