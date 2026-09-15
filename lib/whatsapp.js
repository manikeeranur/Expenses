import "server-only";

// No WhatsApp provider is configured yet. Once one is chosen, set
// WHATSAPP_PROVIDER to "twilio" or "meta" and add its credentials below —
// everything that calls sendWhatsAppMessage() keeps working unchanged.
export async function sendWhatsAppMessage(toMobile, message) {
  const provider = process.env.WHATSAPP_PROVIDER;

  if (provider === "twilio") {
    throw new Error("Twilio WhatsApp provider selected but not yet implemented.");
  }

  if (provider === "meta") {
    throw new Error("Meta WhatsApp Cloud API provider selected but not yet implemented.");
  }

  console.log(`[WhatsApp simulated] To: +91${toMobile}\n${message}`);
  return { status: "simulated" };
}
