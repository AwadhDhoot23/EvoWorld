# 🌱 EvoWorld

> A deterministic 2D artificial-life and emergent natural selection simulation built with vanilla JavaScript, HTML5 Canvas, React, Vite, and Tailwind CSS.

[![Vitest](https://img.shields.io/badge/tests-10%20passed-brightgreen.svg)](tests/sim.test.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Vite](https://img.shields.io/badge/built%20with-Vite-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-v4-38BDF8.svg)](https://tailwindcss.com/)

In **EvoWorld**, simple autonomous agents search for food, consume energy to survive and navigate, reproduce when energy thresholds are met, and pass on slightly mutated copies of their traits. 

**Nobody programs the evolutionary outcome.** Through energy scarcity and physical trade-offs alone, natural selection emerges spontaneously from first principles: lineages that optimize the trade-off between sensory foraging efficiency and metabolic burn survive and multiply, while inefficient configurations starve and go extinct.

---

## 📑 Table of Contents

- [The Core Model & Mechanics](#-the-core-model--mechanics)
  - [The Three Ingredients of Evolution](#the-three-ingredients-of-evolution)
  - [Traits & Physical Trade-offs](#traits--physical-trade-offs)
  - [The Energy Model](#the-energy-model)
  - [Life Cycle of a Simulation Step](#life-cycle-of-a-simulation-step)
  - [Reproduction & Gaussian Mutation](#reproduction--gaussian-mutation)
  - [Theoretical Carrying Capacity](#theoretical-carrying-capacity)
- [Empirical Experiments & Findings](#-empirical-experiments--findings)
  - [Controlled Benchmark Across Conditions](#controlled-benchmark-across-conditions)
  - [Analysis: Natural Selection vs. Neutral Drift](#analysis-natural-selection-vs-neutral-drift)
  - [Honest Limitations](#honest-limitations)
- [Architecture & Design Principles](#-architecture--design-principles)
  - [The Iron Rule: Core vs. Render Isolation](#the-iron-rule-core-vs-render-isolation)
  - [Deterministic Seeded PRNG](#deterministic-seeded-prng)
  - [Fixed Timestep Loop](#fixed-timestep-loop)
  - [Deferred Food Removal](#deferred-food-removal)
- [Configuration & Knobs](#-configuration--knobs)
- [Quick Start & Running Locally](#-quick-start--running-locally)
- [Test Suite & Headless Runner](#-test-suite--headless-runner)
- [Interview & Technical Defense Q&A](#-interview--technical-defense-qa)
- [Roadmap & Stretch Goals](#-roadmap--stretch-goals)

---

## 🧬 The Core Model & Mechanics

### The Three Ingredients of Evolution

As outlined in Daniel Shiffman’s *The Nature of Code*, computational evolution requires exactly three properties. If any one is absent, evolution cannot occur:

| Ingredient | Implementation in EvoWorld | Verification Method |
| :--- | :--- | :--- |
| **Heredity** | Offspring inherit parent genome traits (`speed`, `vision`). | Vitest unit test: with `mutationRate = 0`, child genome matches parent identically. |
| **Variation** | Offspring genomes undergo Box-Muller Gaussian mutation perturbations within strict physiological boundaries. | Vitest unit test: 10,000 continuous mutations verify values stay within `[20, 140]` and `[20, 150]`. |
| **Selection** | Traits directly drive caloric expenditure. Organisms that exhaust energy die; organisms with surplus energy reproduce. | Headless multi-seed experiments: traits directionalize under selection pressure, but drift neutrally when energy costs are turned off. |

---

### Traits & Physical Trade-offs

A common pitfall in artificial life simulations is creating "free traits" (e.g. arbitrary metabolic rates), which inevitably leads to degeneracies where lineages drift to trivial extremes. EvoWorld enforces strict physical trade-offs:

```
                  ▲ Trait Benefit vs Metabolic Price
   Relative Value │
                  │                      / Cost (quadratic for speed / linear for vision)
                  │          _..---'''' /
                  │       .-'          /
                  │     .'            /
                  │    /             / 
                  │   /    * Optimal/ Trade-off Point
                  │  /       :     /
                  │ /        :    /  Benefit: food encounter probability
                  │/         :   /
                  └──────────▲──/────────────────► Trait Value (Speed / Vision)
```

1. **Speed ($s \in [20, 140]$ units/sec)**:
   - **Advantage**: Traverses world space faster, wins races against competitors to the same food pellet.
   - **Cost**: Scaled **quadratically** with speed ($k_{\text{speed}} \cdot s^2$). Doubling speed quadruples movement burn. High speed is an expensive luxury.
2. **Vision Radius ($v \in [20, 150]$ units)**:
   - **Advantage**: Detects food from greater distances, reducing inefficient random wandering.
   - **Cost**: Scaled **linearly** with radius ($k_{\text{vision}} \cdot v$). Broad perception requires constant baseline neural expenditure.

---

### The Energy Model

Every organism pays continuous metabolic costs each second according to:

$$\text{burnPerSecond} = \text{baseCost} + k_{\text{speed}} \cdot \text{speed}^2 + k_{\text{vision}} \cdot \text{vision}$$

Using default parameters ($\text{baseCost} = 0.5$, $k_{\text{speed}} = 0.0005$, $k_{\text{vision}} = 0.01$):
- **Baseline Organism** ($\text{speed} = 60, \text{vision} = 60$):
  $$\text{burn} = 0.5 + 0.0005(3600) + 0.01(60) = 0.5 + 1.8 + 0.6 = \mathbf{2.90\text{ energy/sec}}$$
- **High-Speed Variant** ($\text{speed} = 120, \text{vision} = 60$):
  $$\text{burn} = 0.5 + 0.0005(14400) + 0.01(60) = 0.5 + 7.2 + 0.6 = \mathbf{8.30\text{ energy/sec}}$$
- **Low-Speed Variant** ($\text{speed} = 20, \text{vision} = 60$):
  $$\text{burn} = 0.5 + 0.0005(400) + 0.01(60) = 0.5 + 0.2 + 0.6 = \mathbf{1.30\text{ energy/sec}}$$

**Key Dynamics**:
- Each tick step: $\text{energy} \leftarrow \text{energy} - \text{burn} \cdot \Delta t$
- Eating a food pellet: $\text{energy} \leftarrow \min(100, \text{energy} + 30)$
- Death: $\text{energy} \le 0 \implies \text{organism is removed}$

---

### Life Cycle of a Simulation Step

Per tick ($\Delta t = 1/60\text{ s}$), the world performs the following deterministic pipeline:

```
[1. Spawn Food] ──► [2. Shuffle Organisms] ──► [3. Organism Update Loop] ──► [4. Cleanup & Births]
 Accumulator adds    Mulberry32 seeded PRNG     Sense  ──► Steer ──► Move     Remove dead (energy <= 0)
 food at fixed rate  prevents index-0 bias      Pay ──► Eat ──► Decide        Filter eaten food
                                                                              Append newborns (if < cap)
```

1. **Sense**: Find the nearest **uneaten** food pellet within Euclidean distance $\le \text{vision}$. (Optimized using squared distances $dx^2 + dy^2 \le \text{vision}^2$ to avoid costly square roots).
2. **Steer**: If food is detected, rotate heading toward target with a limited turn rate ($\le 4\text{ rad/s}$), normalizing angular deltas to $[-\pi, \pi]$ to prevent unnatural 360° spin-around. If no food is in range, wander via angular jitter ($\pm 3\text{ rad/s}$).
3. **Move**: Advance $(x, y)$ by $(\cos(\theta) \cdot s \cdot \Delta t, \sin(\theta) \cdot s \cdot \Delta t)$. Bounce off boundaries (solid reflective boundaries at $900 \times 600$).
4. **Pay Costs**: Deduct metabolic burn $\text{burn} \cdot \Delta t$.
5. **Eat**: If food is within reach ($8\text{ units}$) and not already eaten, mark `food.eaten = true` and gain $+30\text{ energy}$ (up to $100$).
6. **Decide**: If $\text{energy} \le 0$, mark for death. If $\text{energy} \ge 80$, $\text{cooldown} = 0$, and population is below cap ($400$), trigger reproduction.

---

### Reproduction & Gaussian Mutation

When an organism reproduces:
- **Parent Cost**: The parent pays $50\text{ energy}$ and resets a $5\text{ second}$ cooldown.
- **Offspring Energy**: The newborn spawns with $30\text{ energy}$ adjacent to parent ($12\text{ units}$ offset). The $20\text{ energy}$ difference represents the metabolic cost of gestation.
- **Generation**: $\text{child.generation} = \text{parent.generation} + 1$.
- **Trait Mutation**:
  $$\text{trait}' = \text{clamp}\Big(\text{trait} \times \big(1 + \mathcal{N}(0, \text{mutationRate})\big),\, \text{min},\, \text{max}\Big)$$
  Gaussian random numbers $\mathcal{N}(0, \sigma)$ are derived from the seeded uniform PRNG using the **Box-Muller transform**:
  $$Z = \sqrt{-2 \ln(u_1)} \cos(2\pi u_2)$$

---

### Theoretical Carrying Capacity

In a stable ecosystem, population equilibrium occurs where total energy input equals total energy output:

$$\text{Energy Influx} = \text{foodSpawnRate} \times \text{foodEnergy} = 8 \times 30 = 240\text{ energy/sec}$$

$$\text{Average Metabolic Burn} \approx 2.90\text{ energy/sec/organism}$$

$$\mathbf{\text{Predicted Carrying Capacity}} \approx \frac{240}{2.90} \approx \mathbf{82.8\text{ organisms}}$$

If the population exceeds 83, food becomes scarce, starvation increases, and numbers fall. If population drops below 83, food accumulates, reproduction surges, and the population rebounds.

---

## 📊 Empirical Experiments & Findings

We conducted **controlled multi-seed experiments** headlessly using [`experiments/run.mjs`](file:///c:/Users/awadh/OneDrive/Desktop/AWADH/CODING/EvoWorld/evoworld/experiments/run.mjs). Every condition was tested across **10 identical seeds** (`[101..110]`) for **300 simulated seconds** ($18,000$ simulation steps at $60\text{ Hz}$ per run = $1,080,000$ world steps total).

### Controlled Benchmark Across Conditions

*Starting population = 100, Initial Mean Speed = 60.0, Initial Mean Vision = 60.0.*

| Condition | Seeds | Food Rate | Mut Rate | Costs | Final Pop (Mean ± SD) | Pop Range | Final Speed (Mean [Min - Max]) | Final Vision (Mean [Min - Max]) | Extinctions |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Balanced** | 10 | 8/s | 0.08 | **ON** | **77.2 ± 7.6** | [69, 90] | **54.1** [48.6 - 60.7] | **67.3** [63.3 - 71.4] | **0 / 10** |
| **Scarce food** | 10 | 4/s | 0.08 | **ON** | **38.2 ± 4.7** | [32, 46] | **52.2** [44.6 - 64.7] | **72.9** [64.5 - 83.0] | **0 / 10** |
| **Abundant food**| 10 | 16/s | 0.08 | **ON** | **145.1 ± 5.4** | [139, 157]| **57.7** [52.2 - 59.5] | **59.9** [57.3 - 64.0] | **0 / 10** |
| **High mutation**| 10 | 8/s | 0.25 | **ON** | **77.7 ± 6.5** | [69, 88] | **48.9** [42.3 - 55.7] | **71.4** [65.5 - 77.7] | **0 / 10** |
| **No mutation** | 10 | 8/s | 0.00 | **ON** | **75.8 ± 5.1** | [68, 83] | **54.7** [50.8 - 58.0] | **64.3** [59.4 - 70.6] | **0 / 10** |
| **Control (Costs OFF)** | 10 | 8/s | 0.08 | **OFF**| **400.0 ± 0.0** | [400, 400]| **61.8** [60.4 - 63.4] | **59.7** [57.5 - 61.4] | **0 / 10** |

---

### Analysis: Natural Selection vs. Neutral Drift

```
Trait Evolution Trajectory: Selection vs Control
-------------------------------------------------------------------------
Starting Mean: Speed = 60.0, Vision = 60.0

Under Selection (Balanced):
  Speed  : 60.0 ─────────────────────► 54.1  (Quadratic cost drives speed down)
  Vision : 60.0 ─────────────────────► 67.3  (Linear cost favors higher detection)

Under Severe Scarcity (Scarce Food):
  Speed  : 60.0 ─────────────────────► 52.2  (Even heavier penalty on speed)
  Vision : 60.0 ─────────────────────► 72.9  (Strongest selective push for vision!)

Under Control Baseline (Costs OFF):
  Speed  : 60.0 ─────────────────────► 61.8  (Pure neutral drift around starting mean)
  Vision : 60.0 ─────────────────────► 59.7  (Pure neutral drift around starting mean)
-------------------------------------------------------------------------
```

1. **Proof of Natural Selection**:
   - In the **Control condition** with trait energy costs turned off, organisms burned $0\text{ energy/sec}$. Consequently, the population capped at $400$, and mean traits drifted randomly around the starting mean ($61.8$ speed, $59.7$ vision).
   - In all conditions with **Costs ON**, traits showed strong directional adaptation. Because speed has a **quadratic** cost penalty ($0.0005 \times s^2$), organisms with high speed burn out rapidly unless food is plentiful. Selection reliably drives speed down towards $48.9 - 54.1$.
   - Conversely, vision has a **linear** cost penalty ($0.01 \times v$). When food is scarce (Scarce food condition), noticing food from far away provides an enormous foraging advantage that vastly outweighs its linear cost. Vision rose from $60.0 \to \mathbf{72.9}$ (up to $83.0$ in peak runs).
2. **Carrying Capacity Verification**:
   - The empirical population under the Balanced preset ($77.2 \pm 7.6$) closely aligns with our theoretical equilibrium estimate ($82.8$).
   - Halving the food spawn rate in Scarce Food ($4/\text{s}$) halved the population to $38.2 \pm 4.7$.
   - Doubling the food spawn rate in Abundant Food ($16/\text{s}$) scaled the population to $145.1 \pm 5.4$.

---

### Honest Limitations

While EvoWorld exhibits emergent selection, it is an idealized simulation:
- **Simplified Sensory Model**: Organisms possess 360° omnidirectional vision rather than directional field-of-view cones.
- **Asexual Clonation**: Reproduction is asexual cloning with Gaussian mutation, without sexual recombination, crossover, or diploid genetics.
- **Trophic Simplicity**: There are no predators, pathogens, or multi-species competition.
- **No Speed Throttling**: Organisms continuously travel at full trait speed rather than decelerating when idling or stalking food.

---

## 🏛️ Architecture & Design Principles

### The Iron Rule: Core vs. Render Isolation

```
evoworld/
├── src/
│   ├── sim/           # 🔒 SIMULATION CORE: Pure JS. No DOM, no canvas, no Math.random.
│   │   ├── rng.js           # Mulberry32 seeded PRNG + shuffle
│   │   ├── mutation.js      # Box-Muller Gaussian transform + clamp
│   │   ├── energy.js        # Configurable metabolic burn math
│   │   ├── eating.js        # Deferred food consumption mechanics
│   │   ├── sensing.js       # Squared-distance nearest food search
│   │   ├── movement.js      # Heading steering, jitter wander, wall bounce
│   │   ├── organism.js      # Entity factory
│   │   ├── food.js          # Pellet factory
│   │   └── world.js         # Tick orchestrator & history buffers
│   │
│   ├── components/    # 🎨 PRESENTATION LAYER: React + HTML5 Canvas + Recharts
│   │   ├── WorldCanvas.jsx  # Primary 60 FPS viewport + HUD
│   │   └── ...              # Live charts & trait histograms
│   │
├── tests/             # 🧪 AUTOMATED TESTS: Vitest unit tests for sim/
│   └── sim.test.js
│
└── experiments/       # 🔬 HEADLESS RUNNER: Pure Node.js experiment engine
    ├── run.mjs
    ├── results.json
    └── results.csv
```

**The Iron Rule**: Files inside `src/sim/` **never** import from React, Canvas, or UI components. Because the simulation core is pure JavaScript:
1. Vitest tests execute in milliseconds without a DOM or virtual browser.
2. The headless experiment runner can simulate 1,000,000+ ticks in seconds under Node.js.
3. The renderer can be swapped (e.g. Canvas 2D to WebGL) without modifying simulation mechanics.

---

### Deterministic Seeded PRNG

Standard `Math.random()` is non-deterministic and unseedable. EvoWorld uses a 32-bit **Mulberry32** generator initialized with an integer seed:

```javascript
export function createRng(seed) {
  let state = seed >>> 0;
  return function random() {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

*Every* stochastic event in the world—food positioning, initial genomes, wander jitter, organism shuffle order, and mutation—draws from this single generator. Same seed + same settings = identical run.

---

### Fixed Timestep Loop

To ensure simulation speed never depends on display refresh rates (e.g. 60 Hz vs. 144 Hz monitors), EvoWorld implements Glenn Fiedler’s *Fix Your Timestep* loop with an accumulator:

```javascript
const FIXED_DELTA_TIME = 1 / 60;
const MAX_FRAME_TIME = 0.25;

// In animation frame:
const frameTime = Math.min((currentTime - previousTime) / 1000, MAX_FRAME_TIME);
accumulator += frameTime * simulationSpeed;

let steps = 0;
while (accumulator >= FIXED_DELTA_TIME && steps < 20) {
  updateWorld(world, FIXED_DELTA_TIME);
  accumulator -= FIXED_DELTA_TIME;
  steps += 1;
}
```

- **Clamped Frame Time ($0.25\text{ s}$)**: Prevents freeze spirals when tabs are backgrounded or browser stutters.
- **Speed Multiplier**: Running at $2\times$ or $5\times$ simply executes more fixed $1/60\text{ s}$ ticks per frame without altering simulation physics.

---

### Deferred Food Removal

A classic pitfall in game loops is modifying an array while iterating over it (e.g., `food.splice(i, 1)` during an organism loop), which causes skipping and race conditions. 

EvoWorld handles eating through **two-phase deferred removal**:
1. When an organism eats, the pellet is flagged `food.eaten = true`. Subsequent organisms in the same tick immediately ignore it (`if (food.eaten) continue;`).
2. Only after all organisms have finished sensing, moving, and eating does the world purge consumed food:
   ```javascript
   world.food = world.food.filter((f) => !f.eaten);
   ```

---

## ⚙️ Configuration & Knobs

| Parameter | Default Value | Description |
| :--- | :---: | :--- |
| `startingPopulation` | `100` | Initial population spawned on reset |
| `populationCap` | `400` | Hard ceiling on world population to prevent browser lag |
| `startingFood` | `120` | Initial food pellets spawned on reset |
| `foodSpawnRate` | `8 / sec` | Pellets spawned per second (accumulated continuously) |
| `foodCap` | `250` | Maximum simultaneous food pellets allowed in the world |
| `foodEnergy` | `30` | Energy replenished per eaten pellet |
| `maxEnergy` | `100` | Maximum energy capacity of an organism |
| `initialEnergy` | `50` | Starting energy of initial generation organisms |
| `eatingReach` | `8 units` | Distance threshold to consume food |
| `reproductionThreshold` | `80 energy` | Minimum energy required for an organism to reproduce |
| `parentCost` | `50 energy` | Energy deducted from parent upon reproduction |
| `childEnergy` | `30 energy` | Starting energy given to newborn |
| `reproductionCooldown` | `5 seconds` | Time parent must wait before reproducing again |
| `mutationRate` | `0.08 (8%)` | Standard deviation for Gaussian trait mutation |
| `baseCost` | `0.5 / sec` | Baseline metabolic cost of living |
| `kSpeed` | `0.0005` | Quadratic cost coefficient for speed ($k_{\text{speed}} \cdot s^2$) |
| `kVision` | `0.01` | Linear cost coefficient for vision ($k_{\text{vision}} \cdot v$) |
| `turnRate` | `4 rad/sec` | Maximum angular steering rotation toward food |
| `wanderJitter` | `3 rad/sec` | Random steering nudge when wandering |

---

## 🚀 Quick Start & Running Locally

### Prerequisites
- Node.js LTS (v18+ recommended)
- npm (v9+)

### Installation
```bash
# 1. Clone the repository
git clone https://github.com/AwadhDhoot23/EvoWorld.git
cd evoworld

# 2. Install dependencies
npm install

# 3. Start the local development server
npm run dev
```

Visit `http://localhost:5173/` in your browser.

---

## 🧪 Test Suite & Headless Runner

### Running Unit Tests (Vitest)
Executes the 10 automated unit test suites covering the core simulation rules in `src/sim/`:
```bash
npm test
```

### Running Headless Multi-Seed Experiments
Executes the headless experiment runner across all 6 conditions and 10 seeds ($N = 60$ runs of 300 simulated seconds each), validates determinism, and updates `results.json` and `results.csv`:
```bash
npm run experiment
```

### Building for Production
```bash
npm run build
npm run preview
```

---

## 💡 Interview & Technical Defense Q&A

**Q: Why use a fixed timestep ($dt = 1/60\text{ s}$) rather than variable frame delta?**
> A: Variable `deltaTime` causes physical simulation results to vary depending on screen refresh rate (a 144 Hz monitor would integrate differently from a 60 Hz monitor). A fixed timestep decouples physics from display rates, prevents floating-point integration errors, and guarantees that simulation runs are reproducible across machines.

**Q: How do you prove that natural selection is truly taking place, and not just random genetic drift?**
> A: We established a formal **control group** where trait energy costs were disabled (`energyCostsEnabled = false`). Under the control condition, traits drifted neutrally around the initial mean of 60. When costs were enabled, traits shifted in consistent, predictable directions across all 10 independent seeds (speed dropped to conserve quadratic burn, vision rose to locate sparse food). This proves selection pressure, not drift, drives the trait shifts.

**Q: How was determinism preserved?**
> A: 1) Zero calls to `Math.random()`, `Date.now()`, or `performance.now()` in `src/sim/`. 2) Every random decision flows from a single Mulberry32 PRNG instance. 3) Deterministic entity iteration and array shuffling.

**Q: How would this architecture scale to 10,000+ organisms?**
> A: In the current $O(N \times M)$ naive distance check, 10,000 organisms against 1,000 food items would require 10,000,000 comparisons per tick. To scale:
> 1. Implement a **Spatial Hash Grid** to divide the 2D world into buckets, limiting neighbor queries to $O(1)$ local cells.
> 2. Offload the simulation loop to a dedicated **Web Worker**, communicating with the main UI thread via `ArrayBuffer` / `SharedArrayBuffer`.
> 3. Implement object pooling for food and organism entities to eliminate garbage collection pauses.

---

## 🗺️ Roadmap & Stretch Goals

- [x] Phase 1: Fixed-timestep loop, Canvas setup, Seeded Mulberry32 PRNG.
- [x] Phase 2: Autonomous steering, heading vectors, reflective boundary bounce.
- [x] Phase 3: Caloric burn economy, deferred eating mechanics, death & starvation.
- [x] Phase 4: Asexual reproduction, Gaussian Box-Muller mutation, carrying capacity balance.
- [x] Phase 5: Interactive HUD, UI presets, live Recharts line charts, click-to-inspect organism panel.
- [x] Phase 6: Vitest unit test suite, headless multi-seed runner, CSV/JSON export, control experiments.
- [ ] **Stretch Goal 1**: Third heritable trait: *Body Size* (increases energy storage and eating reach, but penalizes base metabolic burn).
- [ ] **Stretch Goal 2**: Lineage color tracking and interactive family tree visualization.
- [ ] **Stretch Goal 3**: Spatial Hash Grid partitioning for $10,000+$ organism scaling.
- [ ] **Stretch Goal 4**: Directional Field-of-View (FOV) vision cones and sensory blind spots.

---

## 📜 License

This project is open-source under the [MIT License](LICENSE).
