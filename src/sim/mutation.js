const MUTATION_STD_DEV = 0.08

function randomGaussian(random) {
  const u1 = Math.max(random(), Number.EPSILON)
  const u2 = random()

  return Math.sqrt(-2 * Math.log(u1)) *
    Math.cos(2 * Math.PI * u2)
}

export function mutateTrait(value, random) {
  const mutation = randomGaussian(random) * MUTATION_STD_DEV

  return value * (1 + mutation)
}