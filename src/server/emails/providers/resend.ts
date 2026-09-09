import type { MailProvider, ProviderMessage, ProviderResult } from "./types";

export class ResendMailProvider implements MailProvider {
  readonly name = "resend";

  constructor(private readonly apiKey: string) {}

  async send(message: ProviderMessage): Promise<ProviderResult> {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": message.idempotencyKey,
      },
      body: JSON.stringify({
        from: message.from,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
    });
    const payload = (await response.json().catch(() => ({}))) as { id?: string; message?: string };

    if (!response.ok || !payload.id) {
      throw new Error(payload.message || `Resend rejected the request (${response.status}).`);
    }

    return { messageId: payload.id };
  }
}
