import dbConnect from "@/lib/mongoose";
import BankLink from "@/models/BankLink";
import { getConsentStatus, createDataSession, getDataSession } from "@/lib/setu";
import { syncBankLinkData } from "@/lib/bank-sync";

// Configure this URL (https://yourdomain.com/api/webhooks/setu) in the Setu
// Bridge dashboard for AA notifications.
//
// Setu doesn't document a signature to verify these webhooks, so instead of
// trusting the POST body directly, every event just triggers us to re-check
// the real status via an authenticated GET before acting on it. Every step
// below is also naturally idempotent — re-checking a status that hasn't
// changed, or re-running a sync whose transactions already exist (blocked by
// the unique index on userId+accountId+reference), is a safe no-op — so a
// webhook retry or duplicate delivery from Setu never double-imports data.
export async function POST(request) {
  const event = await request.json().catch(() => null);
  if (!event) return Response.json({ error: "Invalid payload" }, { status: 400 });

  console.log(`[Setu webhook] received type=${event.type} consentId=${event.consentId || "-"} dataSessionId=${event.dataSessionId || "-"}`);

  await dbConnect();

  try {
    if (event.type === "CONSENT_STATUS_UPDATE" && event.consentId) {
      const link = await BankLink.findOne({ consentId: event.consentId });
      if (link) {
        const consent = await getConsentStatus(event.consentId);
        link.consentStatus = consent.status;
        await link.save();
        console.log(`[Setu webhook] consentId=${event.consentId} -> ${consent.status}`);

        if (consent.status === "ACTIVE" && !link.dataSessionId) {
          const session = await createDataSession(link.consentId, link.consentDataRange);
          link.dataSessionId = session.id;
          link.dataSessionStatus = session.status;
          await link.save();
          console.log(`[Setu webhook] started dataSessionId=${session.id} for consentId=${event.consentId}`);
        }
      }
    }

    if (event.type === "SESSION_STATUS_UPDATE" && event.dataSessionId) {
      const link = await BankLink.findOne({ dataSessionId: event.dataSessionId });
      if (link) {
        const session = await getDataSession(event.dataSessionId);
        link.dataSessionStatus = session.status;
        await link.save();
        console.log(`[Setu webhook] dataSessionId=${event.dataSessionId} -> ${session.status}`);

        if (session.status === "COMPLETED" || session.status === "PARTIAL") {
          const result = await syncBankLinkData(link, session);
          console.log(
            `[Setu webhook] dataSessionId=${event.dataSessionId} imported=${result.imported} duplicates=${result.duplicates}`
          );
        } else if (session.status === "FAILED") {
          console.error(`[Setu webhook] dataSessionId=${event.dataSessionId} fetch FAILED`);
        }
      }
    }
  } catch (err) {
    // Swallow errors here — the manual "Sync" button in the UI is the
    // reliable fallback path, so a failed webhook re-check shouldn't
    // surface as a hard failure to Setu (which would just retry anyway).
    console.error("[Setu webhook] processing failed:", err.message);
  }

  return Response.json({ received: true });
}
