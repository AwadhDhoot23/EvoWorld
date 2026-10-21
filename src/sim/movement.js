import { findNearestFood } from "./sensing";

const TURN_RATE = 4;
const WANDER_JITTER = 3;

export function updateOrganismMovement(organism, foodItems, deltaTime, random) {
  const targetFood = findNearestFood(organism, foodItems);

  if (targetFood) {
    const dx = targetFood.x - organism.x;
    const dy = targetFood.y - organism.y;

    const targetHeading = Math.atan2(dy, dx);

    const angleDifference = Math.atan2(
      Math.sin(targetHeading - organism.heading),
      Math.cos(targetHeading - organism.heading),
    );

    const maxTurn = TURN_RATE * deltaTime;

    const turn = Math.max(-maxTurn, Math.min(maxTurn, angleDifference));

    organism.heading += turn;
  } else {
    const turn = (random() * 2 - 1) * WANDER_JITTER;
    organism.heading += turn * deltaTime;
  }

  organism.x += Math.cos(organism.heading) * organism.genome.speed * deltaTime;

  organism.y += Math.sin(organism.heading) * organism.genome.speed * deltaTime;

  // Keep the organism inside the world.
  if (organism.x < 0) {
    organism.x = 0;
    organism.heading = Math.PI - organism.heading;
  } else if (organism.x > 900) {
    organism.x = 900;
    organism.heading = Math.PI - organism.heading;
  }

  if (organism.y < 0) {
    organism.y = 0;
    organism.heading = -organism.heading;
  } else if (organism.y > 600) {
    organism.y = 600;
    organism.heading = -organism.heading;
  }
}
