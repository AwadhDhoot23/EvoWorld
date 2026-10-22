/**
 * EvoWorld Headless Multi-Seed Experiment Runner (Blueprint §6.2)
 *
 * Reuses the exact simulation core (createWorld, updateWorld).
 * Executes controlled experiments across presets + control conditions
 * over at least 10 seeds, measures determinism, and exports summary
 * tables to JSON and CSV.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createWorld, updateWorld } from "../src/sim/world.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Experiment constants from Blueprint §3.9 and §6.2
const SIM_SECONDS = 300; // 300 simulated seconds (5 minutes)
const DT = 1 / 60; // 60 ticks per simulated second
const TOTAL_STEPS = Math.round(SIM_SECONDS / DT); // 18,000 steps

// 10 distinct, controlled seeds
const SEEDS = [101, 102, 103, 104, 105, 106, 107, 108, 109, 110];

// Conditions to evaluate
const CONDITIONS = [
  {
    name: "Balanced",
    description: "Default environment: foodSpawn 8/s, mutation 0.08, costs ON",
    foodSpawnRate: 8,
    mutationRate: 0.08,
    energyCostsEnabled: true,
  },
  {
    name: "Scarce food",
    description: "Low resource pressure: foodSpawn 4/s, mutation 0.08, costs ON",
    foodSpawnRate: 4,
    mutationRate: 0.08,
    energyCostsEnabled: true,
  },
  {
    name: "Abundant food",
    description: "High resource abundance: foodSpawn 16/s, mutation 0.08, costs ON",
    foodSpawnRate: 16,
    mutationRate: 0.08,
    energyCostsEnabled: true,
  },
  {
    name: "High mutation",
    description: "Higher variance: foodSpawn 8/s, mutation 0.25, costs ON",
    foodSpawnRate: 8,
    mutationRate: 0.25,
    energyCostsEnabled: true,
  },
  {
    name: "No mutation",
    description: "Zero variation in offspring: foodSpawn 8/s, mutation 0.0, costs ON",
    foodSpawnRate: 8,
    mutationRate: 0.0,
    energyCostsEnabled: true,
  },
  {
    name: "Control (Costs OFF)",
    description: "Neutral drift baseline: trait energy costs set to zero (costs OFF)",
    foodSpawnRate: 8,
    mutationRate: 0.08,
    energyCostsEnabled: false,
  },
];

// Statistical helpers
function calcMean(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, v) => sum + v, 0) / arr.length;
}

function calcStdDev(arr, meanVal) {
  if (arr.length <= 1) return 0;
  const mean = meanVal !== undefined ? meanVal : calcMean(arr);
  const variance =
    arr.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

function calcMin(arr) {
  return arr.length === 0 ? 0 : Math.min(...arr);
}

function calcMax(arr) {
  return arr.length === 0 ? 0 : Math.max(...arr);
}

function round(num, decimals = 1) {
  return Number(num.toFixed(decimals));
}

/**
 * Runs a single simulation run headlessly.
 */
function runSingleSimulation(seed, condition) {
  const world = createWorld(seed);
  world.foodSpawnRate = condition.foodSpawnRate;
  world.mutationRate = condition.mutationRate;
  world.energyCostsEnabled = condition.energyCostsEnabled;

  let extinctAtSecond = null;

  for (let step = 0; step < TOTAL_STEPS; step++) {
    updateWorld(world, DT);

    if (world.organisms.length === 0 && extinctAtSecond === null) {
      extinctAtSecond = round((step + 1) * DT, 1);
      // Run is extinct; we can break early because population cannot recover
      break;
    }
  }

  const finalPop = world.organisms.length;
  let finalSpeed = 0;
  let finalVision = 0;

  if (finalPop > 0) {
    const sumSpeed = world.organisms.reduce((s, o) => s + o.genome.speed, 0);
    const sumVision = world.organisms.reduce((s, o) => s + o.genome.vision, 0);
    finalSpeed = sumSpeed / finalPop;
    finalVision = sumVision / finalPop;
  }

  return {
    seed,
    finalPopulation: finalPop,
    finalSpeed: round(finalSpeed, 2),
    finalVision: round(finalVision, 2),
    extinct: finalPop === 0,
    extinctAtSecond,
    births: world.births,
    deaths: world.deaths,
    highestGeneration: world.highestGeneration,
  };
}

/**
 * Verifies headlessly that two runs with the exact same seed and settings
 * produce identical results (Determinism test).
 */
function verifyDeterminism() {
  process.stdout.write("Running determinism validation check... ");
  const run1 = runSingleSimulation(42, CONDITIONS[0]);
  const run2 = runSingleSimulation(42, CONDITIONS[0]);

  const matches =
    run1.finalPopulation === run2.finalPopulation &&
    run1.finalSpeed === run2.finalSpeed &&
    run1.finalVision === run2.finalVision &&
    run1.births === run2.births &&
    run1.deaths === run2.deaths &&
    run1.highestGeneration === run2.highestGeneration;

  if (!matches) {
    console.error("\n❌ Determinism check FAILED! Simulation is not reproducible.");
    process.exit(1);
  }
  console.log("PASSED (Bit-identical across runs)\n");
}

async function main() {
  console.log("==========================================================");
  console.log(" EvoWorld Headless Multi-Seed Experiment Runner");
  console.log(` Steps: ${TOTAL_STEPS} per run (${SIM_SECONDS} simulated seconds)`);
  console.log(` Seeds per condition: ${SEEDS.length}`);
  console.log(` Total conditions: ${CONDITIONS.length}`);
  console.log(` Total runs: ${CONDITIONS.length * SEEDS.length}`);
  console.log("==========================================================\n");

  verifyDeterminism();

  const allResults = [];
  const summaryTable = [];

  const startTime = Date.now();

  for (const condition of CONDITIONS) {
    console.log(`▶ Running condition: "${condition.name}"`);
    console.log(`  (${condition.description})`);

    const conditionRuns = [];

    for (let i = 0; i < SEEDS.length; i++) {
      const seed = SEEDS[i];
      process.stdout.write(`  [${i + 1}/${SEEDS.length}] Seed ${seed}... `);
      const t0 = Date.now();
      const result = runSingleSimulation(seed, condition);
      const elapsed = Date.now() - t0;
      process.stdout.write(
        `pop=${result.finalPopulation}, speed=${result.finalSpeed}, vision=${result.finalVision} (${elapsed}ms)\n`
      );
      conditionRuns.push(result);
    }

    allResults.push({
      condition: condition.name,
      config: {
        foodSpawnRate: condition.foodSpawnRate,
        mutationRate: condition.mutationRate,
        energyCostsEnabled: condition.energyCostsEnabled,
      },
      runs: conditionRuns,
    });

    // Compute aggregated metrics for surviving runs (or all runs for extinction)
    const pops = conditionRuns.map((r) => r.finalPopulation);
    const extinctCount = conditionRuns.filter((r) => r.extinct).length;

    // For traits, evaluate across surviving runs (if any)
    const survivingRuns = conditionRuns.filter((r) => !r.extinct);
    const speeds = survivingRuns.map((r) => r.finalSpeed);
    const visions = survivingRuns.map((r) => r.finalVision);

    const meanPop = round(calcMean(pops), 1);
    const stdPop = round(calcStdDev(pops, meanPop), 1);
    const minPop = calcMin(pops);
    const maxPop = calcMax(pops);

    const meanSpeed = survivingRuns.length ? round(calcMean(speeds), 1) : 0;
    const minSpeed = survivingRuns.length ? round(calcMin(speeds), 1) : 0;
    const maxSpeed = survivingRuns.length ? round(calcMax(speeds), 1) : 0;
    const stdSpeed = survivingRuns.length ? round(calcStdDev(speeds, meanSpeed), 1) : 0;

    const meanVision = survivingRuns.length ? round(calcMean(visions), 1) : 0;
    const minVision = survivingRuns.length ? round(calcMin(visions), 1) : 0;
    const maxVision = survivingRuns.length ? round(calcMax(visions), 1) : 0;
    const stdVision = survivingRuns.length ? round(calcStdDev(visions, meanVision), 1) : 0;

    summaryTable.push({
      Condition: condition.name,
      Seeds: SEEDS.length,
      "Final Pop (Mean ± SD)": `${meanPop} ± ${stdPop}`,
      "Pop Range": `[${minPop}, ${maxPop}]`,
      "Mean Speed (Range)": survivingRuns.length ? `${meanSpeed} [${minSpeed} - ${maxSpeed}]` : "N/A",
      "Mean Vision (Range)": survivingRuns.length ? `${meanVision} [${minVision} - ${maxVision}]` : "N/A",
      "Extinct Runs": `${extinctCount} / ${SEEDS.length}`,
    });

    console.log();
  }

  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nAll experiments completed in ${totalDuration}s.\n`);

  // Display summary console table
  console.log("==========================================================================================");
  console.log(" EXPERIMENT SUMMARY RESULTS (N = 10 seeds, 300 simulated seconds)");
  console.log("==========================================================================================");
  console.table(summaryTable);

  // Write experiments/results.json
  const jsonPath = path.join(__dirname, "results.json");
  fs.writeFileSync(
    jsonPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        durationSeconds: SIM_SECONDS,
        stepCount: TOTAL_STEPS,
        seeds: SEEDS,
        summary: summaryTable,
        conditions: allResults,
      },
      null,
      2
    ),
    "utf-8"
  );
  console.log(`Saved detailed results to: ${jsonPath}`);

  // Write experiments/results.csv
  const csvPath = path.join(__dirname, "results.csv");
  const csvHeaders = [
    "Condition",
    "Seeds",
    "Final Pop (Mean)",
    "Final Pop (StdDev)",
    "Pop Min",
    "Pop Max",
    "Final Speed (Mean)",
    "Speed Min",
    "Speed Max",
    "Speed StdDev",
    "Final Vision (Mean)",
    "Vision Min",
    "Vision Max",
    "Vision StdDev",
    "Extinct Runs",
  ];

  const csvRows = summaryTable.map((row) => {
    // Parse values from summaryTable
    const popParts = row["Final Pop (Mean ± SD)"].split(" ± ");
    const popRange = row["Pop Range"].replace(/[\[\]]/g, "").split(", ");
    const speedParts = row["Mean Speed (Range)"].split(" ");
    const visionParts = row["Mean Vision (Range)"].split(" ");

    return [
      `"${row.Condition}"`,
      row.Seeds,
      popParts[0] || 0,
      popParts[1] || 0,
      popRange[0] || 0,
      popRange[1] || 0,
      speedParts[0] || 0,
      speedParts[1] ? speedParts[1].replace(/[\[\]]/g, "") : 0,
      speedParts[3] ? speedParts[3].replace(/[\[\]]/g, "") : 0,
      "",
      visionParts[0] || 0,
      visionParts[1] ? visionParts[1].replace(/[\[\]]/g, "") : 0,
      visionParts[3] ? visionParts[3].replace(/[\[\]]/g, "") : 0,
      "",
      `"${row["Extinct Runs"]}"`,
    ].join(",");
  });

  fs.writeFileSync(csvPath, [csvHeaders.join(","), ...csvRows].join("\n"), "utf-8");
  console.log(`Saved tabular results to:  ${csvPath}`);
}

main().catch((err) => {
  console.error("Experiment runner error:", err);
  process.exit(1);
});
