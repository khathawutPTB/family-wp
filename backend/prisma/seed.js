const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const defaultCategories = [
  { name: "อาหาร", type: "EXPENSE", icon: "🍔" },
  { name: "เดินทาง", type: "EXPENSE", icon: "🚗" },
  { name: "บันเทิง", type: "EXPENSE", icon: "🎮" },
  { name: "ช้อปปิ้ง", type: "EXPENSE", icon: "🛍️" },
  { name: "ที่พัก/ค่าเช่า", type: "EXPENSE", icon: "🏠" },
  { name: "สุขภาพ", type: "EXPENSE", icon: "💊" },
  { name: "การศึกษา", type: "EXPENSE", icon: "📚" },
  { name: "อื่นๆ", type: "EXPENSE", icon: "📦" },
  { name: "เงินเดือน", type: "INCOME", icon: "💰" },
  { name: "โบนัส", type: "INCOME", icon: "🎁" },
  { name: "รายได้เสริม", type: "INCOME", icon: "💵" },
  { name: "อื่นๆ", type: "INCOME", icon: "📦" },
];

async function main() {
  for (const cat of defaultCategories) {
    const existing = await prisma.category.findFirst({
      where: { name: cat.name, type: cat.type, userId: null },
    });
    if (!existing) {
      await prisma.category.create({ data: { ...cat, userId: null } });
    }
  }
  console.log("Seeded default categories.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
