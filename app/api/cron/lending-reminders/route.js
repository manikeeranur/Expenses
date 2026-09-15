import dbConnect from "@/lib/mongoose";
import Lending from "@/models/Lending";
import { computeLendingStats, buildReminderMessage } from "@/lib/lending";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

// Runs daily (see vercel.json crons) and WhatsApps anyone whose interest is
// due in 2 days. Configure CRON_SECRET so Vercel's Authorization header can
// be checked below — see https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs
function isAuthorized(request) {
  if (!process.env.CRON_SECRET) return true;
  return request.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

export async function GET(request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  const today = new Date();
  const dueInTwoDays = new Date(today);
  dueInTwoDays.setDate(dueInTwoDays.getDate() + 2);

  const candidates = await Lending.find({
    status: "active",
    interestDueDay: dueInTwoDays.getDate(),
  });

  let remindersSent = 0;

  for (const lending of candidates) {
    const alreadySentToday = lending.reminders[0] && isSameDay(new Date(lending.reminders[0].date), today);
    if (alreadySentToday || !lending.mobile) continue;

    const stats = computeLendingStats(lending);
    const message = buildReminderMessage(lending, stats);

    let status;
    try {
      const result = await sendWhatsAppMessage(lending.mobile, message);
      status = result.status;
    } catch {
      status = "failed";
    }

    lending.reminders.unshift({ date: today, message, status });
    await lending.save();
    remindersSent += 1;
  }

  return Response.json({ checked: candidates.length, remindersSent });
}
