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

const subscribeValidators = [
  body("endpoint").isURL().withMessage("subscription ไม่ถูกต้อง"),
  body("keys.p256dh").notEmpty().withMessage("subscription ไม่ถูกต้อง"),
  body("keys.auth").notEmpty().withMessage("subscription ไม่ถูกต้อง"),
];

// Registers (or re-registers) this browser/device to receive push
// notifications. Upserts on endpoint so re-subscribing the same device
// doesn't create duplicate rows.
router.post("/subscribe", subscribeValidators, async (req, res, next) => {
  try {
    if (!handleValidation(req, res)) return;

    const { endpoint, keys } = req.body;
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { userId: req.userId, p256dh: keys.p256dh, auth: keys.auth },
      create: { userId: req.userId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    });
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.delete("/subscribe", [body("endpoint").isURL()], async (req, res, next) => {
  try {
    if (!handleValidation(req, res)) return;

    const { endpoint } = req.body;
    await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: req.userId } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
