import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { COLORS } from '@/constants/colors'
import { useTheme } from '@/context/ThemeContext'
import type { BodyWeightEntry } from '@/types/bodyWeight'

type WeightChartProps = {
  entries: BodyWeightEntry[]
}

function toChartLabel(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: 'short', day: '2-digit' })
}

export default function WeightChart({ entries }: WeightChartProps) {
  const { theme } = useTheme()
  const c = COLORS(theme)

  const data = entries.map((e) => ({
    date: e.date,
    weight: e.weight,
  }))

  return (
    <div style={{ width: '100%', height: 'var(--weight-chart-h, 280px)' }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 14, bottom: 8, left: 0 }}>
          <defs>
            <linearGradient id="llWeight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c.secondary} stopOpacity={0.35} />
              <stop offset="95%" stopColor={c.secondary} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke={c.border} strokeOpacity={0.35} vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={toChartLabel}
            tick={{ fill: c.textSecondary, fontSize: 12 }}
            tickMargin={6}
            minTickGap={24}
            interval="preserveStartEnd"
            axisLine={{ stroke: c.border, strokeOpacity: 0.5 }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: c.textSecondary, fontSize: 12 }}
            tickMargin={8}
            axisLine={{ stroke: c.border, strokeOpacity: 0.5 }}
            tickLine={false}
            width={36}
          />

          <Tooltip
            contentStyle={{
              background: c.surface,
              border: `1px solid ${c.border}`,
              borderRadius: 12,
              color: c.textPrimary,
            }}
            labelStyle={{ color: c.textSecondary }}
            formatter={(value) => [value == null ? '' : String(value), 'Weight']}
            labelFormatter={(label: string) => {
              const d = new Date(label)
              return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
            }}
          />

          <Area
            type="monotone"
            dataKey="weight"
            stroke={c.secondary}
            strokeWidth={2}
            fill="url(#llWeight)"
            animationDuration={450}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
