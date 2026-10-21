
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

export default function TraitHistoryChart({ meanSpeed, meanVision }) {
  const data = meanSpeed.map((speed, index) => ({
    second: index + 1,
    meanSpeed: Number(speed.toFixed(1)),
    meanVision: Number((meanVision[index] ?? 0).toFixed(1)),
  }));

  return (
    <section className="mt-6 rounded-xl border border-slate-700 bg-slate-900 p-4 text-white">
      <h2 className="mb-3 text-lg font-semibold">
        Average Traits Over Time
      </h2>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="second" />
            <YAxis domain={[20, 150]} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="meanSpeed"
              name="Mean Speed"
              stroke="#38bdf8"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="meanVision"
              name="Mean Vision"
              stroke="#fbbf24"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
