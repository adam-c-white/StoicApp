/**
 * Individual journal entry API routes.
 *
 * GET    /api/journal/[id]  — Get a specific journal entry (owner only).
 * PATCH  /api/journal/[id]  — Update a journal entry (owner only).
 * DELETE /api/journal/[id]  — Delete a journal entry (owner only).
 *
 * All routes require authentication and verify ownership.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;

  const entry = await prisma.journalEntry.findUnique({
    where: { id },
    include: {
      prompt: {
        select: { id: true, text: true, author: true },
      },
      sharedEntries: {
        select: {
          id: true,
          shareType: true,
          shareToken: true,
          createdAt: true,
          expiresAt: true,
        },
      },
    },
  });

  if (!entry) {
    return NextResponse.json(
      { error: "Journal entry not found." },
      { status: 404 }
    );
  }

  // Only the owner can access their entries
  if (entry.userId !== session.user.id) {
    return NextResponse.json(
      { error: "You do not have permission to view this entry." },
      { status: 403 }
    );
  }

  return NextResponse.json({ entry });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;

  const entry = await prisma.journalEntry.findUnique({
    where: { id },
  });

  if (!entry) {
    return NextResponse.json(
      { error: "Journal entry not found." },
      { status: 404 }
    );
  }

  if (entry.userId !== session.user.id) {
    return NextResponse.json(
      { error: "You do not have permission to edit this entry." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    const { content, mood, isPrivate } = body as {
      content?: string;
      mood?: string;
      isPrivate?: boolean;
    };

    const validMoods = [
      "VERY_BAD",
      "BAD",
      "NEUTRAL",
      "GOOD",
      "VERY_GOOD",
    ] as const;
    if (mood && !validMoods.includes(mood as (typeof validMoods)[number])) {
      return NextResponse.json(
        { error: "Invalid mood rating." },
        { status: 400 }
      );
    }

    const updated = await prisma.journalEntry.update({
      where: { id },
      data: {
        ...(content !== undefined && { content: content.trim() }),
        ...(mood !== undefined && {
          mood: mood as "VERY_BAD" | "BAD" | "NEUTRAL" | "GOOD" | "VERY_GOOD",
        }),
        ...(isPrivate !== undefined && { isPrivate }),
      },
    });

    return NextResponse.json({ entry: updated });
  } catch {
    return NextResponse.json(
      { error: "Failed to update journal entry." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;

  const entry = await prisma.journalEntry.findUnique({
    where: { id },
  });

  if (!entry) {
    return NextResponse.json(
      { error: "Journal entry not found." },
      { status: 404 }
    );
  }

  if (entry.userId !== session.user.id) {
    return NextResponse.json(
      { error: "You do not have permission to delete this entry." },
      { status: 403 }
    );
  }

  await prisma.journalEntry.delete({ where: { id } });

  return NextResponse.json({ message: "Journal entry deleted." });
}
