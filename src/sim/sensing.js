export function findNearestFood(organism, foodItems) {
  let nearestFood = null
  let nearestDistanceSquared = Infinity

  for (const food of foodItems) {
    const dx = food.x - organism.x
    const dy = food.y - organism.y

    const distanceSquared = dx * dx + dy * dy

    if (
      distanceSquared <= organism.genome.vision ** 2 &&
      distanceSquared < nearestDistanceSquared
    ) {
      nearestFood = food
      nearestDistanceSquared = distanceSquared
    }
  }

  return nearestFood
}