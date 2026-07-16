# แอปบันทึกรายรับ-รายจ่าย (Income/Expense Tracker)

Full-stack web app สำหรับบันทึกและติดตามรายรับ-รายจ่ายส่วนบุคคล

**Stack**
- Frontend: React 19 + Vite + Tailwind CSS v4 + React Router + Recharts + Axios
- Backend: Node.js + Express + Prisma ORM + JWT Auth + bcrypt
- Database: PostgreSQL

> ต้องการ deploy ขึ้นใช้งานจริงผ่านอินเทอร์เน็ต (เข้าจากมือถือ Android/iOS เครื่องไหนก็ได้ ไม่ใช่แค่ Wi-Fi วงเดียวกัน)? ดู [DEPLOY.md](DEPLOY.md) — คู่มือ deploy ขึ้น Railway (backend + Postgres) และ Vercel (frontend) แบบละเอียดทีละขั้นตอน

## โครงสร้างโปรเจกต์

```
AI_TP/
├── backend/                 # Express API
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── seed.js          # Seed ข้อมูลหมวดหมู่เริ่มต้น
│   ├── src/
│   │   ├── routes/          # auth, categories, transactions, dashboard
│   │   ├── middleware/auth.js
│   │   ├── lib/prisma.js
│   │   └── index.js         # Entry point
│   └── .env.example
└── frontend/                 # React SPA
    ├── src/
    │   ├── pages/            # Login, Register, Dashboard, TransactionForm, History, FamilyMembers
    │   ├── components/       # Navbar, ProtectedRoute, CategoryPieChart
    │   ├── context/AuthContext.jsx
    │   └── api/client.js     # Axios instance + JWT interceptor
    └── .env.example
```

## Database Schema

```
users
├── id (PK)
├── name
├── email (unique)
├── password_hash
├── created_at, updated_at

categories                    -- userId = NULL คือหมวดหมู่กลางที่ seed ไว้ล่วงหน้า
├── id (PK)
├── name                      -- เช่น "อาหาร", "เดินทาง", "บันเทิง"
├── type                      -- enum: INCOME | EXPENSE
├── icon                      -- emoji
├── user_id (FK -> users.id, nullable)

family_members                -- แท็กสมาชิกครอบครัว (ไม่ใช่บัญชี login แยก — ใช้ login เดียวกันทั้งบ้าน)
├── id (PK)
├── user_id (FK -> users.id)
├── name                      -- เช่น "พ่อ", "แม่", "ลูก"
├── role                      -- ข้อความอิสระ
├── avatar                    -- emoji
├── color                     -- hex สำหรับ badge/progress bar
├── created_at

transactions
├── id (PK)
├── user_id (FK -> users.id)
├── category_id (FK -> categories.id)
├── member_id (FK -> family_members.id, nullable)  -- บังคับเลือกตอนสร้าง/แก้ไขที่ API layer, nullable ไว้เพื่อรองรับกรณีลบสมาชิกทิ้ง (SetNull)
├── type                      -- enum: INCOME | EXPENSE
├── amount                    -- Decimal
├── date
├── note
├── created_at, updated_at
```

ความสัมพันธ์: `User 1—N Transaction`, `Category 1—N Transaction`, `User 1—N Category` (สำหรับหมวดหมู่กำหนดเอง), `User 1—N FamilyMember`, `FamilyMember 1—N Transaction` (nullable — ลบสมาชิกแล้วรายการเก่ากลายเป็น "ไม่ระบุสมาชิก" ไม่ถูกลบตาม)

## ฟีเจอร์ที่ทำไว้

1. **Login / ลงทะเบียน** — JWT-based auth, รหัสผ่านเข้ารหัสด้วย bcrypt
2. **Dashboard** — เลือกเดือน/ปี แล้วดูยอดรายรับรวม, รายจ่ายรวม, ยอดคงเหลือ, สัดส่วนรายจ่ายตามสมาชิกครอบครัว (progress bar), กราฟโดนัทตามหมวดหมู่
3. **ฟอร์มบันทึกรายการ** — เลือกรายรับ/รายจ่าย, จำนวนเงิน, วันที่, หมวดหมู่, สมาชิก (บังคับเลือก), หมายเหตุ (ใช้ฟอร์มเดียวกันทั้งเพิ่มและแก้ไข)
4. **ประวัติ (History)** — list พร้อม filter ตามประเภทและสมาชิก, แก้ไข/ลบรายการย้อนหลัง, pagination
5. **สมาชิกครอบครัว** — เพิ่ม/แก้ไข/ลบสมาชิก (ชื่อ, บทบาท, ไอคอน, สี) พร้อมปุ่ม preset พ่อ/แม่/ลูก/อื่นๆ ใช้ login เดียวกันทั้งบ้าน ไม่ต้องสมัครสมาชิกแยกคนละบัญชี

## วิธีติดตั้งและรันระบบ (local dev)

ต้องมี PostgreSQL ที่เชื่อมต่อได้ก่อน — จะเป็น PostgreSQL ในเครื่อง หรือจะต่อไปยัง Postgres ที่ deploy ไว้บน Railway แล้ว (ดู [DEPLOY.md](DEPLOY.md)) ก็ได้ทั้งคู่ ใช้ connection string เดียวกันได้เลย

### 1. ตั้งค่า Backend

```bash
cd backend
npm install
cp .env.example .env
```

แก้ไข `backend/.env`:
```
DATABASE_URL="postgresql://<user>:<password>@<host>:5432/<database>"
JWT_SECRET="<สุ่มสตริงยาวๆ ที่คาดเดายาก>"
JWT_EXPIRES_IN="7d"
PORT=4000
CORS_ORIGIN="http://localhost:5173"
```

รัน migration เพื่อสร้างตารางตาม schema และ seed หมวดหมู่เริ่มต้น:

```bash
npx prisma migrate dev --name init
node prisma/seed.js
```

เริ่มเซิร์ฟเวอร์ (dev mode มี auto-reload):

```bash
npm run dev
```

API จะรันที่ `http://localhost:4000` (ตรวจสอบได้ที่ `GET /api/health`)

### 2. ตั้งค่า Frontend

เปิด terminal ใหม่:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend จะรันที่ `http://localhost:5173`

### 3. ใช้งาน

1. เปิดเบราว์เซอร์ไปที่ `http://localhost:5173`
2. ลงทะเบียนบัญชีใหม่ที่หน้า Register
3. เข้าสู่ระบบ แล้วเริ่มเพิ่มรายการรายรับ/รายจ่ายได้จากปุ่ม "เพิ่มรายการ"
4. ดูสรุปที่ Dashboard และดูประวัติ/แก้ไข/ลบที่หน้า "ประวัติ"

ทดสอบ end-to-end แล้ว (register → login → เพิ่ม/แก้ไข/ลบรายการ → dashboard summary + กราฟวงกลม → logout) ผ่านทั้งหมด รวมถึงลองพิมพ์ข้อความภาษาไทยในหมายเหตุก็บันทึก/แสดงผลถูกต้อง

## เข้าใช้งานผ่านมือถือ (เครือข่าย Wi-Fi เดียวกัน)

ตั้งค่าไว้แล้วให้เข้าถึงได้จากอุปกรณ์อื่นในวง LAN เดียวกัน (ไม่ต้อง deploy):

- `frontend/vite.config.js` ตั้ง `server.host = true` แล้ว → Vite เปิดรับ connection จากทุก interface ไม่ใช่แค่ localhost
- `frontend/.env` → `VITE_API_URL` ชี้ไปที่ IP เครื่องนี้แทน localhost
- `backend/.env` → `CORS_ORIGIN` เพิ่ม origin ของ IP เครื่องนี้เข้าไปด้วย (คั่นด้วย comma)

IP เครื่องนี้ตอนนี้คือ `192.168.100.59` (เช็คได้ด้วย `ipconfig` เพราะ IP อาจเปลี่ยนเมื่อต่อ Wi-Fi ใหม่หรือรีสตาร์ทเราเตอร์)

**วิธีใช้จากมือถือ:**
1. ต่อมือถือเข้า Wi-Fi วงเดียวกับคอมพิวเตอร์เครื่องนี้
2. เปิดเบราว์เซอร์ในมือถือ ไปที่ `http://192.168.100.59:5173`
3. ถ้าเข้าไม่ได้ (timeout) ให้เช็ค Windows Defender Firewall ในคอมพิวเตอร์ — ตอน `npm run dev` รันครั้งแรกอาจมี popup ถามว่าจะอนุญาต Node.js ผ่าน firewall ไหม ให้เลือก "Allow access" (แบบ Private network) ถ้าพลาดไปแล้ว ไปที่ Windows Defender Firewall > Allow an app through firewall แล้วเพิ่ม/ติ๊ก Node.js ให้ผ่านทั้ง Private และ Public

**ข้อจำกัด:** วิธีนี้ใช้ได้แค่ตอนคอมพิวเตอร์เปิดเครื่อง รัน `npm run dev` ทั้ง backend/frontend อยู่ และมือถือต่อ Wi-Fi วงเดียวกันเท่านั้น ถ้าต้องการเข้าถึงจากอินเทอร์เน็ตทั่วไปได้ทุกที่ทุกเครือข่าย (ทั้ง Android และ iOS) ให้ deploy ขึ้น hosting จริงตามคู่มือ [DEPLOY.md](DEPLOY.md)

## คำสั่งอื่นๆ ที่มีประโยชน์

```bash
# Prisma Studio — GUI ดู/แก้ข้อมูลในฐานข้อมูล
cd backend && npx prisma studio

# Build frontend สำหรับ production
cd frontend && npm run build
```

## หมายเหตุด้านความปลอดภัย

- เปลี่ยน `JWT_SECRET` เป็นค่าสุ่มที่ยาวและคาดเดายากก่อนใช้งานจริง
- อย่า commit ไฟล์ `.env` ขึ้น git (มี `.gitignore` กันไว้ให้แล้วในฝั่ง backend)
- ทุก endpoint ของ transactions/categories/dashboard ต้องแนบ `Authorization: Bearer <token>` และข้อมูลจะถูกกรองด้วย `userId` เสมอ เพื่อไม่ให้เห็นข้อมูลของผู้ใช้คนอื่น
