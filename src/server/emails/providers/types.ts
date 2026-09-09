export type ProviderMessage = {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
};

export type ProviderResult = { messageId: string };

export interface MailProvider {
  readonly name: string;
  send(message: ProviderMessage): Promise<ProviderResult>;
}
