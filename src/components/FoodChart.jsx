
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

export default function FoodChart({ history }) {
  const data = history.map((food, index) => ({
    second: index + 1,
    food,
  }))

  return (
    <section className="mt-6 rounded-xl border border-slate-700 bg-slate-900 p-4 text-white">
      <h2 className="mb-3 text-lg font-semibold">
        Food Supply Over Time
      </h2>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="second"
              label={{
                value: 'Sample',
                position: 'insideBottom',
                offset: -5,
              }}
            />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="food"
              name="Food"
              stroke="#4ade80"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
