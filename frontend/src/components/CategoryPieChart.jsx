import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = [
  "#f2b705", "#6fa695", "#e8871e", "#4f8172",
  "#d9a404", "#8fbfae", "#c96b3f", "#a98243",
];

const currency = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" });

export default function CategoryPieChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-brand-ink/40 text-sm">
        ไม่มีข้อมูลในเดือนนี้
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.total, 0);

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
          <Pie
            data={data}
            dataKey="total"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => currency.format(value)} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div
        className="absolute inset-x-0 top-0 flex items-center justify-center pointer-events-none"
        style={{ height: 230 }}
      >
        <div className="text-center">
          <p className="text-xs text-brand-ink/50">รวม</p>
          <p className="text-lg font-semibold text-brand-ink">{currency.format(total)}</p>
        </div>
      </div>
    </div>
  );
}
