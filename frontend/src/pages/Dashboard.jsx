import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import CategoryPieChart from "../components/CategoryPieChart";
import AvatarIcon from "../components/AvatarIcon";
import { useAuth } from "../context/AuthContext";

const currency = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" });
const now = new Date();

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [summary, setSummary] = useState(null);
  const [chartType, setChartType] = useState("EXPENSE");
  const [byCategory, setByCategory] = useState([]);
  const [members, setMembers] = useState([]);
  const [byMember, setByMember] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/family-members").then(({ data }) => setMembers(data));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      api.get("/dashboard/summary", { params: { month, year } }),
      api.get("/dashboard/by-category", { params: { month, year, type: chartType } }),
      api.get("/dashboard/by-member", { params: { month, year } }),
    ])
      .then(([summaryRes, categoryRes, memberRes]) => {
        if (cancelled) return;
        setSummary(summaryRes.data);
        setByCategory(categoryRes.data);
        setByMember(memberRes.data.members);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [month, year, chartType]);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden bg-brand-teal rounded-3xl p-6 text-white">
        <div className="absolute -right-8 -top-10 w-32 h-32 rounded-full bg-brand-orange/30" />
        <div className="absolute right-2 -top-4 w-16 h-16 rounded-full bg-brand-orange" />
        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-white/80">สวัสดี,</p>
              <h1 className="text-2xl font-semibold">{user?.name || "ผู้ใช้"}</h1>
              <p className="text-sm text-white/70 mt-1">สรุปภาพรวมรายรับ-รายจ่าย</p>
            </div>
            <div className="flex -space-x-3 shrink-0">
              {members.slice(0, 4).map((m) => (
                <button
                  key={m.id}
                  onClick={() => navigate("/family")}
                  title={m.name}
                  className="w-12 h-12 rounded-full flex items-center justify-center p-1 border-2 border-brand-teal shadow-sm bg-white"
                >
                  <AvatarIcon icon={m.avatar} color={m.color} className="w-full h-full" size="1.75rem" />
                </button>
              ))}
              <button
                onClick={() => navigate("/family")}
                title="จัดการสมาชิก"
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl bg-white/20 border-2 border-brand-teal text-white"
              >
                +
              </button>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="rounded-full bg-white text-brand-ink text-sm px-3 py-1.5 focus:outline-none"
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
              className="rounded-full bg-white text-brand-ink text-sm px-3 py-1.5 focus:outline-none"
            >
              {Array.from({ length: 5 }, (_, i) => now.getFullYear() - i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          icon="⬆️"
          iconBg="bg-brand-teal-soft"
          label="รายรับรวม"
          value={summary ? currency.format(summary.totalIncome) : "-"}
          valueClassName="text-brand-teal-dark"
        />
        <SummaryCard
          icon="⬇️"
          iconBg="bg-brand-orange-soft"
          label="รายจ่ายรวม"
          value={summary ? currency.format(summary.totalExpense) : "-"}
          valueClassName="text-brand-orange"
        />
        <SummaryCard
          icon="💰"
          iconBg="bg-brand-yellow-soft"
          label="ยอดคงเหลือ"
          value={summary ? currency.format(summary.balance) : "-"}
          valueClassName={summary?.balance >= 0 ? "text-brand-ink" : "text-brand-orange"}
        />
      </div>

      {members.length > 0 && (
        <div className="bg-white rounded-3xl shadow-sm p-4">
          <h2 className="font-medium text-brand-ink mb-3">รายจ่ายตามสมาชิก</h2>
          <div className="space-y-3">
            {byMember.map((m) => (
              <div key={m.memberId ?? "unassigned"}>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="w-10 h-10 rounded-full flex items-center justify-center p-1 shrink-0"
                    style={{ backgroundColor: `${m.color}33` }}
                  >
                    <AvatarIcon icon={m.avatar} color={m.color} className="w-full h-full" size="1.5rem" />
                  </span>
                  <span className="text-sm text-brand-ink flex-1 truncate">{m.name}</span>
                  <span className="text-sm font-medium text-brand-ink/70">
                    {currency.format(m.spent)}
                  </span>
                  <span className="text-xs text-brand-ink/40 w-9 text-right">{m.percent}%</span>
                </div>
                <div className="h-2 rounded-full bg-brand-cream overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${m.percent}%`, backgroundColor: m.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-medium text-brand-ink">สัดส่วนค่าใช้จ่ายตามหมวดหมู่</h2>
          <div className="flex gap-1 text-sm bg-brand-cream rounded-full p-1">
            <button
              onClick={() => setChartType("EXPENSE")}
              className={`px-3 py-1 rounded-full transition-colors ${
                chartType === "EXPENSE" ? "bg-brand-orange text-white" : "text-brand-ink/50"
              }`}
            >
              รายจ่าย
            </button>
            <button
              onClick={() => setChartType("INCOME")}
              className={`px-3 py-1 rounded-full transition-colors ${
                chartType === "INCOME" ? "bg-brand-teal text-white" : "text-brand-ink/50"
              }`}
            >
              รายรับ
            </button>
          </div>
        </div>
        {loading ? (
          <div className="h-64 flex items-center justify-center text-brand-ink/40 text-sm">
            กำลังโหลด...
          </div>
        ) : (
          <CategoryPieChart data={byCategory} />
        )}
      </div>
    </div>
  );
}

function SummaryCard({ icon, iconBg, label, value, valueClassName }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3">
      <div className={`w-11 h-11 rounded-full flex items-center justify-center text-lg shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-brand-ink/50">{label}</p>
        <p className={`text-lg font-semibold truncate ${valueClassName}`}>{value}</p>
      </div>
    </div>
  );
}
