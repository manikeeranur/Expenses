"use server";

import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/mongoose";
import BankLink from "@/models/BankLink";
import { requireUserId } from "@/lib/session";
import { checkAccountAvailability, createConsent, getConsentStatus, createDataSession, getDataSession } from "@/lib/setu";
import { syncBankLinkData } from "@/lib/bank-sync";

export async function checkMobileNumber(prevState, formData) {
  await requireUserId();
  const mobileNumber = formData.get("mobileNumber")?.toString().trim();

  if (!mobileNumber || !/^\d{10}$/.test(mobileNumber)) {
    return { error: "Enter a valid 10-digit mobile number." };
  }

  try {
    const accounts = await checkAccountAvailability(mobileNumber);
    const found = accounts.filter((a) => a.status);
    if (!found.length) {
      return { error: "No accounts found linked to this number with any Account Aggregator." };
    }
    return { success: true, mobileNumber, accounts: found };
  } catch (err) {
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
    }

    if (link.consentStatus === "ACTIVE" && !link.dataSessionId) {
      const session = await createDataSession(link.consentId, link.consentDataRange);
      link.dataSessionId = session.id;
      link.dataSessionStatus = session.status;
      await link.save();
    }

    if (link.dataSessionId && link.dataSessionStatus !== "COMPLETED") {
      const session = await getDataSession(link.dataSessionId);
      link.dataSessionStatus = session.status;
      await link.save();

      if (session.status === "COMPLETED" || session.status === "PARTIAL") {
        await syncBankLinkData(link, session);
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
    return { error: err.message || "Could not check status right now." };
  }
}
