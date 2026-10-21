
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

const MIN_SPEED = 20
const MAX_SPEED = 140
const BIN_WIDTH = 10

export default function SpeedHistogram({ speeds }) {
  const data = []

  for (let start = MIN_SPEED; start < MAX_SPEED; start += BIN_WIDTH) {
    data.push({
      range: `${start}-${start + BIN_WIDTH}`,
      count: 0,
    })
  }

  for (const speed of speeds) {
    const index = Math.min(
      data.length - 1,
      Math.floor((speed - MIN_SPEED) / BIN_WIDTH)
    )

    if (index >= 0) {
      data[index].count += 1
    }
  }

  return (
    <section className="mt-6 rounded-xl border border-slate-700 bg-slate-900 p-4 text-white">
      <h2 className="mb-3 text-lg font-semibold">
        Speed Trait Distribution
      </h2>

      <p className="mb-3 text-sm text-slate-400">
        Number of living organisms in each speed range
      </p>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="range" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar
              dataKey="count"
              name="Organisms"
              fill="#a78bfa"
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
