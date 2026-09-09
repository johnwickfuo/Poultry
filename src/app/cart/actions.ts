"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { acceptCurrentCartPrices, addCartItem, CartError, clearCart, getRequestCart, removeCartItem, updateCartItem } from "@/server/cart";
import { addCartItemSchema, cartItemIdSchema, priceAcknowledgementSchema, updateCartItemSchema } from "@/server/validation/cart";

export type CartActionState = { status: "idle" | "success" | "error"; message?: string };

function refreshCart() { revalidatePath("/cart"); revalidatePath("/checkout"); revalidatePath("/marketplace", "layout"); }
function messageFrom(error: unknown) { return error instanceof CartError ? error.message : "The cart could not be updated. Please try again."; }
function cartRedirect(message: string, error = false): never { refreshCart(); redirect(`/cart?${error ? "error" : "message"}=${encodeURIComponent(message)}`); }

export async function addToCartAction(_state: CartActionState, formData: FormData): Promise<CartActionState> {
  const parsed = addCartItemSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { status: "error", message: "Choose a valid variant and quantity." };
  try {
    const cart = await getRequestCart(true);
    if (!cart) return { status: "error", message: "Unable to start a cart." };
    await addCartItem(cart.id, parsed.data.productId, parsed.data.variantId, parsed.data.quantity);
    refreshCart();
    return { status: "success", message: "Added to cart." };
  } catch (error) { return { status: "error", message: messageFrom(error) }; }
}

export async function updateCartItemAction(formData: FormData) {
  const parsed = updateCartItemSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) cartRedirect("Enter a valid whole-number quantity.", true);
  try { const cart = await getRequestCart(false); if (!cart) throw new CartError("NOT_FOUND", "Cart not found."); await updateCartItem(cart.id, parsed.data.itemId, parsed.data.quantity); }
  catch (error) { cartRedirect(messageFrom(error), true); }
  cartRedirect("Quantity updated.");
}

export async function removeCartItemAction(formData: FormData) {
  const parsed = cartItemIdSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) cartRedirect("Cart item not found.", true);
  const cart = await getRequestCart(false);
  if (!cart) cartRedirect("Cart not found.", true);
  await removeCartItem(cart.id, parsed.data.itemId);
  cartRedirect("Item removed.");
}

export async function clearCartAction() {
  const cart = await getRequestCart(false);
  if (cart) await clearCart(cart.id);
  cartRedirect("Cart cleared.");
}

export async function acknowledgePriceChangesAction(formData: FormData) {
  const parsed = priceAcknowledgementSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) redirect(`/checkout?error=${encodeURIComponent("Confirm that you accept the current prices before continuing.")}`);
  const cart = await getRequestCart(false);
  if (!cart) redirect("/cart");
  try { await acceptCurrentCartPrices(cart.id); }
  catch (error) { redirect(`/checkout?error=${encodeURIComponent(messageFrom(error))}`); }
  refreshCart();
  redirect("/checkout?repriced=1");
}
