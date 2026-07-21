import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/client";
import AvatarIcon, { avatarEmoji } from "../components/AvatarIcon";

const currency = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" });
const dateFormatter = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" });

export default function History() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [type, setType] = useState("");
  const [memberFilter, setMemberFilter] = useState(searchParams.get("memberId") || "");
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    api.get("/family-members").then(({ data }) => setMembers(data));
  }, []);

  function load(page = 1) {
    setLoading(true);
    api
      .get("/transactions", {
        params: {
          page,
          pageSize: 15,
          ...(type ? { type } : {}),
          ...(memberFilter ? { memberId: memberFilter } : {}),
        },
      })
      .then(({ data }) => {
        setItems(data.items);
        setPagination(data.pagination);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, memberFilter]);

  async function handleDelete(id) {
    if (!window.confirm("ยืนยันการลบรายการนี้?")) return;
    setDeletingId(id);
    try {
      await api.delete(`/transactions/${id}`);
      load(pagination.page);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-brand-ink">ประวัติรายการ</h1>
        <div className="flex gap-2">
          {members.length > 0 && (
            <select
              value={memberFilter}
              onChange={(e) => {
                const value = e.target.value;
                setMemberFilter(value);
                setSearchParams(value ? { memberId: value } : {});
              }}
              className="rounded-full border border-black/10 bg-white px-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
            >
              <option value="">ทุกคน</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {avatarEmoji(m.avatar)} {m.name}
                </option>
              ))}
            </select>
          )}
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-full border border-black/10 bg-white px-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
          >
            <option value="">ทั้งหมด</option>
            <option value="INCOME">รายรับ</option>
            <option value="EXPENSE">รายจ่าย</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <p className="p-6 text-center text-brand-ink/40 text-sm">กำลังโหลด...</p>
        ) : items.length === 0 ? (
          <p className="p-6 text-center text-brand-ink/40 text-sm">ยังไม่มีรายการ</p>
        ) : (
          <>
            {/* Card layout for small screens — the table below overflows on mobile */}
            <ul className="sm:hidden divide-y divide-black/5">
              {items.map((tx) => (
                <li key={tx.id} className="p-4 flex items-start gap-3">
                  <div className="w-11 h-11 rounded-full bg-brand-cream flex items-center justify-center text-lg shrink-0">
                    {tx.category.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-brand-ink truncate">{tx.category.name}</p>
                        <p className="text-xs text-brand-ink/40 mt-0.5 flex items-center gap-1">
                          {dateFormatter.format(new Date(tx.date))}
                          {tx.member && (
                            <span className="inline-flex items-center gap-1 ml-1">
                              <AvatarIcon
                                icon={tx.member.avatar}
                                color={tx.member.color}
                                className="w-4 h-4 inline-block"
                                size="0.85rem"
                              />
                              {tx.member.name}
                            </span>
                          )}
                        </p>
                        {tx.note && (
                          <p className="text-sm text-brand-ink/60 mt-1 break-words">{tx.note}</p>
                        )}
                      </div>
                      <p
                        className={`shrink-0 font-medium whitespace-nowrap ${
                          tx.type === "INCOME" ? "text-brand-teal-dark" : "text-brand-orange"
                        }`}
                      >
                        {tx.type === "INCOME" ? "+" : "-"}
                        {currency.format(tx.amount)}
                      </p>
                    </div>
                    <div className="flex gap-4 mt-2 text-sm">
                      <Link to={`/transactions/${tx.id}/edit`} className="text-brand-teal-dark font-medium">
                        แก้ไข
                      </Link>
                      <button
                        onClick={() => handleDelete(tx.id)}
                        disabled={deletingId === tx.id}
                        className="text-brand-orange font-medium disabled:opacity-50"
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Table layout for sm and up */}
            <table className="hidden sm:table w-full text-sm">
              <thead className="bg-brand-cream text-brand-ink/50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">วันที่</th>
                  <th className="text-left px-4 py-2 font-medium">หมวดหมู่</th>
                  <th className="text-left px-4 py-2 font-medium">หมายเหตุ</th>
                  <th className="text-right px-4 py-2 font-medium">จำนวนเงิน</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {items.map((tx) => (
                  <tr key={tx.id}>
                    <td className="px-4 py-2 whitespace-nowrap text-brand-ink/70">
                      {dateFormatter.format(new Date(tx.date))}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-brand-ink">
                      {tx.category.icon} {tx.category.name}
                      {tx.member && (
                        <span className="inline-flex items-center gap-1 text-brand-ink/40 text-xs ml-2">
                          · <AvatarIcon icon={tx.member.avatar} color={tx.member.color} className="w-4 h-4 inline-block" size="0.85rem" />
                          {tx.member.name}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-brand-ink/50 max-w-xs truncate">{tx.note}</td>
                    <td
                      className={`px-4 py-2 text-right font-medium whitespace-nowrap ${
                        tx.type === "INCOME" ? "text-brand-teal-dark" : "text-brand-orange"
                      }`}
                    >
                      {tx.type === "INCOME" ? "+" : "-"}
                      {currency.format(tx.amount)}
                    </td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      <Link
                        to={`/transactions/${tx.id}/edit`}
                        className="text-brand-teal-dark hover:underline mr-3"
                      >
                        แก้ไข
                      </Link>
                      <button
                        onClick={() => handleDelete(tx.id)}
                        disabled={deletingId === tx.id}
                        className="text-brand-orange hover:underline disabled:opacity-50"
                      >
                        ลบ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 text-sm">
          <button
            disabled={pagination.page <= 1}
            onClick={() => load(pagination.page - 1)}
            className="px-4 py-1.5 rounded-full border border-black/10 bg-white disabled:opacity-40"
          >
            ก่อนหน้า
          </button>
          <span className="px-2 py-1.5 text-brand-ink/50">
            หน้า {pagination.page} / {pagination.totalPages}
          </span>
          <button
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => load(pagination.page + 1)}
            className="px-4 py-1.5 rounded-full border border-black/10 bg-white disabled:opacity-40"
          >
            ถัดไป
          </button>
        </div>
      )}
    </div>
  );
}
