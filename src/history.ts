export type HistoryEvent = {
  id: string;
  year: number;
  type: 'strike' | 'collapse' | 'return';
  siteId: string;
  consequence: string;
  publicAccount: string;
  evidenceStrength: number;
};

export type DevelopmentState = { population: number; trade: number; sheltering: number; adaptation: number; westSafety: number; eastSafety: number; westTransit: number; eastTransit: number };
export type CampaignHistory = { year: number; events: HistoryEvent[]; development: DevelopmentState };

export function createHistory(): CampaignHistory { return { year: 0, events: [], development: { population: 1000, trade: 50, sheltering: 0, adaptation: 0, westSafety: 50, eastSafety: 50, westTransit: 50, eastTransit: 50 } }; }

export function recordDistrictDamage(history: CampaignHistory, x: number): void {
  if (x < 0) { history.development.westSafety = Math.max(0, history.development.westSafety - 10); history.development.eastTransit = Math.min(100, history.development.eastTransit + 6); }
  else { history.development.eastSafety = Math.max(0, history.development.eastSafety - 10); history.development.westTransit = Math.min(100, history.development.westTransit + 6); }
}

export function recordEvent(history: CampaignHistory, event: Omit<HistoryEvent, 'id'>): HistoryEvent {
  const next = { ...event, id: `${event.type}-${history.events.length + 1}` };
  history.events.push(next);
  if (event.type === 'collapse') history.development.adaptation = Math.min(100, history.development.adaptation + 8);
  return next;
}

export function archaeologyRecover(history: CampaignHistory, eventId: string): HistoryEvent | undefined {
  const event = history.events.find((candidate) => candidate.id === eventId);
  if (!event) return undefined;
  event.evidenceStrength = 1;
  event.publicAccount = `Recovered evidence confirms: ${event.consequence}`;
  return event;
}

export function advanceHistory(history: CampaignHistory, years = 100): HistoryEvent {
  history.year += Math.max(0, years);
  const collapseCount = history.events.filter((event) => event.type === 'collapse').length;
  history.events.forEach((event) => { if (event.year < history.year) { event.evidenceStrength = Math.max(0, event.evidenceStrength * .88); if (event.evidenceStrength < .45) event.publicAccount = 'The event survives only as disputed local memory.'; } });
  history.development.sheltering = Math.min(100, history.development.sheltering + collapseCount * 3);
  history.development.trade = Math.max(10, Math.min(100, history.development.trade + (history.development.adaptation > 30 ? 4 : 1) - collapseCount * .5));
  if (history.development.westSafety !== history.development.eastSafety) history.development.trade = Math.min(100, history.development.trade + Math.abs(history.development.westSafety - history.development.eastSafety) / 20);
  history.development.westTransit = Math.min(100, history.development.westTransit + (history.development.westSafety > history.development.eastSafety ? 2 : .5));
  history.development.eastTransit = Math.min(100, history.development.eastTransit + (history.development.eastSafety > history.development.westSafety ? 2 : .5));
  history.development.population = Math.max(100, Math.round(history.development.population * (1.08 - history.development.sheltering / 2500)));
  return recordEvent(history, { year: history.year, type: 'return', siteId: 'city', consequence: 'Civilization rebuilds around inherited damage.', publicAccount: 'The city claims the return was a natural century turning.', evidenceStrength: .85 });
}

export function counterfactualDivergence(): { westTransit: number; eastTransit: number; differs: boolean } {
  const west = createHistory(); const east = createHistory();
  recordDistrictDamage(west, -1); recordEvent(west, { year: 0, type: 'collapse', siteId: 'west', consequence: 'Western district damaged.', publicAccount: 'A storm damaged the west.', evidenceStrength: .6 });
  recordDistrictDamage(east, 1); recordEvent(east, { year: 0, type: 'collapse', siteId: 'east', consequence: 'Eastern district damaged.', publicAccount: 'A storm damaged the east.', evidenceStrength: .6 });
  for (let i = 0; i < 5; i += 1) { advanceHistory(west); advanceHistory(east); }
  return { westTransit: west.development.westTransit, eastTransit: east.development.eastTransit, differs: west.development.westTransit !== east.development.westTransit };
}
