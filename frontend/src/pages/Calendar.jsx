import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import AvatarIcon from "../components/AvatarIcon";

const currency = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" });
const dateFormatter = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" });
const WEEKDAY_LABELS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const now = new Date();

function pad(n) {
  return String(n).padStart(2, "0");
}

function dateKey(year, month, day) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

// Leading nulls pad the grid to align day 1 under the correct weekday column.
function buildCalendarCells(year, month) {
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells = Array(firstWeekday).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

export default function Calendar() {
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [byDay, setByDay] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(
    now.getMonth() + 1 === month && now.getFullYear() === year ? now.getDate() : null
  );
  const [dayItems, setDayItems] = useState([]);
  const [dayLoading, setDayLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    setLoading(true);
    api
      .get("/dashboard/by-day", { params: { month, year } })
      .then(({ data }) => setByDay(data))
      .finally(() => setLoading(false));
    setSelectedDay(now.getMonth() + 1 === month && now.getFullYear() === year ? now.getDate() : null);
  }, [month, year]);

  useEffect(() => {
    if (!selectedDay) {
      setDayItems([]);
      return;
    }
    setDayLoading(true);
    api
      .get("/transactions", { params: { date: dateKey(year, month, selectedDay) } })
      .then(({ data }) => setDayItems(data.items))
      .finally(() => setDayLoading(false));
  }, [selectedDay, month, year]);

  async function handleDelete(id) {
    if (!window.confirm("ยืนยันการลบรายการนี้?")) return;
    setDeletingId(id);
    try {
      await api.delete(`/transactions/${id}`);
      const [dayRes, monthRes] = await Promise.all([
        api.get("/transactions", { params: { date: dateKey(year, month, selectedDay) } }),
        api.get("/dashboard/by-day", { params: { month, year } }),
      ]);
      setDayItems(dayRes.data.items);
      setByDay(monthRes.data);
    } finally {
      setDeletingId(null);
    }
  }

  const cells = buildCalendarCells(year, month);
  const isCurrentMonth = now.getMonth() + 1 === month && now.getFullYear() === year;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-brand-ink">ปฏิทิน</h1>
        <div className="flex gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="rounded-full border border-black/10 bg-white px-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                เดือน {m}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-full border border-black/10 bg-white px-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
          >
            {Array.from({ length: 5 }, (_, i) => now.getFullYear() - i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm p-4">
        <div className="grid grid-cols-7 text-center text-xs text-brand-ink/40 mb-2">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="py-1">
              {label}
            </div>
          ))}
        </div>
        {loading ? (
          <div className="h-64 flex items-center justify-center text-brand-ink/40 text-sm">
            กำลังโหลด...
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} />;
              const key = dateKey(year, month, day);
              const data = byDay[key];
              const isToday = isCurrentMonth && day === now.getDate();
              const isSelected = day === selectedDay;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedDay(day)}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 text-sm transition-colors ${
                    isSelected
                      ? "bg-brand-yellow text-brand-ink font-semibold"
                      : isToday
                      ? "bg-brand-cream ring-2 ring-brand-teal text-brand-ink font-semibold"
                      : "text-brand-ink hover:bg-brand-cream"
                  }`}
                >
                  <span>{day}</span>
                  {data && (
                    <span className="flex gap-0.5">
                      {data.income > 0 && <span className="w-1.5 h-1.5 rounded-full bg-brand-teal" />}
                      {data.expense > 0 && <span className="w-1.5 h-1.5 rounded-full bg-brand-orange" />}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <h2 className="font-medium text-brand-ink">
            {selectedDay
              ? dateFormatter.format(new Date(Date.UTC(year, month - 1, selectedDay)))
              : "เลือกวันที่เพื่อดูรายการ"}
          </h2>
          {selectedDay && byDay[dateKey(year, month, selectedDay)] && (
            <div className="text-xs text-brand-ink/50 flex gap-3">
              {byDay[dateKey(year, month, selectedDay)].income > 0 && (
                <span className="text-brand-teal-dark">
                  +{currency.format(byDay[dateKey(year, month, selectedDay)].income)}
                </span>
              )}
              {byDay[dateKey(year, month, selectedDay)].expense > 0 && (
                <span className="text-brand-orange">
                  -{currency.format(byDay[dateKey(year, month, selectedDay)].expense)}
                </span>
              )}
            </div>
          )}
        </div>

        {!selectedDay ? null : dayLoading ? (
          <p className="p-6 text-center text-brand-ink/40 text-sm">กำลังโหลด...</p>
        ) : dayItems.length === 0 ? (
          <p className="p-6 text-center text-brand-ink/40 text-sm">ไม่มีรายการในวันนี้</p>
        ) : (
          <ul className="divide-y divide-black/5">
            {dayItems.map((tx) => (
              <li key={tx.id} className="p-4 flex items-start gap-3">
                <div className="w-11 h-11 rounded-full bg-brand-cream flex items-center justify-center text-lg shrink-0">
                  {tx.category.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-brand-ink truncate">{tx.category.name}</p>
                      {tx.member && (
                        <p className="text-xs text-brand-ink/40 mt-0.5 flex items-center gap-1">
                          <AvatarIcon
                            icon={tx.member.avatar}
                            color={tx.member.color}
                            className="w-4 h-4 inline-block"
                            size="0.85rem"
                          />
                          {tx.member.name}
                        </p>
                      )}
                      {tx.note && <p className="text-sm text-brand-ink/60 mt-1 break-words">{tx.note}</p>}
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
        )}
      </div>
    </div>
  );
}
