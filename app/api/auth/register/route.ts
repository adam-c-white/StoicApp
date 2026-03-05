/**
 * User registration API endpoint.
 *
 * POST /api/auth/register
 *
 * Creates a new user account with email and password.
 * Returns the created user (without sensitive fields).
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  isValidEmail,
  validatePassword,
  normalizeEmail,
} from "@/lib/auth-helpers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { email, password, displayName } = body as {
      email?: string;
      password?: string;
      displayName?: string;
    };

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = normalizeEmail(email);

    // Validate email format
    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        displayName: displayName?.trim() || null,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        createdAt: true,
        role: true,
      },
    });

    // Create initial streak record for the new user
    await prisma.streak.create({
      data: {
        userId: user.id,
      },
    });

    return NextResponse.json(
      { message: "Account created successfully.", user },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
