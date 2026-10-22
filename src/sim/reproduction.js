import { createOrganism } from "./organism.js";
import { mutateTrait, DEFAULT_MUTATION_RATE } from "./mutation.js";
const REPRODUCTION_THRESHOLD = 80;
const PARENT_ENERGY_COST = 50;
const OFFSPRING_ENERGY = 30;
const REPRODUCTION_COOLDOWN = 5;
const POPULATION_CAP = 400;

export function reproduceOrganism(world, organism) {
  if (world.organisms.length + world.newborns.length >= POPULATION_CAP) {
    return false;
  }

  if (organism.energy < REPRODUCTION_THRESHOLD) {
    return false;
  }

  if (organism.cooldown > 0) {
    return false;
  }

  organism.energy -= PARENT_ENERGY_COST;
  organism.cooldown = REPRODUCTION_COOLDOWN;

  const childAngle = world.random() * Math.PI * 2;
  const childDistance = 12;

  const childX = Math.max(
    0,
    Math.min(world.width, organism.x + Math.cos(childAngle) * childDistance),
  );
  const childY = Math.max(
    0,
    Math.min(world.height, organism.y + Math.sin(childAngle) * childDistance),
  );

  const child = createOrganism(
    world.nextOrganismId,
    childX,
    childY,

    world.random() * Math.PI * 2,
    OFFSPRING_ENERGY,
    {
      speed: mutateTrait(
        organism.genome.speed,
        world.random,
        world.mutationRate ?? DEFAULT_MUTATION_RATE,
        20,
        140,
      ),
      vision: mutateTrait(
        organism.genome.vision,
        world.random,
        world.mutationRate ?? DEFAULT_MUTATION_RATE,
        20,
        150,
      ),
    },
  );

  child.generation = organism.generation + 1;

  world.nextOrganismId += 1;
  world.newborns.push(child);

  world.births += 1;
  world.highestGeneration = Math.max(world.highestGeneration, child.generation);

  return true;
}
