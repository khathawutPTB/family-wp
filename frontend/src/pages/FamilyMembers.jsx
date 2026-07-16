import { useEffect, useState } from "react";
import api from "../api/client";
import AvatarIcon, { AVATAR_KEYS } from "../components/AvatarIcon";

const PRESETS = [
  { role: "พ่อ", avatar: "dad", color: "#6fa695" },
  { role: "แม่", avatar: "mom", color: "#e8871e" },
  { role: "ลูก", avatar: "child", color: "#f2b705" },
  { role: "อื่นๆ", avatar: "other", color: "#a98243" },
];

const COLORS = ["#6fa695", "#e8871e", "#f2b705", "#4f8172", "#c96b3f", "#8fbfae", "#a98243"];

const emptyForm = { name: "", role: "", avatar: AVATAR_KEYS[0], color: COLORS[0] };

export default function FamilyMembers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    api
      .get("/family-members")
      .then(({ data }) => setMembers(data))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function openAddForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  }

  function openEditForm(member) {
    setEditingId(member.id);
    setForm({ name: member.name, role: member.role, avatar: member.avatar, color: member.color });
    setError("");
    setShowForm(true);
  }

  function applyPreset(preset) {
    setForm((f) => ({ ...f, role: preset.role, avatar: preset.avatar, color: preset.color, name: f.name || preset.role }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/family-members/${editingId}`, form);
      } else {
        await api.post("/family-members", form);
      }
      setShowForm(false);
      load();
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      setError(apiErrors?.[0]?.msg || err.response?.data?.error || "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("ลบสมาชิกคนนี้? รายการที่เคยแท็กไว้จะกลายเป็น \"ไม่ระบุสมาชิก\"")) return;
    await api.delete(`/family-members/${id}`);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-brand-ink">สมาชิกครอบครัว</h1>
        <button
          onClick={openAddForm}
          className="rounded-full bg-brand-yellow text-brand-ink text-sm font-semibold px-4 py-2 hover:bg-brand-yellow-dark transition-colors"
        >
          + เพิ่มสมาชิก
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm p-6 space-y-4">
          <h2 className="font-medium text-brand-ink">
            {editingId ? "แก้ไขสมาชิก" : "เพิ่มสมาชิกใหม่"}
          </h2>

          <div className="flex justify-center">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center p-2 shadow-inner"
              style={{ backgroundColor: `${form.color}33` }}
            >
              <AvatarIcon icon={form.avatar} color={form.color} className="w-full h-full" size="3.5rem" />
            </div>
          </div>

          {!editingId && (
            <div className="flex flex-wrap gap-2 justify-center">
              {PRESETS.map((p) => (
                <button
                  type="button"
                  key={p.role}
                  onClick={() => applyPreset(p)}
                  className="flex items-center gap-1.5 rounded-full bg-brand-cream px-3 py-1.5 text-sm text-brand-ink/70 hover:bg-brand-cream/70"
                >
                  <AvatarIcon icon={p.avatar} color={p.color} className="w-5 h-5" size="1rem" /> {p.role}
                </button>
              ))}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-brand-ink/70 mb-1 ml-1">ชื่อ</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-full border border-black/10 bg-brand-cream/60 px-5 py-3 focus:outline-none focus:ring-2 focus:ring-brand-teal"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-ink/70 mb-1 ml-1">บทบาท</label>
            <input
              type="text"
              required
              placeholder="เช่น พ่อ, แม่, ลูก"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="w-full rounded-full border border-black/10 bg-brand-cream/60 px-5 py-3 focus:outline-none focus:ring-2 focus:ring-brand-teal"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-ink/70 mb-1 ml-1">ไอคอน</label>
            <div className="flex flex-wrap gap-2">
              {AVATAR_KEYS.map((key) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => setForm((f) => ({ ...f, avatar: key }))}
                  className={`w-14 h-14 rounded-full flex items-center justify-center p-1.5 bg-brand-cream ${
                    form.avatar === key ? "ring-2 ring-brand-teal" : ""
                  }`}
                >
                  <AvatarIcon icon={key} color={form.color} className="w-full h-full" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-ink/70 mb-1 ml-1">สี</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setForm((f) => ({ ...f, color: c }))}
                  style={{ backgroundColor: c }}
                  className={`w-8 h-8 rounded-full ${
                    form.color === c ? "ring-2 ring-offset-2 ring-brand-ink" : ""
                  }`}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600 ml-1">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-brand-yellow text-brand-ink rounded-full py-3 font-semibold hover:bg-brand-yellow-dark transition-colors disabled:opacity-50"
            >
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 rounded-full border border-black/10 text-brand-ink/60"
            >
              ยกเลิก
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <p className="p-6 text-center text-brand-ink/40 text-sm">กำลังโหลด...</p>
        ) : members.length === 0 ? (
          <p className="p-6 text-center text-brand-ink/40 text-sm">
            ยังไม่มีสมาชิกครอบครัว ลองเพิ่มพ่อ แม่ หรือลูกดูสิ
          </p>
        ) : (
          <ul className="divide-y divide-black/5">
            {members.map((m) => (
              <li key={m.id} className="p-4 flex items-center gap-3">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center p-1.5 shrink-0"
                  style={{ backgroundColor: `${m.color}33` }}
                >
                  <AvatarIcon icon={m.avatar} color={m.color} className="w-full h-full" size="2.25rem" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-brand-ink truncate">{m.name}</p>
                  <p className="text-xs text-brand-ink/50">{m.role}</p>
                </div>
                <div className="flex gap-3 text-sm shrink-0">
                  <button onClick={() => openEditForm(m)} className="text-brand-teal-dark font-medium">
                    แก้ไข
                  </button>
                  <button onClick={() => handleDelete(m.id)} className="text-brand-orange font-medium">
                    ลบ
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
