import { PaystackGateway, PaymentGatewayError } from "@/server/payments";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const gateway = new PaystackGateway();
  if (!gateway.verifyWebhookSignature(rawBody, request.headers.get("x-paystack-signature"))) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }
  try {
    gateway.parseWebhook(rawBody);
    // Phase 3F will centrally process the normalized event and change order state idempotently.
    return new Response(null, { status: 204 });
  } catch (error) {
    return Response.json({ error: error instanceof PaymentGatewayError ? "Invalid webhook payload" : "Webhook rejected" }, { status: 400 });
  }
}
