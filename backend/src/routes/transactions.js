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

// GET /api/transactions?month=7&year=2026&type=EXPENSE&categoryId=1&page=1&pageSize=20
router.get(
  "/",
  [
    query("month").optional().isInt({ min: 1, max: 12 }),
    query("year").optional().isInt({ min: 2000, max: 2100 }),
    query("type").optional().isIn(["INCOME", "EXPENSE"]),
    query("categoryId").optional().isInt(),
    query("memberId").optional().isInt(),
    query("page").optional().isInt({ min: 1 }),
    query("pageSize").optional().isInt({ min: 1, max: 100 }),
  ],
  async (req, res, next) => {
    try {
      if (!handleValidation(req, res)) return;

      const { month, year, type, categoryId, memberId } = req.query;
      const page = parseInt(req.query.page || "1", 10);
      const pageSize = parseInt(req.query.pageSize || "20", 10);

      const where = { userId: req.userId };
      if (type) where.type = type;
      if (categoryId) where.categoryId = parseInt(categoryId, 10);
      if (memberId) where.memberId = parseInt(memberId, 10);
      if (month && year) {
        const start = new Date(Date.UTC(parseInt(year, 10), parseInt(month, 10) - 1, 1));
        const end = new Date(Date.UTC(parseInt(year, 10), parseInt(month, 10), 1));
        where.date = { gte: start, lt: end };
      } else if (year) {
        const start = new Date(Date.UTC(parseInt(year, 10), 0, 1));
        const end = new Date(Date.UTC(parseInt(year, 10) + 1, 0, 1));
        where.date = { gte: start, lt: end };
      }

      const [items, total] = await Promise.all([
        prisma.transaction.findMany({
          where,
          include: { category: true, member: true },
          orderBy: [{ date: "desc" }, { id: "desc" }],
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.transaction.count({ where }),
      ]);

      res.json({
        items,
        pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get("/:id", async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const transaction = await prisma.transaction.findFirst({
      where: { id, userId: req.userId },
      include: { category: true, member: true },
    });
    if (!transaction) return res.status(404).json({ error: "ไม่พบรายการ" });
    res.json(transaction);
  } catch (err) {
    next(err);
  }
});

const transactionValidators = [
  body("type").isIn(["INCOME", "EXPENSE"]).withMessage("ประเภทต้องเป็น INCOME หรือ EXPENSE"),
  body("amount").isFloat({ gt: 0 }).withMessage("จำนวนเงินต้องมากกว่า 0"),
  body("date").isISO8601().withMessage("รูปแบบวันที่ไม่ถูกต้อง"),
  body("categoryId").isInt().withMessage("กรุณาเลือกหมวดหมู่"),
  body("memberId").isInt().withMessage("กรุณาเลือกสมาชิก"),
  body("note").optional({ nullable: true }).isString().isLength({ max: 500 }),
];

router.post("/", transactionValidators, async (req, res, next) => {
  try {
    if (!handleValidation(req, res)) return;

    const { type, amount, date, categoryId, memberId, note } = req.body;

    const category = await prisma.category.findFirst({
      where: { id: categoryId, OR: [{ userId: null }, { userId: req.userId }], type },
    });
    if (!category) {
      return res.status(400).json({ error: "หมวดหมู่ไม่ถูกต้องหรือไม่ตรงกับประเภทรายการ" });
    }

    const member = await prisma.familyMember.findFirst({ where: { id: memberId, userId: req.userId } });
    if (!member) return res.status(400).json({ error: "ไม่พบสมาชิกที่เลือก" });

    const transaction = await prisma.transaction.create({
      data: {
        userId: req.userId,
        categoryId,
        memberId,
        type,
        amount,
        date: new Date(date),
        note: note || null,
      },
      include: { category: true, member: true },
    });

    res.status(201).json(transaction);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", transactionValidators, async (req, res, next) => {
  try {
    if (!handleValidation(req, res)) return;

    const id = parseInt(req.params.id, 10);
    const existing = await prisma.transaction.findFirst({ where: { id, userId: req.userId } });
    if (!existing) return res.status(404).json({ error: "ไม่พบรายการ" });

    const { type, amount, date, categoryId, memberId, note } = req.body;

    const category = await prisma.category.findFirst({
      where: { id: categoryId, OR: [{ userId: null }, { userId: req.userId }], type },
    });
    if (!category) {
      return res.status(400).json({ error: "หมวดหมู่ไม่ถูกต้องหรือไม่ตรงกับประเภทรายการ" });
    }

    const member = await prisma.familyMember.findFirst({ where: { id: memberId, userId: req.userId } });
    if (!member) return res.status(400).json({ error: "ไม่พบสมาชิกที่เลือก" });

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        categoryId,
        memberId,
        type,
        amount,
        date: new Date(date),
        note: note || null,
      },
      include: { category: true, member: true },
    });

    res.json(transaction);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await prisma.transaction.findFirst({ where: { id, userId: req.userId } });
    if (!existing) return res.status(404).json({ error: "ไม่พบรายการ" });

    await prisma.transaction.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
