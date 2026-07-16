const { PrismaClient } = require("@prisma/client");

// Reuse a single PrismaClient instance across the app (and across
// nodemon hot-reloads in dev) to avoid exhausting DB connections.
const prisma = global.__prisma__ || new PrismaClient();
if (process.env.NODE_ENV !== "production") {
  global.__prisma__ = prisma;
}

module.exports = prisma;
