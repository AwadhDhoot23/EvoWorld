
const EATING_DISTANCE = 8
const FOOD_ENERGY = 30
const MAX_ENERGY = 100

export function eatNearbyFood(organism, foodItems) {
  const food = foodItems.find((item) => {
    if (item.eaten) return false

    const dx = item.x - organism.x
    const dy = item.y - organism.y

    return dx * dx + dy * dy <= EATING_DISTANCE ** 2
  })

  if (!food) return false

  food.eaten = true

  organism.energy = Math.min(
    organism.energy + FOOD_ENERGY,
    MAX_ENERGY
  )

  return true
}
