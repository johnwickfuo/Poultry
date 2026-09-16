import type { Metadata } from "next";
import Link from "next/link";

import { Card, Money, StatusBadge } from "@/components";
import { requireUser } from "@/server/authorization";
import { PaymentGatewayError, PaymentServiceError, getPaymentResultForBuyer } from "@/server/payments";

export const metadata: Metadata = { title: "Payment result", robots: { index: false, follow: false } };
type Result = Awaited<ReturnType<typeof getPaymentResultForBuyer>>;

function Pending({ message }: { message: string }) { return <section className="mx-auto max-w-xl"><Card className="p-6"><h1 className="font-display text-2xl font-bold text-coop">Payment confirmation pending</h1><p className="mt-3 text-sm leading-6 text-coop/65">{message} No order status was changed from this page.</p><Link className="mt-5 inline-block font-bold text-palm hover:underline" href="/account/orders">View orders</Link></Card></section>; }
function ResultCard({ result }: { result: Result }) { return <section className="mx-auto max-w-xl"><Card className="p-6"><div className="flex items-center justify-between gap-4"><div><p className="market-label text-sack">Paystack result</p><h1 className="mt-2 font-display text-3xl font-black text-coop">Payment received</h1></div><StatusBadge status="pending"/></div><p className="mt-4 text-sm leading-6 text-coop/65">{result.gatewayStatus === "SUCCESS" ? "Your payment is awaiting secure webhook confirmation. Your order has not been marked paid from this browser page." : "Paystack has not confirmed this payment yet. You can safely return to your order."}</p><div className="mt-6 rounded-control bg-eggshell p-4 text-sm"><p><span className="text-coop/50">Order:</span> {result.orderReference}</p><p className="mt-2"><span className="text-coop/50">Amount:</span> <Money amount={Number(result.amountKobo) / 100}/></p></div><Link className="mt-6 inline-block font-bold text-palm hover:underline" href={`/account/orders/${result.orderReference}`}>View order</Link></Card></section>; }

export default async function PaystackCallbackPage({ searchParams }: { searchParams: Promise<{ reference?: string }> }) {
  const [user, query] = await Promise.all([requireUser(), searchParams]);
  if (!query.reference) return <Pending message="Payment reference missing."/>;
  let result: Result | null = null;
  let errorMessage: string | null = null;
  try { result = await getPaymentResultForBuyer(user.id, query.reference); }
  catch (error) { errorMessage = error instanceof PaymentGatewayError || error instanceof PaymentServiceError ? error.message : "We could not confirm this payment yet."; }
  return result ? <ResultCard result={result}/> : <Pending message={errorMessage || "We could not confirm this payment yet."}/>;
}
