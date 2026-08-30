export type HistoryEvent = {
  id: string;
  year: number;
  type: 'strike' | 'collapse' | 'return';
  siteId: string;
  consequence: string;
};

export type DevelopmentState = { population: number; trade: number; sheltering: number; adaptation: number; westSafety: number; eastSafety: number };
export type CampaignHistory = { year: number; events: HistoryEvent[]; development: DevelopmentState };

export function createHistory(): CampaignHistory { return { year: 0, events: [], development: { population: 1000, trade: 50, sheltering: 0, adaptation: 0, westSafety: 50, eastSafety: 50 } }; }

export function recordDistrictDamage(history: CampaignHistory, x: number): void {
  if (x < 0) history.development.westSafety = Math.max(0, history.development.westSafety - 10);
  else history.development.eastSafety = Math.max(0, history.development.eastSafety - 10);
}

export function recordEvent(history: CampaignHistory, event: Omit<HistoryEvent, 'id'>): HistoryEvent {
  const next = { ...event, id: `${event.type}-${history.events.length + 1}` };
  history.events.push(next);
  if (event.type === 'collapse') history.development.adaptation = Math.min(100, history.development.adaptation + 8);
  return next;
}

export function advanceHistory(history: CampaignHistory, years = 100): HistoryEvent {
  history.year += Math.max(0, years);
  const collapseCount = history.events.filter((event) => event.type === 'collapse').length;
  history.development.sheltering = Math.min(100, history.development.sheltering + collapseCount * 3);
  history.development.trade = Math.max(10, Math.min(100, history.development.trade + (history.development.adaptation > 30 ? 4 : 1) - collapseCount * .5));
  if (history.development.westSafety !== history.development.eastSafety) history.development.trade = Math.min(100, history.development.trade + Math.abs(history.development.westSafety - history.development.eastSafety) / 20);
  history.development.population = Math.max(100, Math.round(history.development.population * (1.08 - history.development.sheltering / 2500)));
  return recordEvent(history, { year: history.year, type: 'return', siteId: 'city', consequence: 'Civilization rebuilds around inherited damage.' });
}
