import WorldCanvas from "./components/WorldCanvas.jsx";

function App() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8">
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
            Artificial Life Lab
          </p>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            EvoWorld
          </h1>

          <p className="mt-3 max-w-2xl text-slate-400">
            A living ecosystem shaped by energy, survival, and evolution.
          </p>
        </header>

        <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-semibold">Simulation World</h2>

            <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">
              900 × 600 units
            </span>
          </div>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
              <p className="text-sm text-slate-400">Population</p>
              <p
                id="population-count"
                className="text-xl font-semibold text-white"
              >
                100
              </p>
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
              <p className="text-sm text-slate-400">Food</p>
              <p id="food-count" className="text-xl font-semibold text-white">
                120
              </p>
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
              <p className="text-sm text-slate-400">Average speed</p>
              <p
                id="average-speed"
                className="text-xl font-semibold text-white"
              >
                60.0
              </p>
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
              <p className="text-sm text-slate-400">Average vision</p>
              <p
                id="average-vision"
                className="text-xl font-semibold text-white"
              >
                60.0
              </p>
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
              <p className="text-sm text-slate-400">Average energy</p>
              <p
                id="average-energy"
                className="text-xl font-semibold text-white"
              >
                50.0
              </p>
            </div>
          </div>
          <WorldCanvas />
        </section>
      </div>
    </main>
  );
}

export default App;
