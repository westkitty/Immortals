export type BattleOutcome = {
  version: 1;
  winner: 'immortal';
  year: number;
  playerVitality: number;
  collapsedStructureIds: string[];
  scarCount: number;
  eventIds: string[];
};

export function createBattleOutcome(input: Omit<BattleOutcome, 'version' | 'winner'>): BattleOutcome {
  return { version: 1, winner: 'immortal', ...input, collapsedStructureIds: [...input.collapsedStructureIds], eventIds: [...input.eventIds] };
}
