/**
 * Tests for authentication helper utilities.
 *
 * Covers password hashing, verification, email validation,
 * password strength validation, and email normalization.
 */

import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  isValidEmail,
  validatePassword,
  normalizeEmail,
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
} from "@/lib/auth-helpers";

describe("hashPassword", () => {
  it("returns a bcrypt hash string", async () => {
    const hash = await hashPassword("testpassword123");
    expect(hash).toBeTruthy();
    expect(hash).toMatch(/^\$2[aby]?\$/); // bcrypt hash prefix
  });

  it("produces different hashes for the same password (salted)", async () => {
    const hash1 = await hashPassword("testpassword123");
    const hash2 = await hashPassword("testpassword123");
    expect(hash1).not.toBe(hash2);
  });
});

describe("verifyPassword", () => {
  it("returns true for a matching password", async () => {
    const password = "correctpassword";
    const hash = await hashPassword(password);
    const result = await verifyPassword(password, hash);
    expect(result).toBe(true);
  });

  it("returns false for a non-matching password", async () => {
    const hash = await hashPassword("correctpassword");
    const result = await verifyPassword("wrongpassword", hash);
    expect(result).toBe(false);
  });

  it("returns false for an empty password", async () => {
    const hash = await hashPassword("correctpassword");
    const result = await verifyPassword("", hash);
    expect(result).toBe(false);
  });
});

describe("isValidEmail", () => {
  it.each([
    "user@example.com",
    "user.name@domain.co.uk",
    "user+tag@example.org",
    "a@b.co",
  ])("accepts valid email: %s", (email) => {
    expect(isValidEmail(email)).toBe(true);
  });

  it.each(["", "notanemail", "@missing.com", "user@", "user @space.com"])(
    "rejects invalid email: %s",
    (email) => {
      expect(isValidEmail(email)).toBe(false);
    }
  );
});

describe("validatePassword", () => {
  it("returns null for a valid password", () => {
    expect(validatePassword("strongpassword123")).toBeNull();
  });

  it("returns error for password shorter than minimum", () => {
    const short = "a".repeat(MIN_PASSWORD_LENGTH - 1);
    const error = validatePassword(short);
    expect(error).toBeTruthy();
    expect(error).toContain(String(MIN_PASSWORD_LENGTH));
  });

  it("returns error for password longer than maximum", () => {
    const long = "a".repeat(MAX_PASSWORD_LENGTH + 1);
    const error = validatePassword(long);
    expect(error).toBeTruthy();
    expect(error).toContain(String(MAX_PASSWORD_LENGTH));
  });

  it("accepts password at exactly minimum length", () => {
    const exact = "a".repeat(MIN_PASSWORD_LENGTH);
    expect(validatePassword(exact)).toBeNull();
  });

  it("accepts password at exactly maximum length", () => {
    const exact = "a".repeat(MAX_PASSWORD_LENGTH);
    expect(validatePassword(exact)).toBeNull();
  });
});

describe("normalizeEmail", () => {
  it("converts email to lowercase", () => {
    expect(normalizeEmail("User@Example.COM")).toBe("user@example.com");
  });

  it("trims whitespace", () => {
    expect(normalizeEmail("  user@example.com  ")).toBe("user@example.com");
  });

  it("handles already-normalized email", () => {
    expect(normalizeEmail("user@example.com")).toBe("user@example.com");
  });
});
