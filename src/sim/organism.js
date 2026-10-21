export function createOrganism(id, x, y, heading, energy, genome) {
  return {
    id,
    x,
    y,
    heading,
    energy,
    age: 0,
    generation: 0,
    cooldown: 0,
    genome,
  }
}