export type DeepTimeState = { year: number; population: number; technology: number; memory: number; strata: number; successions: number; hash: string };

function next(value: number): number { return (value * 1664525 + 1013904223) >>> 0; }

export function simulateDeepTime(seed: number, targetYear = 100000): DeepTimeState {
  let random = seed >>> 0, population = 1000, technology = 1, memory = 100, strata = 0, successions = 0;
  for (let year = 100; year <= targetYear; year += 100) {
    random = next(random); const damage = (random % 17) / 100;
    population = Math.max(100, Math.round(population * (1.015 - damage / 8)));
    technology = Math.min(100, technology + .08 + (random % 7) / 100);
    memory = Math.max(0, memory * .992 + (damage > .1 ? 2 : 0));
    strata += damage > .06 ? 1 : 0;
    if (year % 10000 === 0) successions += 1;
  }
  const hash = [seed, targetYear, population, technology.toFixed(4), memory.toFixed(4), strata, successions].join(':');
  return { year: targetYear, population, technology: +technology.toFixed(4), memory: +memory.toFixed(4), strata, successions, hash };
}
