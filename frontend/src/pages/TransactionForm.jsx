import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api/client";
import { avatarEmoji } from "../components/AvatarIcon";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function TransactionForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [type, setType] = useState("EXPENSE");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [categoryId, setCategoryId] = useState("");
  const [memberId, setMemberId] = useState("");
  const [note, setNote] = useState("");
  const [categories, setCategories] = useState([]);
  const [members, setMembers] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  // Load categories whenever the transaction type changes.
  useEffect(() => {
    api.get("/categories", { params: { type } }).then(({ data }) => {
      setCategories(data);
      setCategoryId((current) => {
        if (current && data.some((c) => c.id === current)) return current;
        return data[0]?.id || "";
      });
    });
  }, [type]);

  useEffect(() => {
    api.get("/family-members").then(({ data }) => setMembers(data));
  }, []);

  // If editing, load the existing transaction once.
  useEffect(() => {
    if (!isEdit) return;
    api.get(`/transactions/${id}`).then(({ data }) => {
      setType(data.type);
      setAmount(String(data.amount));
      setDate(data.date.slice(0, 10));
      setCategoryId(data.categoryId);
      setMemberId(data.memberId || "");
      setNote(data.note || "");
      setLoading(false);
    });
  }, [id, isEdit]);

  // Member is required — once both the member list and (if editing) the
  // transaction have loaded, fall back to the first member if nothing valid
  // is selected yet (covers new entries and legacy unassigned transactions).
  useEffect(() => {
    if (loading || members === null) return;
    setMemberId((current) => {
      if (current && members.some((m) => m.id === current)) return current;
      return members[0]?.id || "";
    });
  }, [loading, members]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        type,
        amount: Number(amount),
        date,
        categoryId: Number(categoryId),
        memberId: Number(memberId),
        note,
      };
      if (isEdit) {
        await api.put(`/transactions/${id}`, payload);
      } else {
        await api.post("/transactions", payload);
      }
      navigate("/history");
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      setError(apiErrors?.[0]?.msg || err.response?.data?.error || "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  if (loading || members === null) {
    return <p className="text-brand-ink/40 text-sm">กำลังโหลด...</p>;
  }

  if (members.length === 0) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-3xl shadow-sm p-6 text-center space-y-3">
        <p className="text-brand-ink">ต้องเพิ่มสมาชิกครอบครัวอย่างน้อย 1 คนก่อน ถึงจะบันทึกรายการได้</p>
        <Link
          to="/family"
          className="inline-block bg-brand-yellow text-brand-ink rounded-full px-6 py-3 font-semibold hover:bg-brand-yellow-dark transition-colors"
        >
          + เพิ่มสมาชิกครอบครัว
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-3xl shadow-sm p-6">
      <h1 className="text-xl font-semibold text-brand-ink mb-4">
        {isEdit ? "แก้ไขรายการ" : "เพิ่มรายการใหม่"}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex rounded-full bg-brand-cream p-1">
          <button
            type="button"
            onClick={() => setType("EXPENSE")}
            className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${
              type === "EXPENSE" ? "bg-brand-orange text-white" : "text-brand-ink/50"
            }`}
          >
            รายจ่าย
          </button>
          <button
            type="button"
            onClick={() => setType("INCOME")}
            className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${
              type === "INCOME" ? "bg-brand-teal text-white" : "text-brand-ink/50"
            }`}
          >
            รายรับ
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-ink/70 mb-1 ml-1">จำนวนเงิน (บาท)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-full border border-black/10 bg-brand-cream/60 px-5 py-3 focus:outline-none focus:ring-2 focus:ring-brand-teal"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-ink/70 mb-1 ml-1">วันที่</label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-full border border-black/10 bg-brand-cream/60 px-5 py-3 focus:outline-none focus:ring-2 focus:ring-brand-teal"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-ink/70 mb-1 ml-1">หมวดหมู่</label>
          <select
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-full border border-black/10 bg-brand-cream/60 px-5 py-3 focus:outline-none focus:ring-2 focus:ring-brand-teal"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-ink/70 mb-1 ml-1">สมาชิก</label>
          <select
            required
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            className="w-full rounded-full border border-black/10 bg-brand-cream/60 px-5 py-3 focus:outline-none focus:ring-2 focus:ring-brand-teal"
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {avatarEmoji(m.avatar)} {m.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-ink/70 mb-1 ml-1">หมายเหตุ</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="w-full rounded-3xl border border-black/10 bg-brand-cream/60 px-5 py-3 focus:outline-none focus:ring-2 focus:ring-brand-teal"
          />
        </div>

        {error && <p className="text-sm text-red-600 ml-1">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-brand-yellow text-brand-ink rounded-full py-3 font-semibold hover:bg-brand-yellow-dark transition-colors disabled:opacity-50"
        >
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </form>
    </div>
  );
}
