const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const prisma = require("../lib/prisma");

const router = express.Router();

function issueToken(user) {
  return jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function toPublicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("กรุณากรอกชื่อ"),
    body("email").isEmail().withMessage("อีเมลไม่ถูกต้อง").normalizeEmail(),
    body("password")
      .isLength({ min: 6 })
      .withMessage("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password } = req.body;

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(409).json({ error: "อีเมลนี้ถูกใช้งานแล้ว" });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { name, email, passwordHash },
      });

      const token = issueToken(user);
      res.status(201).json({ token, user: toPublicUser(user) });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("อีเมลไม่ถูกต้อง").normalizeEmail(),
    body("password").notEmpty().withMessage("กรุณากรอกรหัสผ่าน"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
      }

      const token = issueToken(user);
      res.json({ token, user: toPublicUser(user) });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
