import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { BrandingService } from "@/server/branding";

const bodyFont = localFont({
  src: "./fonts/PublicSans-VF.ttf",
  variable: "--font-public-sans",
  display: "swap",
  weight: "100 900",
});

const displayFont = localFont({
  src: "./fonts/Bitter-VF.ttf",
  variable: "--font-bitter",
  display: "swap",
  weight: "100 900",
});

export async function generateMetadata(): Promise<Metadata> {
  const branding = await BrandingService.getIdentity();
  return {
    metadataBase: new URL(process.env.APP_URL || "http://localhost:3000"),
    title: {
      default: branding.companyName,
      template: `%s | ${branding.companyShortName}`,
    },
    description: branding.tagline || `Welcome to ${branding.companyName}.`,
    icons: branding.favicon ? { icon: branding.favicon } : undefined,
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${displayFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
