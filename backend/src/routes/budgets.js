const express = require("express");
const { body, validationResult } = require("express-validator");
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

router.get("/", async (req, res, next) => {
  try {
    const budgets = await prisma.budget.findMany({
      where: { userId: req.userId },
      include: { category: true },
      orderBy: { createdAt: "asc" },
    });
    res.json(budgets);
  } catch (err) {
    next(err);
  }
});

const budgetValidators = [
  body("categoryId").isInt().withMessage("กรุณาเลือกหมวดหมู่"),
  body("amount").isFloat({ gt: 0 }).withMessage("จำนวนเงินต้องมากกว่า 0"),
];

// Upsert: setting a budget for a category the user already has one for
// just updates the amount (and resets the notified-this-month flag, since
// a higher cap may no longer be crossed).
router.post("/", budgetValidators, async (req, res, next) => {
  try {
    if (!handleValidation(req, res)) return;

    const categoryId = parseInt(req.body.categoryId, 10);
    const { amount } = req.body;

    const category = await prisma.category.findFirst({
      where: { id: categoryId, OR: [{ userId: null }, { userId: req.userId }], type: "EXPENSE" },
    });
    if (!category) return res.status(400).json({ error: "หมวดหมู่ไม่ถูกต้อง" });

    const budget = await prisma.budget.upsert({
      where: { userId_categoryId: { userId: req.userId, categoryId } },
      update: { amount, lastNotifiedMonth: null, lastNotifiedYear: null },
      create: { userId: req.userId, categoryId, amount },
      include: { category: true },
    });

    res.status(201).json(budget);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await prisma.budget.findFirst({ where: { id, userId: req.userId } });
    if (!existing) return res.status(404).json({ error: "ไม่พบงบประมาณ" });

    await prisma.budget.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
