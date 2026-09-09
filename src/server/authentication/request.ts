import { headers } from "next/headers";

export async function getRequestIp(): Promise<string> {
  const requestHeaders = await headers();
  return getIpFromHeaders(requestHeaders);
}

export function getIpFromHeaders(requestHeaders: Headers): string {
  const forwardedFor = requestHeaders
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  return forwardedFor || requestHeaders.get("x-real-ip") || "unknown";
}
