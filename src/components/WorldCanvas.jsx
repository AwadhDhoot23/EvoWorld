import { useCallback, useEffect, useRef, useState } from "react";
import { createWorld, updateWorld } from "../sim/world";

const WORLD_WIDTH = 900;
const WORLD_HEIGHT = 600;

function WorldCanvas({ onHistoryUpdate }) {
  const canvasRef = useRef(null);
  const [selectedOrganism, setSelectedOrganism] = useState(null);
  const worldRef = useRef(null);
  const selectedOrganismRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const [atPopulationCap, setAtPopulationCap] = useState(false);
  const pausedRef = useRef(false);
  const [extinctionTime, setExtinctionTime] = useState(null);
  const simulationTimeRef = useRef(0);
  const [resetKey, setResetKey] = useState(0);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const speedRef = useRef(1);
  const [seedInput, setSeedInput] = useState("42");
  const [appliedSeed, setAppliedSeed] = useState(42);
  const [foodSpawnRate, setFoodSpawnRate] = useState(8);
  const foodSpawnRateRef = useRef(8);
  const [mutationRate, setMutationRate] = useState(0.08);
  const mutationRateRef = useRef(0.08);
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const world = createWorld(appliedSeed);
    worldRef.current = world;
    world.foodSpawnRate = foodSpawnRateRef.current;
    world.mutationRate = mutationRateRef.current;
    const populationElement = document.getElementById("population-count");
    const foodElement = document.getElementById("food-count");
    const birthsElement = document.getElementById("births-count");
    const deathsElement = document.getElementById("deaths-count");
    const lifespanElement = document.getElementById("average-lifespan");
    const generationElement = document.getElementById("highest-generation");
    const averageSpeedElement = document.getElementById("average-speed");
    const averageVisionElement = document.getElementById("average-vision");
    const averageEnergyElement = document.getElementById("average-energy");

    let previousTime = null;
    let animationId;
    let accumulator = 0;
    let historyUpdateAccumulator = 0;

    function handleVisibilityChange() {
      if (document.hidden) {
        previousTime = null;
        accumulator = 0;
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    const FIXED_DELTA_TIME = 1 / 60;
    const MAX_FRAME_TIME = 0.25;

    function render() {
      context.clearRect(0, 0, world.width, world.height);

      // Draw food.
      for (const item of world.food) {
        context.fillStyle = "#34d399";
        context.fillRect(item.x, item.y, 4, 4);
      }

      // Draw organisms.
      // Draw organisms.
      for (const organism of world.organisms) {
        context.beginPath();
        context.arc(organism.x, organism.y, 5, 0, Math.PI * 2);

        context.fillStyle = organism.energy > 30 ? "#60a5fa" : "#f87171";
        context.fill();

        if (selectedOrganismRef.current?.id === organism.id) {
          context.beginPath();
          context.arc(organism.x, organism.y, 9, 0, Math.PI * 2);
          context.strokeStyle = "#facc15";
          context.lineWidth = 2;
          context.stroke();
        }
      }
      if (populationElement) {
        populationElement.textContent = world.organisms.length;
      }

      if (foodElement) {
        foodElement.textContent = world.food.length;
      }
      if (birthsElement) {
        birthsElement.textContent = world.births;
      }

      if (deathsElement) {
        deathsElement.textContent = world.deaths;
      }

      if (lifespanElement) {
        lifespanElement.textContent =
          world.deaths > 0
            ? (world.totalLifespan / world.deaths).toFixed(1) + " s"
            : "—";
      }

      if (generationElement) {
        generationElement.textContent = world.highestGeneration;
      }
      const population = world.organisms.length;

      if (population > 0) {
        const totals = world.organisms.reduce(
          (result, organism) => {
            result.speed += organism.genome.speed;
            result.vision += organism.genome.vision;
            result.energy += organism.energy;

            return result;
          },
          { speed: 0, vision: 0, energy: 0 },
        );

        averageSpeedElement.textContent = (totals.speed / population).toFixed(
          1,
        );

        averageVisionElement.textContent = (totals.vision / population).toFixed(
          1,
        );

        averageEnergyElement.textContent = (totals.energy / population).toFixed(
          1,
        );
      } else {
        averageSpeedElement.textContent = "—";
        averageVisionElement.textContent = "—";
        averageEnergyElement.textContent = "—";
      }
    }

    function animate(currentTime) {
      if (previousTime !== null) {
        const frameTime = Math.min(
          (currentTime - previousTime) / 1000,
          MAX_FRAME_TIME,
        );

        if (!pausedRef.current) {
          accumulator += frameTime * speedRef.current;

          let steps = 0;

          while (accumulator >= FIXED_DELTA_TIME && steps < 20) {
            world.foodSpawnRate = foodSpawnRateRef.current;
            world.mutationRate = mutationRateRef.current;
            updateWorld(world, FIXED_DELTA_TIME);
            simulationTimeRef.current += FIXED_DELTA_TIME;
            accumulator -= FIXED_DELTA_TIME;
            steps += 1;

            if (world.organisms.length === 0) {
              pausedRef.current = true;
              setIsPaused(true);
              setExtinctionTime(simulationTimeRef.current);
              break;
            }
          }
        }
        historyUpdateAccumulator += frameTime;

        if (historyUpdateAccumulator >= 0.25) {
          historyUpdateAccumulator = 0;

          onHistoryUpdate?.({
            population: [...world.history.population],
            food: [...world.history.food],
            meanSpeed: [...world.history.meanSpeed],
            meanVision: [...world.history.meanVision],
            speeds: world.organisms.map((organism) => organism.genome.speed),
          });
          setAtPopulationCap(world.organisms.length >= 400);
          const selectedId = selectedOrganismRef.current?.id;

          if (selectedId !== undefined) {
            const currentOrganism = world.organisms.find(
              (organism) => organism.id === selectedId,
            );

            selectedOrganismRef.current = currentOrganism ?? null;
            setSelectedOrganism(currentOrganism ?? null);
          }
        }
      }

      previousTime = currentTime;

      render();

      animationId = requestAnimationFrame(animate);
    }

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [resetKey, appliedSeed]);
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => {
          const nextPausedState = !pausedRef.current;

          pausedRef.current = nextPausedState;
          setIsPaused(nextPausedState);
        }}
        className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
      >
        {isPaused ? "Resume" : "Pause"}
      </button>
      <button
        type="button"
        onClick={() => {
          const parsedSeed = Number(seedInput);

          if (
            !Number.isInteger(parsedSeed) ||
            parsedSeed < 0 ||
            parsedSeed > 4294967295
          ) {
            return;
          }

          pausedRef.current = false;
          setIsPaused(false);
          setExtinctionTime(null);
          setAppliedSeed(parsedSeed);
          setResetKey((key) => key + 1);
        }}
        className="rounded-lg border ml-2 border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
      >
        Reset
      </button>
      <label className="flex items-center gap-2 text-sm text-slate-300">
        Speed :
        <select
          value={simulationSpeed}
          onChange={(event) => {
            const nextSpeed = Number(event.target.value);

            speedRef.current = nextSpeed;
            setSimulationSpeed(nextSpeed);
          }}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
        >
          <option value={0.5}>0.5×</option>
          <option value={1}>1×</option>
          <option value={2}>2×</option>
          <option value={5}>5×</option>
          <option value={10}>10×</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm text-slate-300">
        Seed :
        <input
          type="number"
          min="0"
          max="4294967295"
          step="1"
          value={seedInput}
          onChange={(event) => setSeedInput(event.target.value)}
          className="w-32 ml-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
        />
      </label>
      <label>
        Food Spawn Rate : {foodSpawnRate}/sec
        <input
          type="range"
          min="0"
          max="20"
          step="1"
          value={foodSpawnRate}
          onChange={(event) => {
            const rate = Number(event.target.value);
            setFoodSpawnRate(rate);
            foodSpawnRateRef.current = rate;
          }}
          className="ml-3"
        />
      </label>
      <label className="ml-7">
        Mutation Rate: {mutationRate.toFixed(2)}
        <input
          type="range"
          min="0"
          max="0.25"
          step="0.01"
          value={mutationRate}
          onChange={(event) => {
            const rate = Number(event.target.value);
            setMutationRate(rate);
            mutationRateRef.current = rate;
          }}
          className="ml-3"
        />
      </label>
      <canvas
        ref={canvasRef}
        width={WORLD_WIDTH}
        height={WORLD_HEIGHT}
        onClick={(event) => {
          const canvas = canvasRef.current;
          const rect = canvas.getBoundingClientRect();

          const worldX =
            (event.clientX - rect.left) * (WORLD_WIDTH / rect.width);
          const worldY =
            (event.clientY - rect.top) * (WORLD_HEIGHT / rect.height);

          const world = worldRef.current;

          if (!world) return;

          const clickedOrganism = world.organisms.find((organism) => {
            const dx = organism.x - worldX;
            const dy = organism.y - worldY;

            return dx * dx + dy * dy <= 144;
          });

          const selection = clickedOrganism ?? null;

          selectedOrganismRef.current = selection;
          setSelectedOrganism(selection);
        }}
        className="block h-auto w-full rounded-xl border border-slate-700 bg-slate-900"
        aria-label="EvoWorld simulation environment"
        role="img"
      />
      {atPopulationCap && (
        <p className="rounded-lg border border-amber-700 bg-slate-900 px-3 py-2 text-sm text-amber-300">
          Population cap reached (400). New births are paused until the
          population drops.
        </p>
      )}
      {extinctionTime !== null && (
        <section className="rounded-xl border border-red-700 bg-slate-900 p-4 text-white">
          <h2 className="text-lg font-semibold">Population extinct</h2>
          <p className="mt-1">
            All organisms died after {extinctionTime.toFixed(1)} seconds.
          </p>
          <p className="mt-1 text-sm text-slate-300">
            Choose a seed above and click Reset to start another run.
          </p>
        </section>
      )}

      {selectedOrganism && (
        <section className="rounded-xl border border-slate-700 bg-slate-900 p-4 text-white">
          <h2 className="mb-3 text-lg font-semibold">Organism Inspector</h2>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <p>Energy: {selectedOrganism.energy.toFixed(1)}</p>
            <p>Age: {selectedOrganism.age.toFixed(1)} s</p>
            <p>Generation: {selectedOrganism.generation}</p>
            <p>Speed: {selectedOrganism.genome.speed.toFixed(1)}</p>
            <p>Vision: {selectedOrganism.genome.vision.toFixed(1)}</p>
          </div>
        </section>
      )}
    </div>
  );
}

export default WorldCanvas;
