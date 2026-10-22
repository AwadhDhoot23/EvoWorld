
export const DEFAULT_ENERGY_COSTS = {
  baseCost: 0.5,
  speedCost: 0.0005,
  visionCost: 0.01,
}

export function updateOrganismEnergy(
  organism,
  deltaTime,
  costs = DEFAULT_ENERGY_COSTS
) {
  const speed = organism.genome.speed
  const vision = organism.genome.vision

  const costPerSecond =
    costs.baseCost +
    costs.speedCost * speed ** 2 +
    costs.visionCost * vision

  organism.energy -= costPerSecond * deltaTime
}
