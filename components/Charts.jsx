"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatPHP, formatPHPShort } from "@/lib/money";

const GREEN = "#4a8a3c";
const SKY = "#0284c7";
const AMBER = "#d97706";
const SLATE = "#64748b";

const axis = { fontSize: 12, fill: "#64748b" };

export function RevenueChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="label" tick={axis} interval="preserveStartEnd" />
        <YAxis tick={axis} tickFormatter={formatPHPShort} width={56} />
        <Tooltip formatter={(v) => formatPHP(v)} />
        <Legend />
        <Bar dataKey="room" name="Rooms" stackId="a" fill={GREEN} />
        <Bar dataKey="extras" name="Extras" stackId="a" fill={AMBER} />
        <Bar dataKey="bar" name="Bar" stackId="a" fill={SKY} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data}>
        <CartesianGrid stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="label" tick={axis} />
        <YAxis tick={axis} tickFormatter={formatPHPShort} width={56} />
        <Tooltip formatter={(v) => formatPHP(v)} />
        <Legend />
        <Bar dataKey="food" name="Food" stackId="a" fill={GREEN} />
        <Bar dataKey="activity" name="Activity" stackId="a" fill={SKY} />
        <Bar dataKey="damage" name="Damage" stackId="a" fill="#dc2626" />
        <Bar dataKey="other" name="Other" stackId="a" fill={SLATE} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function OccupancyChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="label" tick={axis} />
        <YAxis tick={axis} unit="%" domain={[0, 100]} width={44} />
        <Tooltip formatter={(v) => v + "%"} />
        <Bar dataKey="pct" name="Occupancy" fill={GREEN} />
      </BarChart>
    </ResponsiveContainer>
  );
}
