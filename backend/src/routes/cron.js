const express = require("express");
const prisma = require("../lib/prisma");
const webpush = require("../lib/webpush");

const router = express.Router();

// Not user-JWT auth — this is called by an external scheduler (GitHub
// Actions), authenticated with a long shared secret instead.
function requireCronSecret(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token || !process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

function thaiToday() {
  // Thailand is UTC+7 with no DST — shift "now" by that offset before
  // reading the date parts, so this is correct regardless of the server's
  // own timezone (Render runs UTC).
  const now = new Date();
  const shifted = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const y = shifted.getUTCFullYear();
  const m = shifted.getUTCMonth();
  const d = shifted.getUTCDate();
  return { start: new Date(Date.UTC(y, m, d)), end: new Date(Date.UTC(y, m, d + 1)) };
}

// POST /api/cron/send-daily-notifications
// Triggered once a day (00:01 Thai time) by an external scheduler. Finds
// every CalendarNote due "today" and pushes a browser notification to each
// owner's subscribed devices.
router.post("/send-daily-notifications", requireCronSecret, async (req, res, next) => {
  try {
    const { start, end } = thaiToday();

    const notes = await prisma.calendarNote.findMany({
      where: { date: { gte: start, lt: end } },
    });

    let sent = 0;
    let removed = 0;

    for (const note of notes) {
      const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId: note.userId },
      });

      const payload = JSON.stringify({
        title: `${note.icon} ${note.title}`,
        body: note.note || "มีเหตุการณ์วันนี้",
        url: "/calendar",
      });

      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          );
          sent++;
        } catch (err) {
          // 404/410 means the browser dropped the subscription — clean it up.
          if (err.statusCode === 404 || err.statusCode === 410) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
            removed++;
          } else {
            console.error("push send failed:", err.message);
          }
        }
      }
    }

    res.json({ notesToday: notes.length, notificationsSent: sent, subscriptionsRemoved: removed });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
