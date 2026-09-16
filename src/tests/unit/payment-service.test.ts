import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  order: { findFirst: vi.fn() },
  paymentTransaction: { create: vi.fn(), update: vi.fn(), findFirst: vi.fn() },
}));
vi.mock("@/server/database/prisma", () => ({ prisma: mocks }));

import { getPaymentResultForBuyer, initializeOrderPayment } from "@/server/payments";
import type { PaymentGateway } from "@/server/payments";

const order = { id: "order_1", reference: "POU-1", userId: "buyer_1", grandTotalKobo: 125_000n, subtotalKobo: 100_000n, deliveryTotalKobo: 25_000n, currency: "NGN", status: "PENDING_PAYMENT", paymentGateway: "paystack", subOrders: [{ subtotalKobo: 100_000n, deliveryFeeKobo: 25_000n, status: "PENDING" }], user: { email: "buyer@example.com" } };
const paymentGateway: PaymentGateway = { provider: "paystack", initializeTransaction: vi.fn().mockResolvedValue({ authorizationUrl: "https://paystack.test/auth", gatewayReference: "PAY-1" }), verifyTransaction: vi.fn(), verifyWebhookSignature: vi.fn(), parseWebhook: vi.fn(), resolveBankAccount: vi.fn(), initiateTransfer: vi.fn() };

beforeEach(() => { vi.clearAllMocks(); process.env.APP_URL = "https://app.test"; mocks.order.findFirst.mockResolvedValue(order); mocks.paymentTransaction.create.mockResolvedValue({ id: "attempt_1" }); mocks.paymentTransaction.update.mockResolvedValue({}); });

describe("order payment initialization", () => {
  it("uses the payable order total, never a browser amount", async () => {
    await initializeOrderPayment("buyer_1", "POU-1", paymentGateway);
    expect(paymentGateway.initializeTransaction).toHaveBeenCalledWith(expect.objectContaining({ amountKobo: 125_000n, email: "buyer@example.com", metadata: { orderId: "order_1", orderReference: "POU-1" } }));
  });

  it("does not initialize payment for another buyer or an invalid order", async () => {
    mocks.order.findFirst.mockResolvedValue(null);
    await expect(initializeOrderPayment("buyer_2", "POU-1", paymentGateway)).rejects.toMatchObject({ code: "ORDER_NOT_FOUND" });
    mocks.order.findFirst.mockResolvedValue({ ...order, status: "PAID" });
    await expect(initializeOrderPayment("buyer_1", "POU-1", paymentGateway)).rejects.toMatchObject({ code: "ORDER_NOT_PAYABLE" });
  });
});

describe("server-side verification", () => {
  beforeEach(() => { mocks.paymentTransaction.findFirst.mockResolvedValue({ internalReference: "PAY-1", gatewayReference: "PAY-1", order: { id: "order_1", reference: "POU-1", grandTotalKobo: 125_000n, currency: "NGN", status: "PENDING_PAYMENT" } }); });
  it("accepts an exact successful gateway transaction without changing the order", async () => {
    vi.mocked(paymentGateway.verifyTransaction).mockResolvedValue({ status: "SUCCESS", gatewayReference: "PAY-1", amountKobo: 125_000n, currency: "NGN", customerEmail: "buyer@example.com", metadata: { orderId: "order_1", orderReference: "POU-1" } });
    await expect(getPaymentResultForBuyer("buyer_1", "PAY-1", paymentGateway)).resolves.toMatchObject({ gatewayStatus: "SUCCESS", orderStatus: "PENDING_PAYMENT" });
    expect(mocks.order).not.toHaveProperty("update");
  });
  it("rejects failed, amount-mismatched and currency-mismatched transactions", async () => {
    vi.mocked(paymentGateway.verifyTransaction).mockResolvedValue({ status: "FAILED", gatewayReference: "PAY-1", amountKobo: 125_000n, currency: "NGN", customerEmail: null, metadata: null });
    await expect(getPaymentResultForBuyer("buyer_1", "PAY-1", paymentGateway)).rejects.toMatchObject({ code: "FAILED_TRANSACTION" });
    vi.mocked(paymentGateway.verifyTransaction).mockResolvedValue({ status: "SUCCESS", gatewayReference: "PAY-1", amountKobo: 124_999n, currency: "NGN", customerEmail: null, metadata: null });
    await expect(getPaymentResultForBuyer("buyer_1", "PAY-1", paymentGateway)).rejects.toMatchObject({ code: "AMOUNT_MISMATCH" });
    vi.mocked(paymentGateway.verifyTransaction).mockResolvedValue({ status: "SUCCESS", gatewayReference: "PAY-1", amountKobo: 125_000n, currency: "USD", customerEmail: null, metadata: null });
    await expect(getPaymentResultForBuyer("buyer_1", "PAY-1", paymentGateway)).rejects.toMatchObject({ code: "CURRENCY_MISMATCH" });
  });
});
