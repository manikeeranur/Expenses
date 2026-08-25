import "server-only";

const AUTH_URL = process.env.SETU_ENV === "production" ? "https://prod.setu.co/api/v2/auth/token" : "https://uat.setu.co/api/v2/auth/token";

const AA_BASE_URL = process.env.SETU_ENV === "production" ? "https://fiu.setu.co" : "https://fiu-sandbox.setu.co";

let cachedToken = null;
let cachedTokenExpiresAt = 0;

async function getSetuToken() {
  if (cachedToken && Date.now() < cachedTokenExpiresAt) return cachedToken;

  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientID: process.env.SETU_CLIENT_ID, secret: process.env.SETU_CLIENT_SECRET }),
  });

  const rawText = await res.text();
  let json;
  try {
    json = JSON.parse(rawText);
  } catch {
    throw new Error(`Setu auth returned a non-JSON response (${res.status}): ${rawText.slice(0, 300)}`);
  }
  if (!res.ok || !json?.data?.token) {
    throw new Error(json?.message || "Could not authenticate with Setu.");
  }

  cachedToken = json.data.token;
  cachedTokenExpiresAt = Date.now() + (json.data.expiresIn - 60) * 1000;
  return cachedToken;
}

async function setuFetch(path, { method = "GET", body } = {}) {
  const token = await getSetuToken();
  const res = await fetch(`${AA_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "x-product-instance-id": process.env.SETU_PRODUCT_INSTANCE_ID,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const rawText = await res.text();
  let json = null;
  try {
    json = JSON.parse(rawText);
  } catch {
    if (!res.ok) {
      throw new Error(`Setu ${path} returned a non-JSON response (${res.status}): ${rawText.slice(0, 300)}`);
    }
  }
  if (!res.ok) {
    throw new Error(json?.errorMsg || json?.message || json?.errors?.[0]?.detail || `Setu request failed (${res.status})`);
  }
  return json;
}

export async function checkAccountAvailability(mobileNumber) {
  const result = await setuFetch("/v2/account-availability", {
    method: "POST",
    body: { mobileNumber },
  });
  return Array.isArray(result) ? result : result?.accounts || [];
}

export async function createConsent(vua, redirectUrl) {
  const now = new Date();
  const from = new Date(now);
  from.setMonth(from.getMonth() - 12);

  return setuFetch("/v2/consents", {
    method: "POST",
    body: {
      consentDuration: { unit: "MONTH", value: "4" },
      vua,
      dataRange: { from: from.toISOString(), to: now.toISOString() },
      context: [],
      redirectUrl,
      fetchType: "ONETIME",
      consentTypes: ["PROFILE", "SUMMARY", "TRANSACTIONS"],
      fiTypes: ["DEPOSIT"],
      consentMode: "STORE",
      dataLife: { unit: "DAY", value: 1 },
      purpose: {
        code: "101",
        text: "Wealth or portfolio management",
        refUri: "https://api.rebit.org.in/aa/purpose/101.xml",
        category: { type: "PERSONAL_FINANCE" },
      },
    },
  });
}

export async function getConsentStatus(consentId) {
  return setuFetch(`/v2/consents/${consentId}`);
}

export async function createDataSession(consentId, dataRange) {
  return setuFetch("/v2/sessions", {
    method: "POST",
    body: {
      consentId,
      dataRange,
      format: "json",
    },
  });
}

export async function getDataSession(sessionId) {
  return setuFetch(`/v2/sessions/${sessionId}`);
}
