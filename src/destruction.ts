export type StructureState = {
  id: string;
  integrity: number;
  maxIntegrity: number;
  support: number;
  collapsed: boolean;
};

export type ImpactResult = {
  damage: number;
  integrity: number;
  collapsed: boolean;
  supportFailure: boolean;
};

export function createStructureState(id: string, maxIntegrity: number): StructureState {
  return { id, integrity: maxIntegrity, maxIntegrity, support: 1, collapsed: false };
}

export function applyStructureImpact(structure: StructureState, force: number): ImpactResult {
  if (structure.collapsed || force <= 0) return { damage: 0, integrity: structure.integrity, collapsed: true, supportFailure: false };
  const damage = Math.min(structure.integrity, Math.max(0, force) * (structure.support < .5 ? 1.25 : 1));
  structure.integrity = Math.max(0, structure.integrity - damage);
  structure.support = Math.max(0, structure.support - damage / structure.maxIntegrity * .9);
  structure.collapsed = structure.integrity <= structure.maxIntegrity * .18 || structure.support <= .12;
  return { damage, integrity: structure.integrity, collapsed: structure.collapsed, supportFailure: structure.support <= .12 };
}
