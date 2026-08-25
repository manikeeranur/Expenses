import dbConnect from "@/lib/mongoose";
import BankLink from "@/models/BankLink";
import { getConsentStatus, createDataSession, getDataSession } from "@/lib/setu";
import { syncBankLinkData } from "@/lib/bank-sync";

// Setu doesn't document a signature to verify these webhooks, so instead of
// trusting the POST body directly, every event just triggers us to re-check
// the real status via an authenticated GET before acting on it.
export async function POST(request) {
  const event = await request.json().catch(() => null);
  if (!event) return Response.json({ error: "Invalid payload" }, { status: 400 });

  await dbConnect();

  try {
    if (event.type === "CONSENT_STATUS_UPDATE" && event.consentId) {
      const link = await BankLink.findOne({ consentId: event.consentId });
      if (link) {
        const consent = await getConsentStatus(event.consentId);
        link.consentStatus = consent.status;
        await link.save();

        if (consent.status === "ACTIVE" && !link.dataSessionId) {
          const session = await createDataSession(link.consentId);
          link.dataSessionId = session.id;
          link.dataSessionStatus = session.status;
          await link.save();
        }
      }
    }

    if (event.type === "SESSION_STATUS_UPDATE" && event.dataSessionId) {
      const link = await BankLink.findOne({ dataSessionId: event.dataSessionId });
      if (link) {
        const session = await getDataSession(event.dataSessionId);
        link.dataSessionStatus = session.status;
        await link.save();

        if (session.status === "COMPLETED" || session.status === "PARTIAL") {
          await syncBankLinkData(link, session);
        }
      }
    }
  } catch {
    // Swallow errors here — the manual "Check Status" button in the UI is
    // the reliable fallback path, so a failed webhook re-check shouldn't
    // surface as a hard failure to Setu (which would just retry anyway).
  }

  return Response.json({ received: true });
}
