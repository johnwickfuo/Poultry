import type { Metadata } from "next";
import { Bitter, Public_Sans } from "next/font/google";
import "./globals.css";
import { BrandingService } from "@/server/branding";

const bodyFont = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
});

const displayFont = Bitter({
  variable: "--font-bitter",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const branding = await BrandingService.getIdentity();
  return {
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
