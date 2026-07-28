import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

// scrypt, not bcrypt/argon2, on purpose: those are native modules, and this
// project deliberately avoids native compilation (see node:sqlite in db.js) so
// the Alpine image builds with a plain `npm ci`. scrypt is memory-hard and
// listed by OWASP for password storage.
//
// N=65536,r=8,p=1 costs ~67 MB per hash. That is a deliberate trade-off for a
// 512 MB machine: high enough to make offline cracking expensive, low enough
// that a couple of concurrent logins can't exhaust the box. Parameters are
// stored per-hash, so raising them later re-hashes on next login rather than
// invalidating existing passwords.
const N = 65536;
const R = 8;
const P = 1;
const KEY_LEN = 64;
const SALT_LEN = 32;
const MAXMEM = 160 * 1024 * 1024;

export const MIN_PASSWORD_LENGTH = 8;
// Bounded so an attacker can't force arbitrarily large scrypt inputs.
export const MAX_PASSWORD_LENGTH = 200;

const b64 = (buf) => buf.toString("base64");

export async function hashPassword(password) {
  const salt = randomBytes(SALT_LEN);
  const derived = await scryptAsync(password.normalize("NFKC"), salt, KEY_LEN, {
    N, r: R, p: P, maxmem: MAXMEM,
  });
  return `scrypt$${N}$${R}$${P}$${b64(salt)}$${b64(derived)}`;
}

// Constant-time, and tolerant of hashes written with different parameters —
// the cost factors come from the stored string, not from the constants above.
export async function verifyPassword(password, stored) {
  if (typeof stored !== "string") return false;
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const [, n, r, p, saltB64, hashB64] = parts;
  const salt = Buffer.from(saltB64, "base64");
  const expected = Buffer.from(hashB64, "base64");
  if (salt.length === 0 || expected.length === 0) return false;

  let derived;
  try {
    derived = await scryptAsync(password.normalize("NFKC"), salt, expected.length, {
      N: Number(n), r: Number(r), p: Number(p), maxmem: MAXMEM,
    });
  } catch {
    return false;
  }
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

// Burns roughly the same time as a real verification. Called when the email
// doesn't exist so that "no such user" and "wrong password" are
// indistinguishable by response timing.
export async function fakeVerify() {
  await scryptAsync("no-such-user", randomBytes(SALT_LEN), KEY_LEN, {
    N, r: R, p: P, maxmem: MAXMEM,
  });
  return false;
}

export function validatePassword(password) {
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return `Password must be under ${MAX_PASSWORD_LENGTH} characters.`;
  }
  return null;
}

// Deliberately permissive: the only reliable test of an address is sending
// mail to it, and over-strict patterns reject valid addresses.
export function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

export function validateEmail(email) {
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Enter a valid email address.";
  }
  return null;
}
