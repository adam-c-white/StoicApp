/**
 * Journal entry API routes.
 *
 * GET  /api/journal  — List the authenticated user's journal entries.
 * POST /api/journal  — Create a new journal entry.
 *
 * All routes require authentication (enforced by middleware).
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const entries = await prisma.journalEntry.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      prompt: {
        select: { id: true, text: true, author: true },
      },
    },
  });

  return NextResponse.json({ entries });
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();

    const { content, promptId, mood, isPrivate } = body as {
      content?: string;
      promptId?: string;
      mood?: string;
      isPrivate?: boolean;
    };

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Journal entry content is required." },
        { status: 400 }
      );
    }

    // Validate mood if provided
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

    // Validate promptId if provided
    if (promptId) {
      const prompt = await prisma.stoicPrompt.findUnique({
        where: { id: promptId },
      });
      if (!prompt) {
        return NextResponse.json(
          { error: "Prompt not found." },
          { status: 404 }
        );
      }
    }

    const entry = await prisma.journalEntry.create({
      data: {
        userId: session.user.id,
        content: content.trim(),
        promptId: promptId || null,
        mood: mood as
          | "VERY_BAD"
          | "BAD"
          | "NEUTRAL"
          | "GOOD"
          | "VERY_GOOD"
          | undefined,
        isPrivate: isPrivate !== false, // Default to private
      },
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create journal entry." },
      { status: 500 }
    );
  }
}
