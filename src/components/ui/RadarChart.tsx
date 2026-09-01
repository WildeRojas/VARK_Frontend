'use client';

import { useState, useEffect } from 'react';
import {
  Radar,
  RadarChart as RechartsRadar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

interface VarkData {
  v: number;
  a: number;
  r: number;
  k: number;
}

interface RadarChartProps {
  data: VarkData;
  size?: number;
}

const VARK_COLORS = {
  v: '#3b6ef8',
  a: '#a78bfa',
  r: '#00d4ff',
  k: '#00e676',
};

function normalizeScore(val: number | undefined): number {
  if (val === undefined || val === null || isNaN(val)) return 0;
  if (val > 0 && val <= 1) return Math.round(val * 100);
  return Math.round(val);
}

export default function RadarChart({ data, size = 280 }: RadarChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = [
    { subject: 'Visual',      value: normalizeScore(data?.v), fill: VARK_COLORS.v },
    { subject: 'Auditivo',    value: normalizeScore(data?.a), fill: VARK_COLORS.a },
    { subject: 'Lectura',     value: normalizeScore(data?.r), fill: VARK_COLORS.r },
    { subject: 'Kinestésico', value: normalizeScore(data?.k), fill: VARK_COLORS.k },
  ];

  if (!mounted) {
    return <div style={{ width: size, height: size, margin: '0 auto' }} />;
  }

  return (
    <div style={{ width: size, height: size, minWidth: size, minHeight: size, margin: '0 auto', position: 'relative' }}>
      <ResponsiveContainer width={size} height={size} minWidth={size} minHeight={size}>
        <RechartsRadar
          data={chartData}
          cx="50%"
          cy="50%"
          outerRadius="65%"
        >
          <PolarGrid
            stroke="var(--border-glass, rgba(255,255,255,0.12))"
            gridType="polygon"
          />
          <PolarAngleAxis
            dataKey="subject"
            tick={{
              fill: 'var(--text-secondary, #94a3b8)',
              fontSize: size <= 220 ? 10 : 12,
              fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
              fontWeight: 600,
            }}
          />
          <PolarRadiusAxis
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          <Radar
            name="VARK"
            dataKey="value"
            stroke="var(--accent-blue, #3b6ef8)"
            fill="var(--accent-blue, #3b6ef8)"
            fillOpacity={0.35}
            strokeWidth={2}
            dot={(props) => {
              const { cx, cy, index } = props as { cx: number; cy: number; index: number };
              const colors = [VARK_COLORS.v, VARK_COLORS.a, VARK_COLORS.r, VARK_COLORS.k];
              return (
                <circle
                  key={index}
                  cx={cx}
                  cy={cy}
                  r={size <= 220 ? 4 : 5}
                  fill={colors[index % colors.length]}
                  stroke="#ffffff"
                  strokeWidth={1.5}
                />
              );
            }}
          />
        </RechartsRadar>
      </ResponsiveContainer>
    </div>
  );
}
