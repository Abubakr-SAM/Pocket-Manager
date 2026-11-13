"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useCurrency } from "./CurrencyProvider";
import { useT } from "./LanguageProvider";

export type SpendingVariant = "bar" | "line" | "area";
export type CategoryVariant = "bar" | "pie";

const axisTick = { fill: "var(--muted)", fontSize: 12 };

const tooltipProps = {
  contentStyle: {
    background: "var(--card)",
    border: "1px solid var(--line)",
    borderRadius: 8,
    fontSize: 12,
  },
  itemStyle: { color: "var(--foreground)" },
  labelStyle: { color: "var(--muted)" },
  cursor: { fill: "var(--hover)", stroke: "var(--line)" },
};

// Pie diagramma uchun jim, to'yinmagan ranglar (ikkala mavzuda ham o'qiladi).
// Yashil va qizil ataylab ishlatilmagan: ular daromad va xarajatni bildiradi.
const pieColors = [
  "#60a5fa", // ko'k
  "#fbbf24", // sariq
  "#a78bfa", // binafsha
  "#2dd4bf", // zumrad
  "#f472b6", // pushti
  "#fb923c", // to'q sariq
  "#737373", // kulrang
  "#94a3b8", // och kulrang ("Boshqa kategoriyalar" uchun)
];

// Juda ko'p kategoriya bo'lsa, kichiklarini bitta bo'lakka yig'amiz
function groupSmall(
  data: { name: string; value: number }[],
  otherLabel: string
) {
  if (data.length <= pieColors.length) return data;

  const top = data.slice(0, pieColors.length - 1);
  const rest = data
    .slice(pieColors.length - 1)
    .reduce((sum, d) => sum + d.value, 0);

  return [...top, { name: otherLabel, value: Math.round(rest * 100) / 100 }];
}

export function SpendingChart({
  data,
  interval = 0,
  variant = "bar",
}: {
  data: { label: string; amount: number }[];
  interval?: number;
  variant?: SpendingVariant;
}) {
  const { format, compact } = useCurrency();
  const { t } = useT();
  const margin = { top: 8, right: 8, left: -8, bottom: 0 };

  const parts = [
    <CartesianGrid key="grid" stroke="var(--line)" vertical={false} />,
    <XAxis
      key="x"
      dataKey="label"
      tick={axisTick}
      tickLine={false}
      axisLine={false}
      interval={interval}
    />,
    <YAxis
      key="y"
      tick={axisTick}
      tickLine={false}
      axisLine={false}
      width={56}
      tickFormatter={(value: number) => compact(value)}
    />,
    <Tooltip
      key="tooltip"
      {...tooltipProps}
      formatter={(value: unknown) => format(Number(value))}
    />,
  ];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {variant === "line" ? (
          <LineChart data={data} margin={margin}>
            {parts}
            <Line
              type="monotone"
              dataKey="amount"
              name={t("stats.spent")}
              stroke="var(--foreground)"
              strokeWidth={2}
              dot={{ r: 3, fill: "var(--foreground)", strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        ) : variant === "area" ? (
          <AreaChart data={data} margin={margin}>
            <defs>
              <linearGradient id="spendingFill" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--foreground)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="100%"
                  stopColor="var(--foreground)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            {parts}
            <Area
              type="monotone"
              dataKey="amount"
              name={t("stats.spent")}
              stroke="var(--foreground)"
              strokeWidth={2}
              fill="url(#spendingFill)"
            />
          </AreaChart>
        ) : (
          <BarChart data={data} margin={margin}>
            {parts}
            <Bar
              dataKey="amount"
              name={t("stats.spent")}
              fill="var(--foreground)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryChart({
  data,
  variant = "bar",
}: {
  data: { name: string; value: number }[];
  variant?: CategoryVariant;
}) {
  const { currency, format } = useCurrency();
  const { t } = useT();

  if (variant === "pie") {
    const slices = groupSmall(data, t("stats.other"));
    const total = slices.reduce((sum, d) => sum + d.value, 0);

    return (
      <div className="grid items-center gap-6 md:grid-cols-2">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                {...tooltipProps}
                formatter={(value: unknown) => format(Number(value))}
              />
              <Pie
                data={slices}
                dataKey="value"
                nameKey="name"
                innerRadius="55%"
                outerRadius="90%"
                paddingAngle={2}
                stroke="var(--card)"
                strokeWidth={2}
              >
                {slices.map((entry, index) => (
                  <Cell key={entry.name} fill={pieColors[index]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <ul className="space-y-3">
          {slices.map((entry, index) => (
            <li
              key={entry.name}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="h-3 w-3 shrink-0 rounded-sm"
                  style={{ background: pieColors[index] }}
                />
                <span className="truncate">{entry.name}</span>
              </span>
              <span className="shrink-0 text-muted">
                {format(entry.value)} · {Math.round((entry.value / total) * 100)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const labelSpace = currency === "UZS" ? 130 : 84;

  return (
    <div className="w-full" style={{ height: Math.max(160, data.length * 44) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: labelSpace, left: 0, bottom: 0 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: "var(--foreground)", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={96}
          />
          <Tooltip
            {...tooltipProps}
            formatter={(value: unknown) => format(Number(value))}
          />
          <Bar
            dataKey="value"
            name={t("stats.spent")}
            fill="var(--foreground)"
            radius={[0, 4, 4, 0]}
            barSize={14}
          >
            <LabelList
              dataKey="value"
              position="right"
              fill="var(--muted)"
              fontSize={12}
              formatter={(value: unknown) => format(Number(value))}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}