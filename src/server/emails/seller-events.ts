import "server-only";

import { parseServerEnv } from "@/server/validation/env";
import { MailService } from "./mail-service";

type SellerRecipient = { id: string; email: string; name?: string | null; businessName: string };

async function send(template: "seller_application_submitted" | "seller_application_approved" | "seller_application_rejected", recipient: SellerRecipient, rejectionReason?: string | null) {
  const actionUrl = new URL(template === "seller_application_submitted" ? "/seller" : "/seller", parseServerEnv().APP_URL).toString();
  return MailService.sendTemplate({
    to: recipient.email,
    userId: recipient.id,
    template,
    data: { actionUrl, recipientName: recipient.name || undefined, businessName: recipient.businessName, rejectionReason: rejectionReason || undefined },
  });
}

export const SellerMailHooks = {
  submitted: (recipient: SellerRecipient) => send("seller_application_submitted", recipient),
  approved: (recipient: SellerRecipient) => send("seller_application_approved", recipient),
  rejected: (recipient: SellerRecipient, reason: string) => send("seller_application_rejected", recipient, reason),
};
