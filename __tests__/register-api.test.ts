/**
 * Tests for the user registration API endpoint.
 *
 * Uses mocked Prisma client to test input validation, duplicate email
 * handling, and successful registration without a real database.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/auth/register/route";
import { NextRequest } from "next/server";

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    streak: {
      create: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

const mockedPrisma = vi.mocked(prisma, true);

function createRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when email is missing", async () => {
    const req = createRequest({ password: "validpassword123" });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("Email and password are required");
  });

  it("returns 400 when password is missing", async () => {
    const req = createRequest({ email: "test@example.com" });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("Email and password are required");
  });

  it("returns 400 for invalid email format", async () => {
    const req = createRequest({
      email: "notanemail",
      password: "validpassword123",
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("valid email");
  });

  it("returns 400 for password shorter than minimum", async () => {
    const req = createRequest({
      email: "test@example.com",
      password: "short",
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("at least");
  });

  it("returns 409 when email already exists", async () => {
    mockedPrisma.user.findUnique.mockResolvedValueOnce({
      id: "existing-id",
      email: "test@example.com",
      passwordHash: "hash",
      displayName: null,
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActiveAt: null,
      isEmailVerified: false,
      role: "USER",
    });

    const req = createRequest({
      email: "test@example.com",
      password: "validpassword123",
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(409);
    expect(data.error).toContain("already exists");
  });

  it("returns 201 on successful registration", async () => {
    mockedPrisma.user.findUnique.mockResolvedValueOnce(null);

    const mockUser = {
      id: "new-user-id",
      email: "new@example.com",
      displayName: "Test User",
      createdAt: new Date(),
      role: "USER",
    };
    mockedPrisma.user.create.mockResolvedValueOnce(mockUser as never);
    mockedPrisma.streak.create.mockResolvedValueOnce({} as never);

    const req = createRequest({
      email: "new@example.com",
      password: "validpassword123",
      displayName: "Test User",
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.message).toContain("Account created successfully");
    expect(data.user.email).toBe("new@example.com");
  });

  it("normalizes email to lowercase", async () => {
    mockedPrisma.user.findUnique.mockResolvedValueOnce(null);
    mockedPrisma.user.create.mockResolvedValueOnce({
      id: "new-id",
      email: "test@example.com",
      displayName: null,
      createdAt: new Date(),
      role: "USER",
    } as never);
    mockedPrisma.streak.create.mockResolvedValueOnce({} as never);

    const req = createRequest({
      email: "TEST@Example.COM",
      password: "validpassword123",
    });
    await POST(req);

    expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "test@example.com" },
    });
  });

  it("does not return password hash in response", async () => {
    mockedPrisma.user.findUnique.mockResolvedValueOnce(null);
    mockedPrisma.user.create.mockResolvedValueOnce({
      id: "new-id",
      email: "test@example.com",
      displayName: null,
      createdAt: new Date(),
      role: "USER",
    } as never);
    mockedPrisma.streak.create.mockResolvedValueOnce({} as never);

    const req = createRequest({
      email: "test@example.com",
      password: "validpassword123",
    });
    const res = await POST(req);
    const data = await res.json();

    expect(data.user.passwordHash).toBeUndefined();
    expect(data.user.password).toBeUndefined();
  });
});
