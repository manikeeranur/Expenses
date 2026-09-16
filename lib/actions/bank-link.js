"use server";

import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/mongoose";
import BankLink from "@/models/BankLink";
import { requireUserId } from "@/lib/session";
import { checkAccountAvailability, createConsent, getConsentStatus, createDataSession, getDataSession } from "@/lib/setu";
import { syncBankLinkData } from "@/lib/bank-sync";

const SANDBOX_TEST_NUMBER = "9999999999";

export async function checkMobileNumber(prevState, formData) {
  await requireUserId();
  const mobileNumber = formData.get("mobileNumber")?.toString().trim();

  if (!mobileNumber || !/^\d{10}$/.test(mobileNumber)) {
    return { error: "Enter a valid 10-digit mobile number." };
  }

  try {
    const accounts = await checkAccountAvailability(mobileNumber);
    let found = accounts.filter((a) => a.status);
    let lookupNumber = mobileNumber;
    let usedFallback = false;

    if (!found.length && process.env.SETU_ENV !== "production" && mobileNumber !== SANDBOX_TEST_NUMBER) {
      const fallbackAccounts = await checkAccountAvailability(SANDBOX_TEST_NUMBER);
      const fallbackFound = fallbackAccounts.filter((a) => a.status);
      if (fallbackFound.length) {
        found = fallbackFound;
        lookupNumber = SANDBOX_TEST_NUMBER;
        usedFallback = true;
      }
    }

    if (!found.length) {
      return { error: "No accounts found linked to this number with any Account Aggregator." };
    }
    return { success: true, mobileNumber: lookupNumber, accounts: found, usedFallback };
  } catch (err) {
    console.error("[Setu] account-availability check failed:", err.message);
    return { error: err.message || "Could not check this number right now." };
  }
}

export async function startBankLinkConsent(mobileNumber, aa, vua) {
  const userId = await requireUserId();
  await dbConnect();

  const baseUrl = process.env.NEXTAUTH_URL || "";
  let consent;
  try {
    consent = await createConsent(vua, `${baseUrl}/accounts/setu/callback`);
  } catch (err) {
    console.error("[Setu] consent creation failed:", err.message);
    return { error: err.message || "Could not start the consent request." };
  }

  const link = await BankLink.create({
    userId,
    mobileNumber,
    aa,
    vua,
    consentId: consent.id,
    consentStatus: consent.status,
    consentDataRange: consent.detail?.dataRange || null,
  });

  return { success: true, approvalUrl: consent.url, bankLinkId: link._id.toString() };
}

export async function checkBankLinkStatus(bankLinkId) {
  const userId = await requireUserId();
  await dbConnect();
  const link = await BankLink.findOne({ _id: bankLinkId, userId });
  if (!link) return { error: "Link request not found." };

  try {
    if (link.consentStatus !== "ACTIVE" && link.consentId) {
      const consent = await getConsentStatus(link.consentId);
      link.consentStatus = consent.status;
      await link.save();
      console.log(`[Setu] consentId=${link.consentId} status=${consent.status}`);
    }

    if (link.consentStatus === "ACTIVE" && !link.dataSessionId) {
      const session = await createDataSession(link.consentId, link.consentDataRange);
      link.dataSessionId = session.id;
      link.dataSessionStatus = session.status;
      await link.save();
      console.log(`[Setu] dataSessionId=${session.id} started for consentId=${link.consentId}`);
    }

    if (link.dataSessionId && link.dataSessionStatus !== "COMPLETED") {
      const session = await getDataSession(link.dataSessionId);
      link.dataSessionStatus = session.status;
      await link.save();

      if (session.status === "COMPLETED" || session.status === "PARTIAL") {
        console.log(`[Setu] dataSessionId=${link.dataSessionId} fetch ${session.status}, importing…`);
        await syncBankLinkData(link, session);
      } else if (session.status === "FAILED") {
        console.error(`[Setu] dataSessionId=${link.dataSessionId} fetch FAILED`);
      }
    }

    revalidatePath("/accounts");
    return {
      success: true,
      consentStatus: link.consentStatus,
      dataSessionStatus: link.dataSessionStatus,
      accountId: link.accountId ? link.accountId.toString() : null,
    };
  } catch (err) {
    console.error(`[Setu] status check failed for bankLinkId=${bankLinkId}:`, err.message);
    return { error: err.message || "Could not check status right now." };
  }
}

export async function syncBankLink(bankLinkId) {
  const userId = await requireUserId();
  await dbConnect();
  const link = await BankLink.findOne({ _id: bankLinkId, userId });
  if (!link) return { error: "Link not found." };
  if (link.consentStatus !== "ACTIVE") return { error: "Consent is not active." };

  try {
    const session = await createDataSession(link.consentId, link.consentDataRange);
    link.dataSessionId = session.id;
    link.dataSessionStatus = session.status;
    await link.save();

    const finalSession = await getDataSession(session.id);
    link.dataSessionStatus = finalSession.status;
    await link.save();

    if (finalSession.status === "COMPLETED" || finalSession.status === "PARTIAL") {
      const result = await syncBankLinkData(link, finalSession);
      revalidatePath("/accounts");
      return { success: true, ...result };
    }

    return { error: `Data fetch status: ${finalSession.status}` };
  } catch (err) {
    console.error(`[Setu] manual sync failed for bankLinkId=${bankLinkId}:`, err.message);
    return { error: err.message || "Sync failed." };
  }
}

export async function disconnectBankLink(bankLinkId) {
  const userId = await requireUserId();
  await dbConnect();
  const result = await BankLink.deleteOne({ _id: bankLinkId, userId });
  if (result.deletedCount) console.log(`[Setu] bankLinkId=${bankLinkId} disconnected by user`);
  revalidatePath("/accounts");
}
