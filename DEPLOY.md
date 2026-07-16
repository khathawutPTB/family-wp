# คู่มือ Deploy ขึ้นใช้งานจริง (Railway + Vercel)

เป้าหมาย: ให้เข้าแอปได้จากมือถือทุกเครื่อง (Android/iOS) ผ่านอินเทอร์เน็ต ไม่ใช่แค่ Wi-Fi วงเดียวกัน

**สถาปัตยกรรม**
- Backend (Express + Prisma) + PostgreSQL → โฮสต์บน **Railway**
- Frontend (React/Vite) → โฮสต์บน **Vercel**

ขั้นตอนพวก "สมัครบัญชี", "ล็อกอิน", "กดปุ่มใน dashboard ของ Railway/Vercel" ต้องทำเองในเบราว์เซอร์ของคุณ (คนอื่นทำแทนไม่ได้เพราะเป็นการยืนยันตัวตนของคุณ) ส่วนโค้ด/config ทั้งหมดเตรียมไว้ให้พร้อมแล้ว

---

## ขั้นที่ 1 — สร้าง repo บน GitHub

1. ไปที่ [github.com/new](https://github.com/new) สร้าง repository ใหม่ (แนะนำตั้งชื่อ `family-wp`) — เลือก **Private** หรือ **Public** ก็ได้ อย่าติ๊ก "Add README" (เรามี README อยู่แล้ว)
2. คัดลอก URL ของ repo (เช่น `https://github.com/<username>/family-wp.git`) มาบอกผม ผมจะ push โค้ดที่เตรียมไว้ให้ทันที

---

## ขั้นที่ 2 — สร้าง PostgreSQL บน Railway

1. ไปที่ [railway.app](https://railway.app) สมัคร/ล็อกอิน (กด "Login with GitHub" สะดวกสุด)
2. กด **New Project** → **Provision PostgreSQL** (เลือกจากเมนู Database)
3. รอสักครู่จนสร้างเสร็จ คลิกที่ตัว Postgres → แท็บ **Variables** → คัดลอกค่า `DATABASE_URL` (หรือ `DATABASE_PUBLIC_URL` ถ้าจะให้ผมต่อจากเครื่องนี้)
4. ส่งค่านั้นมาให้ผม (ในแชท) — ผมจะรัน migration + seed หมวดหมู่เริ่มต้นให้ทันที

> หมายเหตุ: connection string นี้เป็นความลับ ไม่ควรแชร์ที่อื่นนอกจากในแชทนี้และตัว Railway env var เอง

---

## ขั้นที่ 3 — Deploy Backend บน Railway

หลังผมรัน migration เสร็จและ push โค้ดขึ้น GitHub แล้ว:

1. ใน Railway project เดียวกัน กด **New** → **GitHub Repo** → เลือก repo `family-wp`
2. คลิกที่ service ที่สร้างขึ้น → แท็บ **Settings** → **Root Directory** ใส่ `backend`
3. แท็บ **Variables** เพิ่ม:
   ```
   DATABASE_URL   = ${{Postgres.DATABASE_URL}}     (อ้างอิงจาก Postgres plugin โดยอัตโนมัติ)
   JWT_SECRET     = <สุ่มสตริงยาวๆ ที่คาดเดายาก>
   JWT_EXPIRES_IN = 7d
   CORS_ORIGIN    = http://localhost:5173           (จะอัปเดตเป็น URL ของ Vercel ทีหลัง)
   ```
   (ไม่ต้องตั้ง `PORT` — Railway กำหนดให้อัตโนมัติ และโค้ดอ่านจาก `process.env.PORT` อยู่แล้ว)
4. กด **Deploy** รอ build เสร็จ (Railway รัน `npm install` → `postinstall: prisma generate` → `start: prisma migrate deploy && node src/index.js` ให้อัตโนมัติตามที่ตั้งไว้ใน `backend/package.json`)
5. แท็บ **Settings** → **Networking** → กด **Generate Domain** จะได้ URL สาธารณะ เช่น `https://family-wp-backend.up.railway.app`
6. ทดสอบว่า backend ใช้งานได้: เปิด `https://<โดเมนที่ได้>/api/health` ควรเห็น `{"status":"ok"}`

---

## ขั้นที่ 4 — Deploy Frontend บน Vercel

1. ไปที่ [vercel.com](https://vercel.com) สมัคร/ล็อกอินด้วย GitHub
2. กด **Add New** → **Project** → เลือก repo `family-wp`
3. ตอนตั้งค่า project:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite (Vercel ควรตรวจจับให้อัตโนมัติ)
4. เปิด **Environment Variables** เพิ่ม:
   ```
   VITE_API_URL = https://<โดเมน Railway backend จากขั้นที่ 3>/api
   ```
5. กด **Deploy** รอสักครู่ จะได้ URL เช่น `https://family-wp.vercel.app`

---

## ขั้นที่ 5 — เปิดให้ frontend คุยกับ backend ได้ (แก้ CORS)

1. กลับไปที่ Railway → service ของ backend → แท็บ **Variables**
2. แก้ `CORS_ORIGIN` เป็น URL ของ Vercel ที่ได้จากขั้นที่ 4 เช่น:
   ```
   CORS_ORIGIN = https://family-wp.vercel.app
   ```
   (ถ้าจะให้ localhost ทดสอบต่อได้ด้วย ใส่คั่นด้วย comma: `https://family-wp.vercel.app,http://localhost:5173`)
3. Railway จะ redeploy service ให้อัตโนมัติเมื่อแก้ env var

---

## ขั้นที่ 6 — ทดสอบจากมือถือ

เปิด URL ของ Vercel (เช่น `https://family-wp.vercel.app`) จากมือถือ Android หรือ iPhone เครื่องไหนก็ได้ — เข้าได้ทันทีผ่านอินเทอร์เน็ตทั่วไป ไม่ต้องต่อ Wi-Fi เดียวกับคอมพิวเตอร์แล้ว

ลงทะเบียนบัญชีใหม่ (บัญชีบน SQLite ในเครื่องเดิมจะไม่ตามมาด้วย เพราะเปลี่ยนไปใช้ PostgreSQL บน Railway แล้ว)

---

## หลังจากนี้ทุกครั้งที่แก้โค้ด

```bash
git add -A
git commit -m "อธิบายสิ่งที่แก้"
git push
```

Railway และ Vercel ผูกกับ GitHub repo ไว้แล้ว จะ build + deploy เวอร์ชันใหม่ให้อัตโนมัติทุกครั้งที่ push ขึ้น branch หลัก

## ค่าใช้จ่าย

Railway และ Vercel มี free tier ให้ใช้ (Railway ให้เครดิตฟรีต่อเดือนระดับหนึ่ง, Vercel ฟรีสำหรับโปรเจกต์ส่วนตัว) เพียงพอสำหรับแอปใช้ในครอบครัว แต่ถ้ามีการใช้งานเยอะขึ้นอาจมีค่าใช้จ่ายเพิ่มตามปริมาณ ควรดูราคาปัจจุบันที่เว็บของแต่ละเจ้าอีกครั้งก่อนใช้งานจริงจัง
