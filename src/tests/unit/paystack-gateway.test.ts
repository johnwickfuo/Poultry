import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

import { PaymentGatewayError, PaystackGateway } from "@/server/payments";

function gateway(payload: unknown, status = 200) {
  const request = vi.fn().mockResolvedValue(new Response(JSON.stringify(payload), { status }));
  return { request, gateway: new PaystackGateway({ secretKey: "test-secret", apiUrl: "https://paystack.test" }, request) };
}

describe("PaystackGateway", () => {
  it("initializes using the server-provided amount and safe order metadata", async () => {
    const { gateway: client, request } = gateway({ status: true, data: { authorization_url: "https://checkout.paystack.test/auth", reference: "PAY-1" } });
    await expect(client.initializeTransaction({ reference: "PAY-1", email: "buyer@example.com", amountKobo: 125_000n, currency: "NGN", callbackUrl: "https://app.test/payment/paystack/callback?reference=PAY-1", metadata: { orderId: "order_1", orderReference: "POU-1" } })).resolves.toEqual({ authorizationUrl: "https://checkout.paystack.test/auth", gatewayReference: "PAY-1" });
    const body = JSON.parse(request.mock.calls[0][1].body as string);
    expect(body.amount).toBe("125000");
    expect(body.metadata).toEqual({ orderId: "order_1", orderReference: "POU-1" });
  });

  it("normalizes a successful verification", async () => {
    const { gateway: client } = gateway({ status: true, data: { status: "success", reference: "PAY-1", amount: 125000, currency: "NGN", customer: { email: "buyer@example.com" }, metadata: { orderId: "order_1", orderReference: "POU-1" } } });
    await expect(client.verifyTransaction("PAY-1")).resolves.toMatchObject({ status: "SUCCESS", gatewayReference: "PAY-1", amountKobo: 125_000n, currency: "NGN" });
  });

  it("reports failed and unavailable gateway responses without exposing provider payloads", async () => {
    const { gateway: missing } = gateway({ status: false, message: "not found" }, 404);
    await expect(missing.verifyTransaction("unknown")).rejects.toMatchObject({ code: "TRANSACTION_NOT_FOUND" });
    const { gateway: unavailable } = gateway({ status: false, message: "gateway down" }, 503);
    await expect(unavailable.verifyTransaction("PAY-1")).rejects.toBeInstanceOf(PaymentGatewayError);
  });

  it("verifies HMAC webhook signatures safely and rejects invalid signatures", () => {
    const { gateway: client } = gateway({});
    const raw = JSON.stringify({ event: "charge.success" });
    const signature = createHmac("sha512", "test-secret").update(raw).digest("hex");
    expect(client.verifyWebhookSignature(raw, signature)).toBe(true);
    expect(client.verifyWebhookSignature(raw, "bad")).toBe(false);
  });
});
