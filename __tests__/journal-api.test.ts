/**
 * Tests for journal entry API privacy and authorization controls.
 *
 * Verifies that journal entries are protected by authentication and
 * ownership checks, and that sharing visibility controls work correctly.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/journal/route";
import { NextRequest } from "next/server";

// Mock auth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    journalEntry: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    stoicPrompt: {
      findUnique: vi.fn(),
    },
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const mockedAuth = vi.mocked(auth);
const mockedPrisma = vi.mocked(prisma, true);

function createPostRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/journal", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("GET /api/journal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockedAuth.mockResolvedValueOnce(null);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toContain("Unauthorized");
  });

  it("returns only the authenticated user's entries", async () => {
    mockedAuth.mockResolvedValueOnce({
      user: { id: "user-1", email: "test@example.com", role: "USER" },
      expires: new Date(Date.now() + 86400000).toISOString(),
    });

    const mockEntries = [
      {
        id: "entry-1",
        userId: "user-1",
        content: "My journal entry",
        isPrivate: true,
      },
    ];
    mockedPrisma.journalEntry.findMany.mockResolvedValueOnce(
      mockEntries as never
    );

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.entries).toHaveLength(1);
    // Verify the query filters by userId
    expect(mockedPrisma.journalEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1" },
      })
    );
  });
});

describe("POST /api/journal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockedAuth.mockResolvedValueOnce(null);

    const req = createPostRequest({ content: "Test entry" });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toContain("Unauthorized");
  });

  it("returns 400 when content is empty", async () => {
    mockedAuth.mockResolvedValueOnce({
      user: { id: "user-1", email: "test@example.com", role: "USER" },
      expires: new Date(Date.now() + 86400000).toISOString(),
    });

    const req = createPostRequest({ content: "" });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("content is required");
  });

  it("defaults isPrivate to true when not specified", async () => {
    mockedAuth.mockResolvedValueOnce({
      user: { id: "user-1", email: "test@example.com", role: "USER" },
      expires: new Date(Date.now() + 86400000).toISOString(),
    });

    const mockEntry = {
      id: "entry-1",
      userId: "user-1",
      content: "My entry",
      isPrivate: true,
    };
    mockedPrisma.journalEntry.create.mockResolvedValueOnce(mockEntry as never);

    const req = createPostRequest({ content: "My entry" });
    await POST(req);

    expect(mockedPrisma.journalEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          isPrivate: true,
        }),
      })
    );
  });

  it("allows user to set isPrivate to false", async () => {
    mockedAuth.mockResolvedValueOnce({
      user: { id: "user-1", email: "test@example.com", role: "USER" },
      expires: new Date(Date.now() + 86400000).toISOString(),
    });

    mockedPrisma.journalEntry.create.mockResolvedValueOnce({
      id: "entry-1",
      userId: "user-1",
      content: "Public entry",
      isPrivate: false,
    } as never);

    const req = createPostRequest({
      content: "Public entry",
      isPrivate: false,
    });
    await POST(req);

    expect(mockedPrisma.journalEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          isPrivate: false,
        }),
      })
    );
  });

  it("creates entry with the authenticated user's ID", async () => {
    mockedAuth.mockResolvedValueOnce({
      user: { id: "user-1", email: "test@example.com", role: "USER" },
      expires: new Date(Date.now() + 86400000).toISOString(),
    });

    mockedPrisma.journalEntry.create.mockResolvedValueOnce({
      id: "entry-1",
      userId: "user-1",
      content: "My entry",
      isPrivate: true,
    } as never);

    const req = createPostRequest({ content: "My entry" });
    const res = await POST(req);

    expect(res.status).toBe(201);
    expect(mockedPrisma.journalEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user-1",
        }),
      })
    );
  });

  it("rejects invalid mood ratings", async () => {
    mockedAuth.mockResolvedValueOnce({
      user: { id: "user-1", email: "test@example.com", role: "USER" },
      expires: new Date(Date.now() + 86400000).toISOString(),
    });

    const req = createPostRequest({
      content: "My entry",
      mood: "INVALID_MOOD",
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("Invalid mood");
  });
});
