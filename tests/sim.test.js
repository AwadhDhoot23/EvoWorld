import { describe, it, expect } from "vitest";
import { createRng, shuffle } from "../src/sim/rng.js";
import { updateOrganismEnergy, DEFAULT_ENERGY_COSTS } from "../src/sim/energy.js";
import { eatNearbyFood } from "../src/sim/eating.js";
import { createWorld, updateWorld } from "../src/sim/world.js";
import { mutateTrait } from "../src/sim/mutation.js";
import { reproduceOrganism } from "../src/sim/reproduction.js";
import { createOrganism } from "../src/sim/organism.js";
import { createFood } from "../src/sim/food.js";

describe("EvoWorld Simulation Core (Blueprint §6.1)", () => {
  describe("RNG", () => {
    it("produces deterministic sequences in [0, 1) for the same seed", () => {
      const rng1 = createRng(42);
      const rng2 = createRng(42);
      const rngDiff = createRng(999);

      const seq1 = Array.from({ length: 100 }, () => rng1());
      const seq2 = Array.from({ length: 100 }, () => rng2());
      const seqDiff = Array.from({ length: 100 }, () => rngDiff());

      // Values must be within [0, 1)
      for (const val of seq1) {
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(1);
      }

      // Same seed gives identical sequences
      expect(seq1).toEqual(seq2);

      // Different seeds give different sequences
      expect(seq1).not.toEqual(seqDiff);
    });

    it("shuffles deterministically", () => {
      const rng1 = createRng(100);
      const rng2 = createRng(100);

      const list1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const list2 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      expect(shuffle(list1, rng1)).toEqual(shuffle(list2, rng2));
    });
  });

  describe("Energy cost", () => {
    it("burn per second equals baseCost + kSpeed * speed^2 + kVision * vision", () => {
      // Starting parameters: baseCost 0.5, kSpeed 0.0005, kVision 0.01
      // For speed 60, vision 60: 0.5 + 0.0005 * 3600 + 0.01 * 60 = 0.5 + 1.8 + 0.6 = 2.9 per second
      const organism = createOrganism(1, 100, 100, 0, 50, { speed: 60, vision: 60 });

      updateOrganismEnergy(organism, 1.0, DEFAULT_ENERGY_COSTS);
      expect(organism.energy).toBeCloseTo(50 - 2.9, 5);

      // Speed 120, vision 60: 0.5 + 0.0005 * 14400 + 0.01 * 60 = 0.5 + 7.2 + 0.6 = 8.3 per second
      const fastOrganism = createOrganism(2, 100, 100, 0, 50, { speed: 120, vision: 60 });
      updateOrganismEnergy(fastOrganism, 1.0, DEFAULT_ENERGY_COSTS);
      expect(fastOrganism.energy).toBeCloseTo(50 - 8.3, 5);

      // Controls: costs off (zero costs)
      const freeOrganism = createOrganism(3, 100, 100, 0, 50, { speed: 120, vision: 60 });
      updateOrganismEnergy(freeOrganism, 1.0, { baseCost: 0, speedCost: 0, visionCost: 0 });
      expect(freeOrganism.energy).toBe(50);
    });
  });

  describe("Eating", () => {
    it("eats a pellet at most once and caps energy at 100", () => {
      const food = createFood(1, 100, 100);
      const foodItems = [food];

      const org1 = createOrganism(1, 102, 100, 0, 50, { speed: 60, vision: 60 });
      const org2 = createOrganism(2, 103, 100, 0, 50, { speed: 60, vision: 60 });

      // org1 reaches food first
      const ate1 = eatNearbyFood(org1, foodItems);
      expect(ate1).toBe(true);
      expect(food.eaten).toBe(true);
      expect(org1.energy).toBe(80); // 50 + 30

      // org2 reaches the same pellet in the same step - must NOT eat it
      const ate2 = eatNearbyFood(org2, foodItems);
      expect(ate2).toBe(false);
      expect(org2.energy).toBe(50);

      // Energy never exceeds cap of 100
      const nearlyFullOrg = createOrganism(3, 200, 200, 0, 90, { speed: 60, vision: 60 });
      const food2 = createFood(2, 201, 200);
      eatNearbyFood(nearlyFullOrg, [food2]);
      expect(nearlyFullOrg.energy).toBe(100);
    });
  });

  describe("Death", () => {
    it("removes organisms at or below 0 energy and leaves none with negative energy", () => {
      const world = createWorld(42);
      // Replace organisms with one starving organism and one healthy organism
      const dying = createOrganism(1, 100, 100, 0, 0.01, { speed: 60, vision: 60 });
      const healthy = createOrganism(2, 200, 200, 0, 50, { speed: 60, vision: 60 });
      world.organisms = [dying, healthy];
      world.food = []; // no food so dying cannot eat

      // Step with dt = 1/60s. Cost will burn ~0.048 energy, putting dying below 0.
      updateWorld(world, 1 / 60);

      expect(world.organisms.find((o) => o.id === dying.id)).toBeUndefined();
      expect(world.organisms.find((o) => o.id === healthy.id)).toBeDefined();
      expect(world.deaths).toBe(1);

      // None remain with negative energy
      for (const organism of world.organisms) {
        expect(organism.energy).toBeGreaterThan(0);
      }
    });
  });

  describe("Food spawn", () => {
    it("spawns food matching rate x time and never exceeds the food cap", () => {
      const world = createWorld(42);
      world.food = [];
      world.organisms = []; // no organisms eating food
      world.foodSpawnRate = 8;
      world.foodSpawnAccumulator = 0;

      // 60 steps of 1/60s = 1.0 second
      for (let i = 0; i < 60; i++) {
        updateWorld(world, 1 / 60);
      }

      // Exactly 8 food pellets should have spawned
      expect(world.food.length).toBe(8);

      // Now fill food close to max (250) and test cap
      world.food = Array.from({ length: 249 }, (_, i) => createFood(i + 1, 10, 10));
      for (let i = 0; i < 120; i++) {
        updateWorld(world, 1 / 60);
      }

      expect(world.food.length).toBeLessThanOrEqual(250);
    });
  });

  describe("Inheritance", () => {
    it("with mutation 0, child traits equal parent and child generation is parent + 1", () => {
      const world = createWorld(42);
      world.mutationRate = 0;
      world.organisms = [];
      world.newborns = [];

      const parent = createOrganism(1, 100, 100, 0, 85, { speed: 73.4, vision: 91.2 });
      parent.generation = 3;
      world.organisms.push(parent);

      const success = reproduceOrganism(world, parent);
      expect(success).toBe(true);
      expect(world.newborns.length).toBe(1);

      const child = world.newborns[0];
      expect(child.genome.speed).toBeCloseTo(73.4, 5);
      expect(child.genome.vision).toBeCloseTo(91.2, 5);
      expect(child.generation).toBe(4);
      expect(child.energy).toBe(30);
    });
  });

  describe("Mutation limits", () => {
    it("over thousands of mutations, traits stay inside allowed ranges", () => {
      const rng = createRng(42);
      const mutationRate = 0.25; // High mutation rate

      let speed = 60;
      let vision = 60;

      for (let i = 0; i < 10000; i++) {
        speed = mutateTrait(speed, rng, mutationRate, 20, 140);
        vision = mutateTrait(vision, rng, mutationRate, 20, 150);

        expect(speed).toBeGreaterThanOrEqual(20);
        expect(speed).toBeLessThanOrEqual(140);
        expect(vision).toBeGreaterThanOrEqual(20);
        expect(vision).toBeLessThanOrEqual(150);
      }

      // Also verify boundary edge clamping
      expect(mutateTrait(140, rng, 0.5, 20, 140)).toBeLessThanOrEqual(140);
      expect(mutateTrait(20, rng, 0.5, 20, 140)).toBeGreaterThanOrEqual(20);
    });
  });

  describe("Reproduction", () => {
    it("parent pays reproduction cost (50), cooldown is set, and population cap blocks births", () => {
      const world = createWorld(42);
      world.organisms = [];
      world.newborns = [];

      const parent = createOrganism(1, 100, 100, 0, 85, { speed: 60, vision: 60 });
      world.organisms.push(parent);

      const success = reproduceOrganism(world, parent);
      expect(success).toBe(true);
      // Parent lost 50 energy (85 - 50 = 35)
      expect(parent.energy).toBe(35);
      // Cooldown reset to 5s
      expect(parent.cooldown).toBe(5);

      // Cannot reproduce again while cooldown > 0 or energy < 80
      parent.energy = 85;
      expect(reproduceOrganism(world, parent)).toBe(false);

      // Population cap blocks births
      parent.cooldown = 0;
      world.organisms = Array.from({ length: 400 }, (_, i) =>
        createOrganism(i + 1, 100, 100, 0, 85, { speed: 60, vision: 60 })
      );
      expect(reproduceOrganism(world, parent)).toBe(false);
      expect(world.newborns.length).toBe(1); // Still only the previous child
    });
  });

  describe("Determinism", () => {
    it("two worlds with same seed and settings are identical after N steps; different seeds differ", () => {
      const worldA = createWorld(12345);
      const worldB = createWorld(12345);
      const worldC = createWorld(99999);

      const STEPS = 180;
      const DT = 1 / 60;

      for (let s = 0; s < STEPS; s++) {
        updateWorld(worldA, DT);
        updateWorld(worldB, DT);
        updateWorld(worldC, DT);
      }

      // Worlds A and B must match exactly
      expect(worldA.organisms.length).toBe(worldB.organisms.length);
      expect(worldA.food.length).toBe(worldB.food.length);
      expect(worldA.births).toBe(worldB.births);
      expect(worldA.deaths).toBe(worldB.deaths);

      for (let i = 0; i < worldA.organisms.length; i++) {
        const orgA = worldA.organisms[i];
        const orgB = worldB.organisms[i];

        expect(orgA.x).toBe(orgB.x);
        expect(orgA.y).toBe(orgB.y);
        expect(orgA.heading).toBe(orgB.heading);
        expect(orgA.energy).toBe(orgB.energy);
        expect(orgA.genome.speed).toBe(orgB.genome.speed);
        expect(orgA.genome.vision).toBe(orgB.genome.vision);
      }

      // World C must differ from World A
      const differ =
        worldA.organisms.length !== worldC.organisms.length ||
        worldA.food.length !== worldC.food.length ||
        worldA.organisms[0].x !== worldC.organisms[0].x;
      expect(differ).toBe(true);
    });
  });
});
