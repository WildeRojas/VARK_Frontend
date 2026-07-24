'use client';

import {
  Radar,
  RadarChart as RechartsRadar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts';

interface VarkData {
  v: number; // Visual
  a: number; // Auditivo
  r: number; // Lectura
  k: number; // Kinestésico
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

export default function RadarChart({ data, size = 280 }: RadarChartProps) {
  const chartData = [
    { subject: 'Visual',      value: data.v, fill: VARK_COLORS.v },
    { subject: 'Auditivo',    value: data.a, fill: VARK_COLORS.a },
    { subject: 'Lectura',     value: data.r, fill: VARK_COLORS.r },
    { subject: 'Kinestésico', value: data.k, fill: VARK_COLORS.k },
  ];

  return (
    <div style={{ width: size, height: size, margin: '0 auto' }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadar
          data={chartData}
          cx="50%"
          cy="50%"
          outerRadius="70%"
        >
          <PolarGrid
            stroke="var(--border-glass)"
            gridType="polygon"
          />
          <PolarAngleAxis
            dataKey="subject"
            tick={{
              fill: 'var(--text-secondary)',
              fontSize: 12,
              fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
            }}
          />
          <Radar
            name="VARK"
            dataKey="value"
            stroke="var(--accent-blue)"
            fill="var(--accent-blue)"
            fillOpacity={0.25}
            strokeWidth={2}
            dot={(props) => {
              const { cx, cy, index } = props as { cx: number; cy: number; index: number };
              const colors = Object.values(VARK_COLORS);
              return (
                <circle
                  key={index}
                  cx={cx}
                  cy={cy}
                  r={5}
                  fill={colors[index % colors.length]}
                  stroke="rgba(0,0,0,0.3)"
                  strokeWidth={1}
                />
              );
            }}
          />
        </RechartsRadar>
      </ResponsiveContainer>
    </div>
  );
}
