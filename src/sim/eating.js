const EATING_DISTANCE = 8
const FOOD_ENERGY = 30
const MAX_ENERGY = 100

export function eatNearbyFood(organism, foodItems) {
  const foodIndex = foodItems.findIndex((food) => {
    const dx = food.x - organism.x
    const dy = food.y - organism.y

    return dx * dx + dy * dy <= EATING_DISTANCE ** 2
  })

  if (foodIndex === -1) {
    return false
  }

  const food = foodItems[foodIndex]

  organism.energy = Math.min(
    organism.energy + FOOD_ENERGY,
    MAX_ENERGY
  )

  foodItems.splice(foodIndex, 1)

  return true
}