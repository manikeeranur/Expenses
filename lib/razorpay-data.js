import "server-only";
import { getRazorpay } from "@/lib/razorpay";

export async function getOndemandSettlements() {
  const razorpay = getRazorpay();
  try {
    const result = await razorpay.settlements.fetchAllOndemandSettlement({ count: 10 });
    return result?.items || [];
  } catch {
    return [];
  }
}
