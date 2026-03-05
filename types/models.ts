/**
 * StoicApp – Core Data Models
 *
 * These TypeScript interfaces and enums mirror the Prisma schema found in
 * prisma/schema.prisma and serve as the single source of truth for data
 * shapes throughout the application.
 *
 * Design goals:
 *  • Normalised relational model (suitable for PostgreSQL via Prisma)
 *  • Privacy-first: journal entries default to private; sharing is opt-in
 *  • Streak tracking is a first-class concept, not an afterthought
 */

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

/** Roles that control access to admin features. */
export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
}

/** High-level Stoic themes used to categorise prompts and filter content. */
export enum PromptCategory {
  VIRTUE = "VIRTUE",
  RESILIENCE = "RESILIENCE",
  WISDOM = "WISDOM",
  MINDFULNESS = "MINDFULNESS",
  DISCIPLINE = "DISCIPLINE",
  ACCEPTANCE = "ACCEPTANCE",
  OTHER = "OTHER",
}

/**
 * 1–5 mood scale captured alongside each journal entry.
 * The ordinal ordering (VERY_BAD < BAD < NEUTRAL < GOOD < VERY_GOOD) is
 * preserved in the enum declaration and matches the Prisma schema values.
 * For numeric aggregation, map values using MOOD_RATING_VALUE below.
 */
export enum MoodRating {
  VERY_BAD = "VERY_BAD",
  BAD = "BAD",
  NEUTRAL = "NEUTRAL",
  GOOD = "GOOD",
  VERY_GOOD = "VERY_GOOD",
}

/** Maps a MoodRating to its 1–5 integer score for aggregation / charting. */
export const MOOD_RATING_VALUE: Record<MoodRating, number> = {
  [MoodRating.VERY_BAD]: 1,
  [MoodRating.BAD]: 2,
  [MoodRating.NEUTRAL]: 3,
  [MoodRating.GOOD]: 4,
  [MoodRating.VERY_GOOD]: 5,
};

/** How a journal entry may be shared with others. */
export enum ShareType {
  /** Visible on a public profile page. */
  PUBLIC = "PUBLIC",
  /** Accessible via a time-limited, unguessable URL token. */
  LINK = "LINK",
  /** Sent directly to a specific recipient by e-mail. */
  PRIVATE_MESSAGE = "PRIVATE_MESSAGE",
}

// ---------------------------------------------------------------------------
// User account & authentication
// ---------------------------------------------------------------------------

/**
 * Represents a registered user account.
 *
 * Passwords are never stored in plain text; only a bcrypt hash is persisted.
 * OAuth / social sign-in flows may leave `passwordHash` null.
 */
export interface User {
  /** CUID primary key. */
  id: string;
  /** Unique, lower-cased e-mail address used for authentication. */
  email: string;
  /** bcrypt hash of the user's password (null for OAuth-only accounts). */
  passwordHash: string | null;
  /** Optional public display name. */
  displayName: string | null;
  /** URL to a profile avatar image. */
  avatarUrl: string | null;
  /** Account creation timestamp (UTC). */
  createdAt: Date;
  /** Last profile update timestamp (UTC). */
  updatedAt: Date;
  /** Timestamp of the most recent successful sign-in (UTC). */
  lastActiveAt: Date | null;
  /** Whether the user has confirmed their e-mail address. */
  isEmailVerified: boolean;
  /** Role for access-control purposes. */
  role: UserRole;

  // ----- Relations -----
  /** All journal entries authored by this user. */
  journalEntries: JournalEntry[];
  /** Current streak statistics for this user (one-to-one). */
  streak: Streak | null;
  /** Individual daily activity records. */
  dailyActivities: DailyActivity[];
  /** Entries this user has chosen to share. */
  sharedEntries: SharedEntry[];
}

// ---------------------------------------------------------------------------
// Stoic prompts / quotes
// ---------------------------------------------------------------------------

/**
 * A Stoic quote or reflection prompt surfaced to users.
 *
 * Prompts are curated by admins. They can be assigned to specific calendar
 * dates (`scheduledDate`) or drawn randomly from the active pool.
 */
export interface StoicPrompt {
  /** CUID primary key. */
  id: string;
  /** The full text of the quote or reflection prompt. */
  text: string;
  /** Name of the Stoic philosopher or source (e.g. "Marcus Aurelius"). */
  author: string;
  /**
   * Optional citation within the author's work
   * (e.g. "Meditations, Book 5.8").
   */
  source: string | null;
  /** Thematic category for filtering and discovery. */
  category: PromptCategory;
  /** Freeform tags for fine-grained search (e.g. ["death", "equanimity"]). */
  tags: string[];
  /**
   * Whether this prompt is eligible for selection in the daily rotation.
   * Set to false to retire a prompt without deleting it.
   */
  isActive: boolean;
  /**
   * Optional calendar date on which this prompt is scheduled to appear.
   * Null means the prompt is drawn from the general active pool.
   */
  scheduledDate: Date | null;
  /** Record creation timestamp (UTC). */
  createdAt: Date;

  // ----- Relations -----
  /** Journal entries written in response to this prompt. */
  journalEntries: JournalEntry[];
  /** Daily activity records that reference this prompt. */
  dailyActivities: DailyActivity[];
}

// ---------------------------------------------------------------------------
// Journal entries
// ---------------------------------------------------------------------------

/**
 * A single journal entry written by a user, optionally tied to a prompt.
 *
 * Privacy default: `isPrivate = true`. Users must explicitly opt in to
 * any form of sharing via the `SharedEntry` model.
 */
export interface JournalEntry {
  /** CUID primary key. */
  id: string;
  /** Foreign key to the owning `User`. */
  userId: string;
  /**
   * Optional foreign key to the `StoicPrompt` that inspired this entry.
   * Null when the user writes a free-form, unprompted entry.
   */
  promptId: string | null;
  /** The journal text authored by the user. */
  content: string;
  /**
   * Optional mood rating captured at the time of writing.
   * Enables longitudinal mood trend analysis.
   */
  mood: MoodRating | null;
  /**
   * When true (the default) this entry is visible only to its author.
   * Sharing is handled through the `SharedEntry` join record rather than
   * by toggling this flag, which ensures the user retains full control.
   */
  isPrivate: boolean;
  /** Entry creation timestamp (UTC). */
  createdAt: Date;
  /** Last edit timestamp (UTC). */
  updatedAt: Date;

  // ----- Relations -----
  user: User;
  prompt: StoicPrompt | null;
  /** All share records created for this entry. */
  sharedEntries: SharedEntry[];
}

// ---------------------------------------------------------------------------
// Streak & history tracking
// ---------------------------------------------------------------------------

/**
 * Aggregated streak statistics for a single user.
 *
 * A "day" counts toward the streak only when the user creates at least one
 * journal entry before midnight in their local time zone.
 */
export interface Streak {
  /** CUID primary key. */
  id: string;
  /** Foreign key to `User` — unique (one streak record per user). */
  userId: string;
  /** Number of consecutive days the user has journaled up to today. */
  currentStreak: number;
  /** All-time longest consecutive streak (never decremented). */
  longestStreak: number;
  /**
   * The most recent calendar date on which the user journaled.
   * Null for users who have not yet created any journal entries.
   * Used to decide whether the current streak is still alive.
   */
  lastActiveDate: Date | null;
  /**
   * Calendar date on which the current streak started.
   * Null for users who have not yet created any journal entries.
   */
  streakStartDate: Date | null;
  /** Cumulative total of distinct days the user has journaled. */
  totalDaysJournaled: number;
  /** Last update timestamp (UTC). */
  updatedAt: Date;

  // ----- Relations -----
  user: User;
}

/**
 * A granular per-day activity record used to build streak history charts
 * and audit the streak calculation without scanning all journal entries.
 *
 * One record is upserted per user per calendar day.  It intentionally does
 * not hold a foreign key to a specific journal entry: users may write
 * multiple entries in a single day, and streak logic only cares whether at
 * least one entry existed.
 */
export interface DailyActivity {
  /** CUID primary key. */
  id: string;
  /** Foreign key to `User`. */
  userId: string;
  /**
   * The calendar date this record covers (time component set to 00:00:00 UTC
   * so date comparisons remain unambiguous across time zones).
   */
  date: Date;
  /** Whether the user journaled on this day. */
  hasJournaled: boolean;
  /** The prompt that was shown to the user on this day (if any). */
  promptId: string | null;

  // ----- Relations -----
  user: User;
  prompt: StoicPrompt | null;
}

// ---------------------------------------------------------------------------
// Sharing
// ---------------------------------------------------------------------------

/**
 * Represents an explicit sharing action taken by a user on one of their
 * journal entries.
 *
 * This keeps sharing metadata separate from the entry itself so that
 * access-control checks are centralised and auditable.
 */
export interface SharedEntry {
  /** CUID primary key. */
  id: string;
  /** Foreign key to the `JournalEntry` being shared. */
  journalEntryId: string;
  /** Foreign key to the `User` who initiated the share. */
  sharedByUserId: string;
  /** The mechanism by which this entry is being shared. */
  shareType: ShareType;
  /**
   * Cryptographically random token used when `shareType = LINK`.
   * Must be treated as a secret; do not log or expose in error messages.
   */
  shareToken: string | null;
  /**
   * Recipient e-mail address used when `shareType = PRIVATE_MESSAGE`.
   * Stored encrypted at rest to satisfy data-privacy requirements.
   */
  recipientEmail: string | null;
  /** Timestamp when the share was created (UTC). */
  createdAt: Date;
  /**
   * Optional expiry for link-based shares.
   * After this timestamp the share token must be treated as invalid.
   */
  expiresAt: Date | null;

  // ----- Relations -----
  journalEntry: JournalEntry;
  sharedByUser: User;
}
