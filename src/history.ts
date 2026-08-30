export type HistoryEvent = {
  id: string;
  year: number;
  type: 'strike' | 'collapse' | 'return';
  siteId: string;
  consequence: string;
};

export type CampaignHistory = { year: number; events: HistoryEvent[] };

export function createHistory(): CampaignHistory { return { year: 0, events: [] }; }

export function recordEvent(history: CampaignHistory, event: Omit<HistoryEvent, 'id'>): HistoryEvent {
  const next = { ...event, id: `${event.type}-${history.events.length + 1}` };
  history.events.push(next);
  return next;
}

export function advanceHistory(history: CampaignHistory, years = 100): HistoryEvent {
  history.year += Math.max(0, years);
  return recordEvent(history, { year: history.year, type: 'return', siteId: 'city', consequence: 'Civilization rebuilds around inherited damage.' });
}
