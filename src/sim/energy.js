const BASE_COST = 0.5
const SPEED_COST = 0.0005
const VISION_COST = 0.01

export function updateOrganismEnergy(organism, deltaTime) {
  const speed = organism.genome.speed
  const vision = organism.genome.vision

  const costPerSecond =
    BASE_COST +
    SPEED_COST * speed ** 2 +
    VISION_COST * vision

  organism.energy -= costPerSecond * deltaTime
}