export type PaymentGatewayErrorCode =
  | "PROVIDER_UNAVAILABLE"
  | "INVALID_SIGNATURE"
  | "TRANSACTION_NOT_FOUND"
  | "FAILED_TRANSACTION"
  | "AMOUNT_MISMATCH"
  | "CURRENCY_MISMATCH"
  | "INVALID_BANK_ACCOUNT"
  | "TRANSFER_FAILED"
  | "INVALID_RESPONSE";

export class PaymentGatewayError extends Error {
  constructor(public code: PaymentGatewayErrorCode, message: string) {
    super(message);
    this.name = "PaymentGatewayError";
  }
}

export type PaymentMetadata = { orderId: string; orderReference: string };
export type InitializeTransactionInput = { reference: string; email: string; amountKobo: bigint; currency: "NGN"; callbackUrl: string; metadata: PaymentMetadata };
export type InitializeTransactionResult = { authorizationUrl: string; gatewayReference: string };
export type VerifiedTransaction = { status: "SUCCESS" | "PENDING" | "FAILED"; gatewayReference: string; amountKobo: bigint; currency: string; customerEmail: string | null; metadata: PaymentMetadata | null };
export type PaymentWebhookEvent = { provider: string; eventType: string; gatewayReference: string | null; status: "SUCCESS" | "PENDING" | "FAILED"; amountKobo: bigint | null; currency: string | null; metadata: PaymentMetadata | null; occurredAt: Date | null };
export type BankAccountResolution = { accountName: string; accountNumber: string; bankCode: string };
export type TransferInput = { reference: string; amountKobo: bigint; currency: "NGN"; recipientCode: string; reason?: string };
export type TransferResult = { transferCode: string; reference: string; status: "PENDING" | "SUCCESS" | "FAILED" };

export interface PaymentGateway {
  readonly provider: string;
  initializeTransaction(input: InitializeTransactionInput): Promise<InitializeTransactionResult>;
  verifyTransaction(reference: string): Promise<VerifiedTransaction>;
  verifyWebhookSignature(rawBody: string, signature: string | null): boolean;
  parseWebhook(rawBody: string): PaymentWebhookEvent;
  resolveBankAccount(input: { accountNumber: string; bankCode: string }): Promise<BankAccountResolution>;
  initiateTransfer(input: TransferInput): Promise<TransferResult>;
}
