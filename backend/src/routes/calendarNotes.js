const express = require("express");
const { body, query, validationResult } = require("express-validator");
const prisma = require("../lib/prisma");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return false;
  }
  return true;
}

const noteValidators = [
  body("title").trim().notEmpty().withMessage("กรุณากรอกชื่อเหตุการณ์"),
  body("date").isISO8601().withMessage("รูปแบบวันที่ไม่ถูกต้อง"),
  body("icon").trim().notEmpty().withMessage("กรุณาเลือกไอคอน"),
  body("color").trim().notEmpty().withMessage("กรุณาเลือกสี"),
  body("note").optional({ nullable: true }).isString().isLength({ max: 500 }),
];

// GET /api/calendar-notes?month=7&year=2026  (whole-month list, for day indicators)
// GET /api/calendar-notes?date=2026-07-16    (single-day list, for the day panel)
router.get(
  "/",
  [
    query("month").optional().isInt({ min: 1, max: 12 }),
    query("year").optional().isInt({ min: 2000, max: 2100 }),
    query("date").optional().isISO8601(),
  ],
  async (req, res, next) => {
    try {
      if (!handleValidation(req, res)) return;

      const { month, year, date } = req.query;
      const where = { userId: req.userId };

      if (date) {
        const day = new Date(date);
        const start = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate()));
        const end = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate() + 1));
        where.date = { gte: start, lt: end };
      } else if (month && year) {
        const start = new Date(Date.UTC(parseInt(year, 10), parseInt(month, 10) - 1, 1));
        const end = new Date(Date.UTC(parseInt(year, 10), parseInt(month, 10), 1));
        where.date = { gte: start, lt: end };
      }

      const notes = await prisma.calendarNote.findMany({
        where,
        orderBy: [{ date: "asc" }, { id: "asc" }],
      });
      res.json(notes);
    } catch (err) {
      next(err);
    }
  }
);

router.post("/", noteValidators, async (req, res, next) => {
  try {
    if (!handleValidation(req, res)) return;

    const { title, date, icon, color, note } = req.body;
    const created = await prisma.calendarNote.create({
      data: { userId: req.userId, title, date: new Date(date), icon, color, note: note || null },
    });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", noteValidators, async (req, res, next) => {
  try {
    if (!handleValidation(req, res)) return;

    const id = parseInt(req.params.id, 10);
    const existing = await prisma.calendarNote.findFirst({ where: { id, userId: req.userId } });
    if (!existing) return res.status(404).json({ error: "ไม่พบรายการ" });

    const { title, date, icon, color, note } = req.body;
    const updated = await prisma.calendarNote.update({
      where: { id },
      data: { title, date: new Date(date), icon, color, note: note || null },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await prisma.calendarNote.findFirst({ where: { id, userId: req.userId } });
    if (!existing) return res.status(404).json({ error: "ไม่พบรายการ" });

    await prisma.calendarNote.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
