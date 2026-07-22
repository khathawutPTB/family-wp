import { useEffect, useState } from "react";
import api from "../api/client";

const currency = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" });

export default function Budgets() {
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    Promise.all([api.get("/categories", { params: { type: "EXPENSE" } }), api.get("/budgets")])
      .then(([categoryRes, budgetRes]) => {
        setCategories(categoryRes.data);
        setBudgets(budgetRes.data);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  const budgetByCategory = new Map(budgets.map((b) => [b.categoryId, b]));

  async function handleSave(categoryId) {
    const value = drafts[categoryId];
    if (!value || Number(value) <= 0) return;
    setError("");
    setSavingId(categoryId);
    try {
      await api.post("/budgets", { categoryId, amount: Number(value) });
      setDrafts((d) => ({ ...d, [categoryId]: "" }));
      load();
    } catch (err) {
      setError(err.response?.data?.error || "บันทึกไม่สำเร็จ");
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(budgetId) {
    if (!window.confirm("ยกเลิกงบประมาณของหมวดหมู่นี้?")) return;
    await api.delete(`/budgets/${budgetId}`);
    load();
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-brand-ink">งบประมาณรายเดือน</h1>
        <p className="text-sm text-brand-ink/50 mt-0.5">
          ตั้งวงเงินต่อหมวดหมู่ ระบบจะแจ้งเตือนเมื่อใช้จ่ายถึงงบในแต่ละเดือน
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <p className="p-6 text-center text-brand-ink/40 text-sm">กำลังโหลด...</p>
        ) : categories.length === 0 ? (
          <p className="p-6 text-center text-brand-ink/40 text-sm">ยังไม่มีหมวดหมู่รายจ่าย</p>
        ) : (
          <ul className="divide-y divide-black/5">
            {categories.map((c) => {
              const budget = budgetByCategory.get(c.id);
              return (
                <li key={c.id} className="p-4 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-brand-cream flex items-center justify-center text-lg shrink-0">
                    {c.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-brand-ink truncate">{c.name}</p>
                    {budget && (
                      <p className="text-xs text-brand-ink/50">งบปัจจุบัน {currency.format(budget.amount)}/เดือน</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      placeholder={budget ? String(budget.amount) : "จำนวนเงิน"}
                      value={drafts[c.id] ?? ""}
                      onChange={(e) => setDrafts((d) => ({ ...d, [c.id]: e.target.value }))}
                      className="w-28 rounded-full border border-black/10 bg-brand-cream/60 px-4 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-brand-teal"
                    />
                    <button
                      onClick={() => handleSave(c.id)}
                      disabled={savingId === c.id}
                      className="rounded-full bg-brand-yellow text-brand-ink text-sm font-medium px-4 py-1.5 hover:bg-brand-yellow-dark transition-colors disabled:opacity-50"
                    >
                      บันทึก
                    </button>
                    {budget && (
                      <button
                        onClick={() => handleDelete(budget.id)}
                        className="text-brand-orange text-sm font-medium px-1"
                      >
                        ลบ
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
