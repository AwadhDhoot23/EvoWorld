export const DEFAULT_MUTATION_RATE = 0.08;

export function randomGaussian(random) {
  const u1 = Math.max(random(), Number.EPSILON);
  const u2 = random();

  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export function mutateTrait(
  value,
  random,
  mutationRate = DEFAULT_MUTATION_RATE,
  min = -Infinity,
  max = Infinity,
) {
  const mutation = randomGaussian(random) * mutationRate;
  const mutated = value * (1 + mutation);
  return Math.max(min, Math.min(max, mutated));
}
