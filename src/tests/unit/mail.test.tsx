import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { EmailBranding } from "@/server/emails/components";
import { ResendMailProvider } from "@/server/emails/providers/resend";
import { buildEmailTemplate } from "@/server/emails/templates";

const branding: EmailBranding = {
  companyName: "Example Poultry Limited",
  companyShortName: "Example Poultry",
  tagline: "Practical poultry commerce",
  email: "support@example.test",
  phone: "+234 800 000 0000",
  address: "Lagos, Nigeria",
  logoUrl: "https://example.test/logo.png",
};

afterEach(() => vi.unstubAllGlobals());

describe("branded email templates", () => {
  it("renders verification content with company identity and reusable components", () => {
    const template = buildEmailTemplate("verification", { actionUrl: "https://example.test/verify?token=safe", recipientName: "Amina" }, branding);
    const html = renderToStaticMarkup(template.element);

    expect(template.subject).toContain("Example Poultry");
    expect(template.text).toContain("https://example.test/verify?token=safe");
    expect(html).toContain("Verify your email address");
    expect(html).toContain("Example Poultry Limited");
    expect(html).toContain("Link validity");
  });

  it("renders the one-hour password reset security details", () => {
    const template = buildEmailTemplate("password_reset", { actionUrl: "https://example.test/reset" }, branding);
    expect(template.text).toContain("expires in 1 hour");
    expect(renderToStaticMarkup(template.element)).toContain("The link can only be used once");
  });
});

describe("Resend provider adapter", () => {
  it("sends through the Resend HTTP API and returns the provider id", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "mail_123" }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    const provider = new ResendMailProvider("re_test_key");

    await expect(provider.send({ from: "Sender <sender@example.test>", to: "user@example.test", subject: "Test", html: "<p>Test</p>", text: "Test", idempotencyKey: "delivery_test" })).resolves.toEqual({ messageId: "mail_123" });
    expect(fetchMock).toHaveBeenCalledWith("https://api.resend.com/emails", expect.objectContaining({ method: "POST", headers: expect.objectContaining({ Authorization: "Bearer re_test_key", "Idempotency-Key": "delivery_test" }) }));
  });

  it("rejects provider errors without treating them as delivered", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: "Invalid sender" }), { status: 422, headers: { "Content-Type": "application/json" } })));
    const provider = new ResendMailProvider("re_test_key");

    await expect(provider.send({ from: "bad", to: "user@example.test", subject: "Test", html: "<p>Test</p>", text: "Test", idempotencyKey: "delivery_failed" })).rejects.toThrow("Invalid sender");
  });
});
