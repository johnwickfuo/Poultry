import { createHmac, timingSafeEqual } from "node:crypto";

import { PaymentGatewayError, type BankAccountResolution, type InitializeTransactionInput, type InitializeTransactionResult, type PaymentGateway, type PaymentMetadata, type PaymentWebhookEvent, type TransferInput, type TransferResult, type VerifiedTransaction } from "./payment-gateway";

type FetchLike = typeof fetch;
type PaystackConfig = { secretKey: string; apiUrl: string };

export function getPaystackConfig(environment = process.env): PaystackConfig {
  const secretKey = environment.PAYSTACK_SECRET_KEY?.trim();
  if (!secretKey) throw new PaymentGatewayError("PROVIDER_UNAVAILABLE", "Paystack is not configured.");
  return { secretKey, apiUrl: "https://api.paystack.co" };
}

function asObject(value: unknown): Record<string, unknown> | null { return typeof value === "object" && value !== null ? value as Record<string, unknown> : null; }
function asString(value: unknown): string | null { return typeof value === "string" && value.trim() ? value : null; }
function asPositiveInteger(value: unknown): bigint | null { return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? BigInt(value) : null; }
function paymentMetadata(value: unknown): PaymentMetadata | null { const data = asObject(value); const orderId = asString(data?.orderId); const orderReference = asString(data?.orderReference); return orderId && orderReference ? { orderId, orderReference } : null; }
function status(value: unknown): "SUCCESS" | "PENDING" | "FAILED" { return value === "success" ? "SUCCESS" : value === "pending" || value === "ongoing" ? "PENDING" : "FAILED"; }

export class PaystackGateway implements PaymentGateway {
  readonly provider = "paystack";
  constructor(private readonly config: PaystackConfig = getPaystackConfig(), private readonly request: FetchLike = fetch) {}

  private async call(path: string, init?: RequestInit) {
    let response: Response;
    try { response = await this.request(`${this.config.apiUrl}${path}`, { ...init, headers: { Authorization: `Bearer ${this.config.secretKey}`, "Content-Type": "application/json", ...init?.headers } }); }
    catch { throw new PaymentGatewayError("PROVIDER_UNAVAILABLE", "Paystack is temporarily unavailable."); }
    let payload: unknown;
    try { payload = await response.json(); } catch { throw new PaymentGatewayError("INVALID_RESPONSE", "Paystack returned an invalid response."); }
    const body = asObject(payload);
    if (!response.ok || body?.status !== true) {
      const message = asString(body?.message) || "Paystack could not complete this request.";
      if (response.status === 404) throw new PaymentGatewayError("TRANSACTION_NOT_FOUND", "Paystack transaction was not found.");
      throw new PaymentGatewayError("PROVIDER_UNAVAILABLE", message);
    }
    return body.data;
  }

  async initializeTransaction(input: InitializeTransactionInput): Promise<InitializeTransactionResult> {
    if (input.amountKobo <= 0n) throw new PaymentGatewayError("INVALID_RESPONSE", "Payment amount must be greater than zero.");
    const data = asObject(await this.call("/transaction/initialize", { method: "POST", body: JSON.stringify({ email: input.email, amount: input.amountKobo.toString(), currency: input.currency, reference: input.reference, callback_url: input.callbackUrl, metadata: input.metadata }) }));
    const authorizationUrl = asString(data?.authorization_url); const gatewayReference = asString(data?.reference);
    if (!authorizationUrl || !gatewayReference) throw new PaymentGatewayError("INVALID_RESPONSE", "Paystack did not return an authorization URL.");
    return { authorizationUrl, gatewayReference };
  }

  async verifyTransaction(reference: string): Promise<VerifiedTransaction> {
    const data = asObject(await this.call(`/transaction/verify/${encodeURIComponent(reference)}`));
    const gatewayReference = asString(data?.reference); const amountKobo = asPositiveInteger(data?.amount); const currency = asString(data?.currency);
    if (!gatewayReference || amountKobo === null || !currency) throw new PaymentGatewayError("INVALID_RESPONSE", "Paystack returned incomplete transaction data.");
    const customer = asObject(data?.customer);
    return { status: status(data?.status), gatewayReference, amountKobo, currency, customerEmail: asString(customer?.email), metadata: paymentMetadata(data?.metadata) };
  }

  verifyWebhookSignature(rawBody: string, signature: string | null) {
    if (!signature || !/^[a-f0-9]{128}$/i.test(signature)) return false;
    const expected = createHmac("sha512", this.config.secretKey).update(rawBody).digest("hex");
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
  }

  parseWebhook(rawBody: string): PaymentWebhookEvent {
    let payload: unknown; try { payload = JSON.parse(rawBody); } catch { throw new PaymentGatewayError("INVALID_RESPONSE", "Paystack webhook payload is invalid."); }
    const body = asObject(payload); const data = asObject(body?.data); const eventType = asString(body?.event);
    if (!eventType) throw new PaymentGatewayError("INVALID_RESPONSE", "Paystack webhook event is invalid.");
    const occurredAtString = asString(data?.paid_at) || asString(data?.created_at);
    const occurredAt = occurredAtString ? new Date(occurredAtString) : null;
    return { provider: this.provider, eventType, gatewayReference: asString(data?.reference), status: status(data?.status), amountKobo: asPositiveInteger(data?.amount), currency: asString(data?.currency), metadata: paymentMetadata(data?.metadata), occurredAt: occurredAt && !Number.isNaN(occurredAt.getTime()) ? occurredAt : null };
  }

  async resolveBankAccount(input: { accountNumber: string; bankCode: string }): Promise<BankAccountResolution> {
    let response: unknown;
    try { response = await this.call(`/bank/resolve?account_number=${encodeURIComponent(input.accountNumber)}&bank_code=${encodeURIComponent(input.bankCode)}`); }
    catch (error) {
      if (error instanceof PaymentGatewayError && error.code === "PROVIDER_UNAVAILABLE") throw new PaymentGatewayError("INVALID_BANK_ACCOUNT", "Paystack could not validate this bank account.");
      throw error;
    }
    const data = asObject(response);
    const accountName = asString(data?.account_name); const accountNumber = asString(data?.account_number);
    if (!accountName || !accountNumber) throw new PaymentGatewayError("INVALID_BANK_ACCOUNT", "Paystack could not validate this bank account.");
    return { accountName, accountNumber, bankCode: input.bankCode };
  }

  async initiateTransfer(input: TransferInput): Promise<TransferResult> {
    if (input.amountKobo <= 0n) throw new PaymentGatewayError("TRANSFER_FAILED", "Transfer amount must be greater than zero.");
    let response: unknown;
    try { response = await this.call("/transfer", { method: "POST", body: JSON.stringify({ source: "balance", amount: input.amountKobo.toString(), recipient: input.recipientCode, reason: input.reason, reference: input.reference, currency: input.currency }) }); }
    catch (error) {
      if (error instanceof PaymentGatewayError) throw new PaymentGatewayError("TRANSFER_FAILED", "Paystack could not initiate this transfer.");
      throw error;
    }
    const data = asObject(response);
    const transferCode = asString(data?.transfer_code); const reference = asString(data?.reference);
    if (!transferCode || !reference) throw new PaymentGatewayError("TRANSFER_FAILED", "Paystack did not return transfer details.");
    return { transferCode, reference, status: status(data?.status) === "SUCCESS" ? "SUCCESS" : status(data?.status) === "PENDING" ? "PENDING" : "FAILED" };
  }
}
