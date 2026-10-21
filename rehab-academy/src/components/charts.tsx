import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const axis = { fontSize: 12, fill: '#486581' };
const tooltipStyle = { borderRadius: 12, border: '1px solid #E3EAF1', fontSize: 12, boxShadow: '0 10px 30px rgba(16,42,67,.10)' };

/** Single-series bar chart; one hue, labelled axes, value in tooltip. */
export function BarSeries({ data, x, y, unit, height = 220, max }: { data: Record<string, string | number>[]; x: string; y: string; unit?: string; height?: number; max?: number }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#E3EAF1" />
          <XAxis dataKey={x} tick={axis} axisLine={false} tickLine={false} interval={0} />
          <YAxis tick={axis} axisLine={false} tickLine={false} allowDecimals={false} domain={max ? [0, max] : undefined} />
          <Tooltip cursor={{ fill: '#F5F8FB' }} contentStyle={tooltipStyle} formatter={(v) => [`${v}${unit ?? ''}`, '']} separator="" />
          <Bar dataKey={y} fill="#087F8C" radius={[6, 6, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
