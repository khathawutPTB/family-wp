# คู่มือ Deploy ขึ้นใช้งานจริง — ฟรีถาวร (Render + Neon + Vercel)

เป้าหมาย: ให้เข้าแอปได้จากมือถือทุกเครื่อง (Android/iOS) ผ่านอินเทอร์เน็ต ไม่ใช่แค่ Wi-Fi วงเดียวกัน และ **ไม่มีค่าใช้จ่าย** (ต่างจาก Railway ที่เป็นแค่ trial 30 วันหรือ $5 credit)

**สถาปัตยกรรม**
- Database: PostgreSQL → **Neon** (free tier ถาวร ไม่มีวันหมดอายุ)
- Backend (Express + Prisma) → **Render** (free web service ถาวร)
- Frontend (React/Vite) → **Vercel** (free ถาวรสำหรับใช้งานส่วนตัว)

**ข้อแลกเปลี่ยนของฟรี**: Render free tier จะ "หลับ" เมื่อไม่มีคนใช้งาน 15 นาที รีเควสต์แรกหลังจากหลับจะช้าประมาณ 30-50 วินาที (รอครั้งเดียวตอนปลุกเครื่อง) ส่วน Neon DB ก็หลับ/ตื่นอัตโนมัติเช่นกันแต่ไม่ต้องรอนาน

ขั้นตอนพวก "สมัครบัญชี", "ล็อกอิน", "กดปุ่มใน dashboard" ต้องทำเองในเบราว์เซอร์ของคุณ ส่วนโค้ด/config ทั้งหมดเตรียมไว้ให้พร้อมแล้ว

---

## ขั้นที่ 1 — สร้าง PostgreSQL บน Neon

1. ไปที่ [neon.tech](https://neon.tech) สมัคร/ล็อกอิน (กด "Continue with GitHub" สะดวกสุด)
2. กด **Create a project** ตั้งชื่ออะไรก็ได้ (เช่น `family-wp`) เลือก region ใกล้ๆ (Singapore ถ้ามี)
3. หลังสร้างเสร็จ จะเห็นหน้า **Connection string** ทันที — คัดลอกค่าที่ขึ้นต้นด้วย `postgresql://...` (เลือกโหมด "Pooled connection" ถ้ามีตัวเลือก จะรองรับ concurrent request ได้ดีกว่า)
4. ส่งค่านั้นมาให้ผมในแชท — ผมจะย้าย schema + seed หมวดหมู่เริ่มต้นให้ทันที

> connection string เป็นความลับ ไม่ควรแชร์ที่อื่นนอกจากในแชทนี้และตัว Render env var เอง

---

## ขั้นที่ 2 — Deploy Backend บน Render

หลังผมรัน migration เสร็จแล้ว:

1. ไปที่ [render.com](https://render.com) สมัคร/ล็อกอินด้วย GitHub
2. กด **New** → **Web Service**
3. เลือก **Build and deploy from a Git repository** → เชื่อม GitHub แล้วเลือก repo `family-wp`
4. ตั้งค่า:
   - **Name**: อะไรก็ได้ เช่น `family-wp-backend`
   - **Region**: Singapore (หรือใกล้ที่สุด)
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: **Free**
5. เลื่อนลงมาที่ **Environment Variables** เพิ่ม:
   ```
   DATABASE_URL   = <connection string จาก Neon ในขั้นที่ 1>
   JWT_SECRET     = 6aaad17f26b15d83d07b9f3c71d466eb2827bd6044526316e0ae6bd5d1b5f5192bfb6fced9f1f3e6a5aff2ddae625883
   JWT_EXPIRES_IN = 7d
   CORS_ORIGIN    = http://localhost:5173
   ```
   (ไม่ต้องตั้ง `PORT` — Render กำหนดให้อัตโนมัติ)
6. กด **Create Web Service** รอ build เสร็จ (ครั้งแรกอาจใช้เวลา 2-3 นาที)
7. เมื่อ deploy สำเร็จ Render จะให้โดเมนสาธารณะมาเลย เช่น `https://family-wp-backend.onrender.com` (ดูได้ที่มุมบนของหน้า service)
8. ทดสอบเปิด `https://<โดเมนนั้น>/api/health` ควรเห็น `{"status":"ok"}` (ถ้าเพิ่ง deploy เสร็จใหม่ๆ รอสักครู่ให้ตื่นเต็มที่ก่อน)

---

## ขั้นที่ 3 — Deploy Frontend บน Vercel

1. ไปที่ [vercel.com](https://vercel.com) สมัคร/ล็อกอินด้วย GitHub
2. กด **Add New** → **Project** → เลือก repo `family-wp`
3. ตั้งค่า:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite (ควรตรวจจับให้อัตโนมัติ)
4. เปิด **Environment Variables** เพิ่ม:
   ```
   VITE_API_URL = https://<โดเมน Render backend จากขั้นที่ 2>/api
   ```
5. กด **Deploy** รอสักครู่ จะได้ URL เช่น `https://family-wp.vercel.app`

---

## ขั้นที่ 4 — เปิดให้ frontend คุยกับ backend ได้ (แก้ CORS)

1. กลับไปที่ Render → service ของ backend → แท็บ **Environment**
2. แก้ `CORS_ORIGIN` เป็น URL ของ Vercel ที่ได้จากขั้นที่ 3 เช่น:
   ```
   CORS_ORIGIN = https://family-wp.vercel.app
   ```
3. กด **Save Changes** — Render จะ redeploy service ให้อัตโนมัติ

---

## ขั้นที่ 5 — ทดสอบจากมือถือ

เปิด URL ของ Vercel (เช่น `https://family-wp.vercel.app`) จากมือถือ Android หรือ iPhone เครื่องไหนก็ได้

ลงทะเบียนบัญชีใหม่ — ครั้งแรกที่เปิดอาจช้าสักครู่ถ้า backend หลับอยู่ (free tier ของ Render) หลังจากนั้นจะเร็วปกติจนกว่าจะไม่มีคนใช้ 15 นาทีอีกครั้ง

---

## หลังจากนี้ทุกครั้งที่แก้โค้ด

```bash
git add -A
git commit -m "อธิบายสิ่งที่แก้"
git push
```

Render และ Vercel ผูกกับ GitHub repo ไว้แล้ว จะ build + deploy เวอร์ชันใหม่ให้อัตโนมัติทุกครั้งที่ push ขึ้น branch หลัก

## ทำไมไม่ใช้ Railway

Railway ให้แค่ trial (30 วัน หรือ $5 credit อย่างใดอย่างหนึ่งหมดก่อน) หลังจากนั้นต้องอัปเกรดเป็นแผนเสียเงินอย่างน้อย $5/เดือนถึงจะใช้ต่อได้ ส่วน Render + Neon + Vercel ที่ใช้ในคู่มือนี้ฟรีถาวรสำหรับการใช้งานระดับส่วนตัว/ครอบครัว แลกกับ backend ที่ "หลับ" เมื่อไม่มีคนใช้งานชั่วคราว
