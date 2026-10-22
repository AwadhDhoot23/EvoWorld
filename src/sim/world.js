import { createRng, shuffle } from "./rng.js";
import { createOrganism } from "./organism.js";
import { createFood } from "./food.js";
import { updateOrganismMovement } from "./movement.js";
import { eatNearbyFood } from "./eating.js";
import { reproduceOrganism } from "./reproduction.js";
import { DEFAULT_MUTATION_RATE, randomGaussian } from "./mutation.js";
import { updateOrganismEnergy, DEFAULT_ENERGY_COSTS } from "./energy.js";

const WORLD_WIDTH = 900;
const WORLD_HEIGHT = 600;

const STARTING_ORGANISMS = 100;
const STARTING_FOOD = 120;

const INITIAL_ENERGY = 50;
const INITIAL_SPEED = 60;
const INITIAL_VISION = 60;

export const DEFAULT_FOOD_SPAWN_RATE = 8;
const MAX_FOOD = 250;

export function createWorld(seed = 42) {
  const random = createRng(seed);

  const organisms = [];
  const food = [];

  for (let i = 0; i < STARTING_ORGANISMS; i++) {
    const x = random() * WORLD_WIDTH;
    const y = random() * WORLD_HEIGHT;
    const heading = random() * Math.PI * 2;

    const genome = {
      speed: Math.max(
        20,
        Math.min(140, INITIAL_SPEED * (1 + randomGaussian(random) * 0.15)),
      ),
      vision: Math.max(
        20,
        Math.min(150, INITIAL_VISION * (1 + randomGaussian(random) * 0.15)),
      ),
    };

    const organism = createOrganism(
      i + 1,
      x,
      y,
      heading,
      INITIAL_ENERGY,
      genome,
    );

    organisms.push(organism);
  }

  for (let i = 0; i < STARTING_FOOD; i++) {
    const x = random() * WORLD_WIDTH;
    const y = random() * WORLD_HEIGHT;

    const item = createFood(i + 1, x, y);

    food.push(item);
  }

  return {
    width: WORLD_WIDTH,
    height: WORLD_HEIGHT,
    seed,
    organisms,
    newborns: [],
    food,
    steps: 0,
    births: 0,
    deaths: 0,
    totalLifespan: 0,
    highestGeneration: 0,
    history: {
      population: [],
      food: [],
      meanSpeed: [],
      meanVision: [],
    },
    historySampleAccumulator: 0,
    random,
    foodSpawnAccumulator: 0,
    foodSpawnRate: DEFAULT_FOOD_SPAWN_RATE,
    mutationRate: DEFAULT_MUTATION_RATE,
    nextFoodId: STARTING_FOOD + 1,
    nextOrganismId: STARTING_ORGANISMS + 1,
    energyCosts: { ...DEFAULT_ENERGY_COSTS },
    energyCostsEnabled: true,
  };
}

export function updateWorld(world, deltaTime) {
  world.foodSpawnAccumulator +=
    deltaTime * (world.foodSpawnRate ?? DEFAULT_FOOD_SPAWN_RATE);

  while (world.foodSpawnAccumulator >= 1 - 1e-9 && world.food.length < MAX_FOOD) {
    const x = world.random() * world.width;
    const y = world.random() * world.height;

    world.food.push(createFood(world.nextFoodId, x, y));

    world.nextFoodId += 1;
    world.foodSpawnAccumulator -= 1;
    if (world.foodSpawnAccumulator < 0) {
      world.foodSpawnAccumulator = 0;
    }
  }

  if (world.food.length >= MAX_FOOD) {
    world.foodSpawnAccumulator = 0;
  }
  const organismsToUpdate = shuffle(world.organisms, world.random);

  for (const organism of organismsToUpdate) {
    organism.age += deltaTime;

    updateOrganismMovement(organism, world.food, deltaTime, world.random);
    updateOrganismEnergy(
      organism,
      deltaTime,
      world.energyCostsEnabled
        ? world.energyCosts
        : { baseCost: 0, speedCost: 0, visionCost: 0 },
    );

    eatNearbyFood(organism, world.food);
    organism.cooldown = Math.max(0, organism.cooldown - deltaTime);
    reproduceOrganism(world, organism);
  }

  world.food = world.food.filter((food) => !food.eaten);

  const survivors = [];

  for (const organism of world.organisms) {
    if (organism.energy > 0) {
      survivors.push(organism);
    } else {
      world.deaths += 1;
      world.totalLifespan += organism.age;
    }
  }

  world.organisms = survivors;
  world.organisms.push(...world.newborns);
  world.newborns = [];

  world.historySampleAccumulator += deltaTime;

  if (world.historySampleAccumulator >= 1) {
    world.historySampleAccumulator -= 1;

    const population = world.organisms.length;

    const meanSpeed =
      population > 0
        ? world.organisms.reduce(
            (sum, organism) => sum + organism.genome.speed,
            0,
          ) / population
        : 0;

    const meanVision =
      population > 0
        ? world.organisms.reduce(
            (sum, organism) => sum + organism.genome.vision,
            0,
          ) / population
        : 0;

    world.history.population.push(population);
    world.history.food.push(world.food.length);
    world.history.meanSpeed.push(meanSpeed);
    world.history.meanVision.push(meanVision);

    const maxSamples = 600;

    for (const series of Object.values(world.history)) {
      if (series.length > maxSamples) {
        series.shift();
      }
    }
  }
  world.steps += 1;
}
