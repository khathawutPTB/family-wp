const express = require("express");
const prisma = require("../lib/prisma");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// Returns global default categories plus the current user's custom ones.
router.get("/", async (req, res, next) => {
  try {
    const { type } = req.query; // optional: INCOME | EXPENSE

    const categories = await prisma.category.findMany({
      where: {
        OR: [{ userId: null }, { userId: req.userId }],
        ...(type ? { type } : {}),
      },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });

    res.json(categories);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
