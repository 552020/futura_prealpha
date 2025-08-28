import { createHash, randomBytes } from "crypto";
import { db } from "@/db/db";
import { iiNonces, type NewDBIINonce } from "@/db/schema";
import { eq, and, lt, isNull } from "drizzle-orm";

/**
 * Configuration for nonce generation and validation
 */
export const NONCE_CONFIG = {
  // TTL in seconds (3 minutes by default)
  DEFAULT_TTL_SECONDS: 180,
  // Nonce length in bytes (128 bits)
  NONCE_LENGTH_BYTES: 16,
  // Hash algorithm for storing nonces
  HASH_ALGORITHM: "sha256" as const,
} as const;

/**
 * Generate a cryptographically secure random nonce
 */
export function generateNonce(): string {
  return randomBytes(NONCE_CONFIG.NONCE_LENGTH_BYTES).toString("base64url");
}

/**
 * Hash a nonce for secure storage
 */
export function hashNonce(nonce: string): string {
  return createHash(NONCE_CONFIG.HASH_ALGORITHM).update(nonce, "utf8").digest("hex");
}

/**
 * Verify that a plain nonce matches the stored hash
 */
export function verifyNonceHash(nonce: string, storedHash: string): boolean {
  const computedHash = hashNonce(nonce);
  return computedHash === storedHash;
}

/**
 * Create a new nonce and store it in the database
 */
export async function createNonce(context: {
  callbackUrl?: string;
  userAgent?: string;
  ipAddress?: string;
  sessionId?: string;
  ttlSeconds?: number;
}): Promise<{ nonceId: string; nonce: string; ttlSeconds: number }> {
  const nonce = generateNonce();
  const nonceHash = hashNonce(nonce);
  const ttlSeconds = context.ttlSeconds || NONCE_CONFIG.DEFAULT_TTL_SECONDS;
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

  const insertData: NewDBIINonce = {
    nonceHash,
    expiresAt,
    context: {
      callbackUrl: context.callbackUrl,
      userAgent: context.userAgent,
      ipAddress: context.ipAddress,
      sessionId: context.sessionId,
    },
  };

  const [inserted] = await db.insert(iiNonces).values(insertData).returning({ id: iiNonces.id });

  return {
    nonceId: inserted.id,
    nonce,
    ttlSeconds,
  };
}

/**
 * Validate a nonce by ID and plain value
 */
export async function validateNonce(
  nonceId: string,
  nonce: string
): Promise<{
  valid: boolean;
  expired?: boolean;
  used?: boolean;
  context?: NonceContext | null;
}> {
  const record = await db.query.iiNonces.findFirst({
    where: eq(iiNonces.id, nonceId),
  });

  if (!record) {
    return { valid: false };
  }

  // Check if already used
  if (record.usedAt) {
    return { valid: false, used: true, context: record.context };
  }

  // Check if expired
  if (record.expiresAt < new Date()) {
    return { valid: false, expired: true, context: record.context };
  }

  // Verify the nonce hash
  const hashValid = verifyNonceHash(nonce, record.nonceHash);
  if (!hashValid) {
    return { valid: false, context: record.context };
  }

  return { valid: true, context: record.context };
}

/**
 * Mark a nonce as used (consume it)
 */
export async function consumeNonce(nonceId: string): Promise<boolean> {
  const result = await db
    .update(iiNonces)
    .set({ usedAt: new Date() })
    .where(and(eq(iiNonces.id, nonceId), isNull(iiNonces.usedAt)))
    .returning({ id: iiNonces.id });

  return result.length > 0;
}

/**
 * Clean up expired nonces (should be run periodically)
 */
export async function cleanupExpiredNonces(): Promise<number> {
  const result = await db.delete(iiNonces).where(lt(iiNonces.expiresAt, new Date())).returning({ id: iiNonces.id });

  return result.length;
}

/**
 * Get nonce statistics (for monitoring/debugging)
 */
export async function getNonceStats(): Promise<{
  total: number;
  expired: number;
  used: number;
  active: number;
}> {
  const now = new Date();

  const all = await db.query.iiNonces.findMany({
    columns: { id: true, expiresAt: true, usedAt: true },
  });

  const stats = {
    total: all.length,
    expired: 0,
    used: 0,
    active: 0,
  };

  for (const nonce of all) {
    if (nonce.usedAt) {
      stats.used++;
    } else if (nonce.expiresAt < now) {
      stats.expired++;
    } else {
      stats.active++;
    }
  }

  return stats;
}

/**
 * Type definitions for external use
 */
export type NonceContext = {
  callbackUrl?: string;
  userAgent?: string;
  ipAddress?: string;
  sessionId?: string;
  ttlSeconds?: number;
};

export type NonceValidationResult = {
  valid: boolean;
  expired?: boolean;
  used?: boolean;
  context?: NonceContext | null;
};
