import { auth } from "@/server/authentication";
import { prisma } from "@/server/database/prisma";
import { createGuestCart, findCartByGuestHash, findCartByUser, createUserCart, mergeGuestCartIntoUser, reviewCart } from "./cart-service";
import { clearGuestCartCookie, createGuestCartToken, hashGuestCartToken, readGuestCartToken } from "./guest-token";

async function getRequestCartOwner(create: boolean) {
  const session = await auth();
  if (session?.user?.id) return { kind: "user", userId: session.user.id } as const;
  let token = await readGuestCartToken();
  if (!token && create) token = await createGuestCartToken();
  if (!token) return null;
  return { kind: "guest", guestTokenHash: hashGuestCartToken(token) } as const;
}

export async function getRequestCart(create = false) {
  const owner = await getRequestCartOwner(create);
  if (!owner) return null;
  if (owner.kind === "user") return create ? createUserCart(owner.userId) : findCartByUser(owner.userId);
  return create ? createGuestCart(owner.guestTokenHash) : findCartByGuestHash(owner.guestTokenHash);
}

export async function getRequestCartReview() {
  const cart = await getRequestCart(false);
  return cart ? reviewCart(cart.id) : null;
}

export async function getRequestCartCount() {
  const owner = await getRequestCartOwner(false);
  if (!owner) return 0;
  const cart = owner.kind === "user"
    ? await prisma.cart.findUnique({ where: { userId: owner.userId }, select: { items: { select: { quantity: true } } } })
    : await prisma.cart.findUnique({ where: { guestTokenHash: owner.guestTokenHash }, select: { items: { select: { quantity: true } } } });
  return cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;
}

export async function mergeRequestGuestCart(userId: string) {
  const token = await readGuestCartToken();
  if (!token) return false;
  await mergeGuestCartIntoUser(userId, hashGuestCartToken(token));
  await clearGuestCartCookie();
  return true;
}
