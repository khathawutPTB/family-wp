const express = require("express");
const { query, validationResult } = require("express-validator");
const prisma = require("../lib/prisma");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

function monthRange(month, year) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { start, end };
}

// GET /api/dashboard/summary?month=7&year=2026
// Returns total income, total expense, and balance for the given month.
router.get(
  "/summary",
  [query("month").isInt({ min: 1, max: 12 }), query("year").isInt({ min: 2000, max: 2100 })],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const month = parseInt(req.query.month, 10);
      const year = parseInt(req.query.year, 10);
      const { start, end } = monthRange(month, year);

      const grouped = await prisma.transaction.groupBy({
        by: ["type"],
        where: { userId: req.userId, date: { gte: start, lt: end } },
        _sum: { amount: true },
      });

      const totals = { INCOME: 0, EXPENSE: 0 };
      for (const row of grouped) {
        totals[row.type] = Number(row._sum.amount || 0);
      }

      res.json({
        month,
        year,
        totalIncome: totals.INCOME,
        totalExpense: totals.EXPENSE,
        balance: totals.INCOME - totals.EXPENSE,
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/dashboard/by-category?month=7&year=2026&type=EXPENSE
// Returns spending/income totals grouped by category, for the pie chart.
router.get(
  "/by-category",
  [
    query("month").isInt({ min: 1, max: 12 }),
    query("year").isInt({ min: 2000, max: 2100 }),
    query("type").isIn(["INCOME", "EXPENSE"]),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const month = parseInt(req.query.month, 10);
      const year = parseInt(req.query.year, 10);
      const type = req.query.type;
      const { start, end } = monthRange(month, year);

      const grouped = await prisma.transaction.groupBy({
        by: ["categoryId"],
        where: { userId: req.userId, type, date: { gte: start, lt: end } },
        _sum: { amount: true },
      });

      const categoryIds = grouped.map((g) => g.categoryId);
      const categories = await prisma.category.findMany({ where: { id: { in: categoryIds } } });
      const categoryMap = new Map(categories.map((c) => [c.id, c]));

      const result = grouped
        .map((g) => ({
          categoryId: g.categoryId,
          name: categoryMap.get(g.categoryId)?.name || "ไม่ทราบหมวดหมู่",
          icon: categoryMap.get(g.categoryId)?.icon || null,
          total: Number(g._sum.amount || 0),
        }))
        .sort((a, b) => b.total - a.total);

      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/dashboard/by-member?month=7&year=2026
// Returns each family member's share of this month's EXPENSE total, for the
// "Family Members Breakdown" progress bars. Members with no spending this
// month are still included (spent: 0) so the roster stays stable.
router.get(
  "/by-member",
  [query("month").isInt({ min: 1, max: 12 }), query("year").isInt({ min: 2000, max: 2100 })],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const month = parseInt(req.query.month, 10);
      const year = parseInt(req.query.year, 10);
      const { start, end } = monthRange(month, year);

      const [grouped, members] = await Promise.all([
        prisma.transaction.groupBy({
          by: ["memberId"],
          where: { userId: req.userId, type: "EXPENSE", date: { gte: start, lt: end } },
          _sum: { amount: true },
        }),
        prisma.familyMember.findMany({ where: { userId: req.userId }, orderBy: { createdAt: "asc" } }),
      ]);

      const spentByMember = new Map(grouped.map((g) => [g.memberId, Number(g._sum.amount || 0)]));
      const totalExpense = grouped.reduce((sum, g) => sum + Number(g._sum.amount || 0), 0);

      const result = members.map((m) => {
        const spent = spentByMember.get(m.id) || 0;
        return {
          memberId: m.id,
          name: m.name,
          role: m.role,
          avatar: m.avatar,
          color: m.color,
          spent,
          percent: totalExpense > 0 ? Math.round((spent / totalExpense) * 100) : 0,
        };
      });

      const unassigned = spentByMember.get(null) || 0;
      if (unassigned > 0) {
        result.push({
          memberId: null,
          name: "ไม่ระบุสมาชิก",
          role: "",
          avatar: "❓",
          color: "#9ca3af",
          spent: unassigned,
          percent: totalExpense > 0 ? Math.round((unassigned / totalExpense) * 100) : 0,
        });
      }

      result.sort((a, b) => b.spent - a.spent);

      res.json({ totalExpense, members: result });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/dashboard/by-day?month=7&year=2026
// Returns income/expense totals per day for the given month, for the
// calendar page's day-cell indicators.
router.get(
  "/by-day",
  [query("month").isInt({ min: 1, max: 12 }), query("year").isInt({ min: 2000, max: 2100 })],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const month = parseInt(req.query.month, 10);
      const year = parseInt(req.query.year, 10);
      const { start, end } = monthRange(month, year);

      const grouped = await prisma.transaction.groupBy({
        by: ["date", "type"],
        where: { userId: req.userId, date: { gte: start, lt: end } },
        _sum: { amount: true },
      });

      const byDay = {};
      for (const row of grouped) {
        const key = row.date.toISOString().slice(0, 10);
        byDay[key] ??= { income: 0, expense: 0 };
        byDay[key][row.type === "INCOME" ? "income" : "expense"] = Number(row._sum.amount || 0);
      }

      res.json(byDay);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/dashboard/budgets?month=7&year=2026
// Returns each budgeted category's cap alongside this month's actual spend,
// for the Dashboard's budget progress bars.
router.get(
  "/budgets",
  [query("month").isInt({ min: 1, max: 12 }), query("year").isInt({ min: 2000, max: 2100 })],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const month = parseInt(req.query.month, 10);
      const year = parseInt(req.query.year, 10);
      const { start, end } = monthRange(month, year);

      const budgets = await prisma.budget.findMany({
        where: { userId: req.userId },
        include: { category: true },
        orderBy: { createdAt: "asc" },
      });

      const grouped = await prisma.transaction.groupBy({
        by: ["categoryId"],
        where: {
          userId: req.userId,
          type: "EXPENSE",
          date: { gte: start, lt: end },
          categoryId: { in: budgets.map((b) => b.categoryId) },
        },
        _sum: { amount: true },
      });
      const spentByCategory = new Map(grouped.map((g) => [g.categoryId, Number(g._sum.amount || 0)]));

      const result = budgets.map((b) => {
        const amount = Number(b.amount);
        const spent = spentByCategory.get(b.categoryId) || 0;
        return {
          id: b.id,
          categoryId: b.categoryId,
          categoryName: b.category.name,
          categoryIcon: b.category.icon,
          amount,
          spent,
          percent: amount > 0 ? Math.round((spent / amount) * 100) : 0,
        };
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
