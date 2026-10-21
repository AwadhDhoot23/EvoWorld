import WorldCanvas from "./components/WorldCanvas.jsx";
import { useState } from "react";
import PopulationChart from "./components/PopulationChart";
import FoodChart from "./components/FoodChart";
import SpeedHistogram from "./components/SpeedHistogram";
import TraitHistoryChart from "./components/TraitHistoryChart";

function App() {
  const [history, setHistory] = useState({
    population: [],
    food: [],
    meanSpeed: [],
    meanVision: [],
    speeds: [],
  });
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
          <div className="mb-4 grid grid-cols- gap-3 sm:grid-cols-3 lg:grid-cols-4">
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
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
              <p className="text-sm text-slate-400">Births</p>
              <p id="births-count" className="text-xl font-semibold text-white">
                0
              </p>
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
              <p className="text-sm text-slate-400">Deaths</p>
              <p id="deaths-count" className="text-xl font-semibold text-white">
                0
              </p>
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
              <p className="text-sm text-slate-400">Average lifespan</p>
              <p
                id="average-lifespan"
                className="text-xl font-semibold text-white"
              >
                —
              </p>
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
              <p className="text-sm text-slate-400">Highest generation</p>
              <p
                id="highest-generation"
                className="text-xl font-semibold text-white"
              >
                0
              </p>
            </div>
          </div>
          <WorldCanvas onHistoryUpdate={setHistory} />
          <PopulationChart history={history.population} />
          <FoodChart history={history.food} />
          <SpeedHistogram speeds={history.speeds} />
          <TraitHistoryChart
            meanSpeed={history.meanSpeed}
            meanVision={history.meanVision}
          />
        </section>
      </div>
    </main>
  );
}

export default App;
