export type CombatState = { health: number; maxHealth: number };

export type DamageResult = { accepted: boolean; damage: number; remaining: number; defeated: boolean };

export function applyDamage(target: CombatState, amount: number): DamageResult {
  const damage = Math.max(0, Math.min(target.health, amount));
  if (damage === 0) return { accepted: false, damage: 0, remaining: target.health, defeated: target.health <= 0 };
  target.health -= damage;
  return { accepted: true, damage, remaining: target.health, defeated: target.health <= 0 };
}
