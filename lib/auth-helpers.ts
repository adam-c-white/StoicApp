/**
 * Authentication helper utilities.
 *
 * Provides password hashing and verification using bcryptjs, as well as
 * input validation helpers for the authentication flows.
 */

import bcrypt from "bcryptjs";

/** Number of salt rounds for bcrypt hashing (OWASP recommended minimum: 10). */
const BCRYPT_SALT_ROUNDS = 12;

/** Minimum password length enforced at the application layer. */
export const MIN_PASSWORD_LENGTH = 8;

/** Maximum password length to prevent bcrypt DoS (bcrypt truncates at 72 bytes). */
export const MAX_PASSWORD_LENGTH = 72;

/**
 * Hash a plain-text password using bcrypt.
 *
 * @param password - The plain-text password to hash.
 * @returns A bcrypt hash string safe for storage.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

/**
 * Compare a plain-text password against a bcrypt hash.
 *
 * @param password - The plain-text password to verify.
 * @param hash - The stored bcrypt hash to compare against.
 * @returns `true` if the password matches the hash.
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Validate that an email address has a valid format.
 *
 * Uses a pragmatic regex that covers the vast majority of real-world
 * email addresses without being overly restrictive.
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength requirements.
 *
 * @returns An error message string if invalid, or `null` if valid.
 */
export function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`;
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return `Password must be at most ${MAX_PASSWORD_LENGTH} characters long.`;
  }
  return null;
}

/**
 * Normalize an email address for storage and comparison.
 *
 * Trims whitespace and converts to lower case, matching the Prisma
 * schema convention for the User.email field.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
