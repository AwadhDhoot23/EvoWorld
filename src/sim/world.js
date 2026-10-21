import { createRng } from "./rng";
import { createOrganism } from "./organism";
import { createFood } from "./food";
import { updateOrganismMovement } from "./movement";
import { eatNearbyFood } from "./eating";
import { updateOrganismEnergy } from "./energy";
import { reproduceOrganism } from "./reproduction";

const WORLD_WIDTH = 900;
const WORLD_HEIGHT = 600;

const STARTING_ORGANISMS = 100;
const STARTING_FOOD = 120;

const INITIAL_ENERGY = 50;
const INITIAL_SPEED = 60;
const INITIAL_VISION = 60;

const FOOD_SPAWN_RATE = 8;
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
      speed: INITIAL_SPEED,
      vision: INITIAL_VISION,
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
    food,
    steps: 0,
    random,
    foodSpawnAccumulator: 0,
    nextFoodId: STARTING_FOOD + 1,
    nextOrganismId: STARTING_ORGANISMS + 1,
  };
}

export function updateWorld(world, deltaTime) {
  for (const organism of world.organisms) {
    updateOrganismMovement(organism, world.food, deltaTime, world.random);
    updateOrganismEnergy(organism, deltaTime);
    eatNearbyFood(organism, world.food);
    organism.cooldown = Math.max(0, organism.cooldown - deltaTime);
    reproduceOrganism(world, organism);
  }
  world.organisms = world.organisms.filter((organism) => organism.energy > 0);
  world.foodSpawnAccumulator += deltaTime * FOOD_SPAWN_RATE;

  while (world.foodSpawnAccumulator >= 1 && world.food.length < MAX_FOOD) {
    const x = world.random() * world.width;
    const y = world.random() * world.height;

    world.food.push(createFood(world.nextFoodId, x, y));

    world.nextFoodId += 1;
    world.foodSpawnAccumulator -= 1;
  }
  world.steps += 1;
}
