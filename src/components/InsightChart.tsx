import { useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { InsightData } from "@/hooks/useChat";

interface Props {
  data: InsightData;
}

const COLORS = [
  "hsl(152, 60%, 42%)", "hsl(217, 90%, 55%)", "hsl(40, 90%, 55%)",
  "hsl(0, 72%, 55%)", "hsl(280, 60%, 55%)", "hsl(180, 50%, 45%)",
  "hsl(30, 80%, 55%)", "hsl(330, 60%, 50%)",
];

export default function InsightChart({ data }: Props) {
  const formatINR = (value: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);

  const isLikelyCurrency = /revenue|sales|amount|value|price/i.test(
    `${data.title} ${data.datasets[0]?.label ?? ""}`
  );

  const chartData = useMemo(() => {
    return data.labels.map((label, i) => ({
      name: label,
      value: data.datasets[0]?.data[i] ?? 0,
    }));
  }, [data]);

  const renderChart = () => {
    switch (data.chartType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 88%)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => (isLikelyCurrency ? formatINR(Number(value)) : String(value))}
              />
              <Tooltip
                formatter={(value: number) =>
                  isLikelyCurrency ? [formatINR(value), data.datasets[0]?.label ?? "Value"] : [value, data.datasets[0]?.label ?? "Value"]
                }
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      case "line":
        return (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 88%)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => (isLikelyCurrency ? formatINR(Number(value)) : String(value))}
              />
              <Tooltip
                formatter={(value: number) =>
                  isLikelyCurrency ? [formatINR(value), data.datasets[0]?.label ?? "Value"] : [value, data.datasets[0]?.label ?? "Value"]
                }
              />
              <Line type="monotone" dataKey="value" stroke="hsl(152, 60%, 42%)" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        );
      case "pie":
      case "doughnut":
        return (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={data.chartType === "doughnut" ? 50 : 0}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) =>
                  isLikelyCurrency ? [formatINR(value), data.datasets[0]?.label ?? "Value"] : [value, data.datasets[0]?.label ?? "Value"]
                }
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-card-foreground mb-3">{data.title}</h3>
      {renderChart()}
      {data.summary && (
        <p className="text-xs text-muted-foreground mt-3 italic">{data.summary}</p>
      )}
    </div>
  );
}
