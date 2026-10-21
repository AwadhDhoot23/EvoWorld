import { useEffect, useRef } from "react";
import { createWorld, updateWorld } from "../sim/world";

const WORLD_WIDTH = 900;
const WORLD_HEIGHT = 600;

function WorldCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const world = createWorld(42);
    const populationElement = document.getElementById("population-count");
    const foodElement = document.getElementById("food-count");
    const averageSpeedElement = document.getElementById("average-speed");
    const averageVisionElement = document.getElementById("average-vision");
    const averageEnergyElement = document.getElementById("average-energy");

    let previousTime = null;
    let animationId;

    function render() {
      context.clearRect(0, 0, world.width, world.height);

      // Draw food.
      for (const item of world.food) {
        context.fillStyle = "#34d399";
        context.fillRect(item.x, item.y, 4, 4);
      }

      // Draw organisms.
      for (const organism of world.organisms) {
        context.beginPath();
        context.arc(organism.x, organism.y, 5, 0, Math.PI * 2);

        context.fillStyle = organism.energy > 30 ? "#60a5fa" : "#f87171";

        context.fill();
      }
      if (populationElement) {
        populationElement.textContent = world.organisms.length;
      }

      if (foodElement) {
        foodElement.textContent = world.food.length;
      }
      const population = world.organisms.length;

      if (population > 0) {
        const totals = world.organisms.reduce(
          (result, organism) => {
            result.speed += organism.genome.speed;
            result.vision += organism.genome.vision;
            result.energy += organism.energy;

            return result;
          },
          { speed: 0, vision: 0, energy: 0 },
        );

        averageSpeedElement.textContent = (totals.speed / population).toFixed(
          1,
        );

        averageVisionElement.textContent = (totals.vision / population).toFixed(
          1,
        );

        averageEnergyElement.textContent = (totals.energy / population).toFixed(
          1,
        );
      } else {
        averageSpeedElement.textContent = "—";
        averageVisionElement.textContent = "—";
        averageEnergyElement.textContent = "—";
      }
    }

    function animate(currentTime) {
      if (previousTime !== null) {
        const deltaTime = Math.min((currentTime - previousTime) / 1000, 0.05);

        updateWorld(world, deltaTime);
      }

      previousTime = currentTime;
      render();
      animationId = requestAnimationFrame(animate);
    }

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);
  return (
    <canvas
      ref={canvasRef}
      width={WORLD_WIDTH}
      height={WORLD_HEIGHT}
      className="block h-auto w-full rounded-xl border border-slate-700 bg-slate-900"
      aria-label="EvoWorld simulation environment"
      role="img"
    />
  );
}

export default WorldCanvas;
