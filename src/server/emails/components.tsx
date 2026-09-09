/* eslint-disable @next/next/no-head-element, @next/next/no-img-element -- standalone email HTML cannot use Next page components */
import type { ReactNode } from "react";

export type EmailBranding = {
  companyName: string;
  companyShortName: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  logoUrl: string;
};

const colors = {
  palm: "#176B45",
  coop: "#20251F",
  yolk: "#F2B544",
  eggshell: "#FFF8E8",
  muted: "#667064",
};

export function EmailLayout({ branding, previewText, children }: { branding: EmailBranding; previewText: string; children: ReactNode }) {
  return <html lang="en"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>{previewText}</title></head><body style={{ margin: 0, backgroundColor: colors.eggshell, color: colors.coop, fontFamily: "Arial, Helvetica, sans-serif" }}><div style={{ display: "none", maxHeight: 0, overflow: "hidden", opacity: 0 }}>{previewText}</div><table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style={{ backgroundColor: colors.eggshell }}><tbody><tr><td align="center" style={{ padding: "32px 16px" }}><table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style={{ maxWidth: 600, backgroundColor: "#ffffff", border: "1px solid #e3dfd2", borderRadius: 16, overflow: "hidden" }}><tbody><tr><td style={{ backgroundColor: colors.coop, padding: "24px 32px" }}>{branding.logoUrl ? <img alt={branding.companyName} src={branding.logoUrl} width="150" style={{ display: "block", height: "auto", maxHeight: 48, maxWidth: 150 }}/>: <div style={{ color: "#ffffff", fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700 }}>{branding.companyShortName}</div>}<div style={{ height: 3, width: 56, marginTop: 14, backgroundColor: colors.yolk }}/></td></tr><tr><td style={{ padding: "36px 32px 12px" }}>{children}</td></tr><tr><td style={{ padding: "20px 32px 32px" }}><EmailFooter branding={branding}/></td></tr></tbody></table></td></tr></tbody></table></body></html>;
}

export function EmailHeading({ children }: { children: ReactNode }) {
  return <h1 style={{ margin: "0 0 18px", color: colors.coop, fontFamily: "Georgia, serif", fontSize: 30, lineHeight: 1.2 }}>{children}</h1>;
}

export function EmailBody({ children }: { children: ReactNode }) {
  return <p style={{ margin: "0 0 18px", color: colors.muted, fontSize: 16, lineHeight: 1.65 }}>{children}</p>;
}

export function EmailButton({ href, children }: { href: string; children: ReactNode }) {
  return <table role="presentation" cellPadding="0" cellSpacing="0" style={{ margin: "26px 0" }}><tbody><tr><td style={{ borderRadius: 8, backgroundColor: colors.palm }}><a href={href} style={{ display: "inline-block", padding: "13px 22px", color: "#ffffff", fontSize: 15, fontWeight: 700, textDecoration: "none" }}>{children}</a></td></tr></tbody></table>;
}

export function EmailDetailTable({ rows }: { rows: Array<{ label: string; value: string }> }) {
  return <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style={{ margin: "24px 0", border: "1px solid #e3dfd2", borderRadius: 10, overflow: "hidden" }}><tbody>{rows.map((row, index) => <tr key={row.label}><td style={{ width: "38%", padding: "11px 14px", borderBottom: index === rows.length - 1 ? undefined : "1px solid #eee9da", backgroundColor: "#fffaf0", color: colors.muted, fontSize: 13, fontWeight: 700 }}>{row.label}</td><td style={{ padding: "11px 14px", borderBottom: index === rows.length - 1 ? undefined : "1px solid #eee9da", color: colors.coop, fontSize: 13 }}>{row.value}</td></tr>)}</tbody></table>;
}

export function EmailFooter({ branding }: { branding: EmailBranding }) {
  const contact = [branding.email, branding.phone, branding.address].filter(Boolean).join(" · ");
  return <div style={{ borderTop: "1px solid #eee9da", paddingTop: 20, color: "#7a8177", fontSize: 12, lineHeight: 1.6 }}><p style={{ margin: "0 0 6px", color: colors.coop, fontWeight: 700 }}>{branding.companyName}</p>{branding.tagline ? <p style={{ margin: "0 0 6px" }}>{branding.tagline}</p> : null}{contact ? <p style={{ margin: 0 }}>{contact}</p> : null}</div>;
}
