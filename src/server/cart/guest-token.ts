import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const GUEST_CART_COOKIE = "poultry_guest_cart";
const THIRTY_DAYS = 30 * 24 * 60 * 60;

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) throw new Error("AUTH_SECRET must be configured for guest carts.");
  return value;
}

export function hashGuestCartToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function signGuestCartToken(token: string) {
  const signature = createHmac("sha256", secret()).update(token).digest("base64url");
  return `${token}.${signature}`;
}

export function verifyGuestCartCookie(value?: string) {
  if (!value) return null;
  const [token, signature, extra] = value.split(".");
  if (extra || !token || !signature || !/^[A-Za-z0-9_-]{40,60}$/.test(token)) return null;
  const expected = createHmac("sha256", secret()).update(token).digest();
  let supplied: Buffer;
  try { supplied = Buffer.from(signature, "base64url"); } catch { return null; }
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;
  return token;
}

export async function readGuestCartToken() {
  return verifyGuestCartCookie((await cookies()).get(GUEST_CART_COOKIE)?.value);
}

export async function createGuestCartToken() {
  const token = randomBytes(32).toString("base64url");
  (await cookies()).set(GUEST_CART_COOKIE, signGuestCartToken(token), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: THIRTY_DAYS, priority: "high" });
  return token;
}

export async function clearGuestCartCookie() {
  (await cookies()).delete(GUEST_CART_COOKIE);
}
