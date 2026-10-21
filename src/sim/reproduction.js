import { createOrganism } from "./organism";
import { mutateTrait } from "./mutation";

const REPRODUCTION_THRESHOLD = 80;
const PARENT_ENERGY_COST = 50;
const OFFSPRING_ENERGY = 30;
const REPRODUCTION_COOLDOWN = 5;
const POPULATION_CAP = 400;

export function reproduceOrganism(world, organism) {
  if (world.organisms.length >= POPULATION_CAP) {
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

  const child = createOrganism(
    world.nextOrganismId,
    organism.x,
    organism.y,
    world.random() * Math.PI * 2,
    OFFSPRING_ENERGY,
    {
      speed: Math.max(
        20,
        Math.min(140, mutateTrait(organism.genome.speed, world.random)),
      ),
      vision: Math.max(
        20,
        Math.min(150, mutateTrait(organism.genome.vision, world.random)),
      ),
    },
  );

  child.generation = organism.generation + 1;

  world.nextOrganismId += 1;
  world.organisms.push(child);

  return true;
}
