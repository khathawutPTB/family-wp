require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const categoryRoutes = require("./routes/categories");
const transactionRoutes = require("./routes/transactions");
const dashboardRoutes = require("./routes/dashboard");
const familyMemberRoutes = require("./routes/familyMembers");
const calendarNoteRoutes = require("./routes/calendarNotes");
const pushRoutes = require("./routes/push");
const cronRoutes = require("./routes/cron");
const budgetRoutes = require("./routes/budgets");

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173").split(",");
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/family-members", familyMemberRoutes);
app.use("/api/calendar-notes", calendarNoteRoutes);
app.use("/api/push", pushRoutes);
app.use("/api/cron", cronRoutes);
app.use("/api/budgets", budgetRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Centralized error handler — keeps try/catch blocks in routes minimal.
// Only ever reached for unexpected errors (routes handle expected cases like
// validation/not-found with their own res.status().json() calls), so the
// raw error — which can include internal details like DB connection info
// and file paths — is logged server-side but never sent to the client.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "เกิดข้อผิดพลาดบางอย่าง กรุณาลองใหม่อีกครั้ง" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
