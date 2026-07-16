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

const memberValidators = [
  body("name").trim().notEmpty().withMessage("กรุณากรอกชื่อ"),
  body("role").trim().notEmpty().withMessage("กรุณาระบุบทบาท"),
  body("avatar").trim().notEmpty().withMessage("กรุณาเลือกไอคอน"),
  body("color").trim().notEmpty().withMessage("กรุณาเลือกสี"),
];

router.get("/", async (req, res, next) => {
  try {
    const members = await prisma.familyMember.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "asc" },
    });
    res.json(members);
  } catch (err) {
    next(err);
  }
});

router.post("/", memberValidators, async (req, res, next) => {
  try {
    if (!handleValidation(req, res)) return;

    const { name, role, avatar, color } = req.body;
    const member = await prisma.familyMember.create({
      data: { userId: req.userId, name, role, avatar, color },
    });
    res.status(201).json(member);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", memberValidators, async (req, res, next) => {
  try {
    if (!handleValidation(req, res)) return;

    const id = parseInt(req.params.id, 10);
    const existing = await prisma.familyMember.findFirst({ where: { id, userId: req.userId } });
    if (!existing) return res.status(404).json({ error: "ไม่พบสมาชิก" });

    const { name, role, avatar, color } = req.body;
    const member = await prisma.familyMember.update({
      where: { id },
      data: { name, role, avatar, color },
    });
    res.json(member);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await prisma.familyMember.findFirst({ where: { id, userId: req.userId } });
    if (!existing) return res.status(404).json({ error: "ไม่พบสมาชิก" });

    await prisma.familyMember.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
