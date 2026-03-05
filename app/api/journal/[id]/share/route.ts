/**
 * Journal entry sharing API.
 *
 * POST /api/journal/[id]/share  — Share a journal entry.
 *
 * Supports PUBLIC, LINK, and PRIVATE_MESSAGE sharing types.
 * Only the entry owner can create shares.
 */

import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidEmail } from "@/lib/auth-helpers";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;

  // Verify entry exists and belongs to user
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
      { error: "You do not have permission to share this entry." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    const { shareType, recipientEmail, expiresInHours } = body as {
      shareType?: string;
      recipientEmail?: string;
      expiresInHours?: number;
    };

    const validShareTypes = ["PUBLIC", "LINK", "PRIVATE_MESSAGE"] as const;
    if (
      !shareType ||
      !validShareTypes.includes(shareType as (typeof validShareTypes)[number])
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid share type. Must be PUBLIC, LINK, or PRIVATE_MESSAGE.",
        },
        { status: 400 }
      );
    }

    // Validate recipient email for PRIVATE_MESSAGE shares
    if (shareType === "PRIVATE_MESSAGE") {
      if (!recipientEmail || !isValidEmail(recipientEmail)) {
        return NextResponse.json(
          {
            error:
              "A valid recipient email is required for private message shares.",
          },
          { status: 400 }
        );
      }
    }

    // Generate share token for LINK shares
    const shareToken =
      shareType === "LINK" ? randomBytes(32).toString("hex") : null;

    // Calculate expiry for LINK shares (default: 7 days)
    const expiresAt =
      shareType === "LINK"
        ? new Date(Date.now() + (expiresInHours ?? 168) * 60 * 60 * 1000)
        : null;

    // Mark entry as non-private when sharing publicly
    if (shareType === "PUBLIC") {
      await prisma.journalEntry.update({
        where: { id },
        data: { isPrivate: false },
      });
    }

    const shared = await prisma.sharedEntry.create({
      data: {
        journalEntryId: id,
        sharedByUserId: session.user.id,
        shareType: shareType as "PUBLIC" | "LINK" | "PRIVATE_MESSAGE",
        shareToken,
        recipientEmail: shareType === "PRIVATE_MESSAGE" ? recipientEmail : null,
        expiresAt,
      },
    });

    return NextResponse.json({ shared }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to share journal entry." },
      { status: 500 }
    );
  }
}
