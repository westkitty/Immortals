import type { CampaignHistory } from './history';

// Deterministic city-fabric state: district identity, land-use evolution, construction/
// demolition lifecycle, landmark lifecycle, bounded traffic/pedestrian population, and the
// visible divergence between objective history and public memory. Everything here is a pure
// function of (seed, year, history, building layout) so the same seed + same relevant actions
// reproduce the same city fabric summary, per the determinism contract.

export type LandUse = 'residential' | 'commercial' | 'industrial' | 'civic' | 'ruin';
export type District = 'west' | 'east' | 'central';

export type ParcelState = {
  id: string;
  district: District;
  landUse: LandUse;
  constructionYear: number; // year this parcel's current structure was built/rebuilt
  demolitions: number; // how many times this parcel has been demolished and rebuilt
  materialLineageIds: string[]; // relic ids (see history.ts) reused in this parcel's construction
};

export type LandmarkState = {
  id: string;
  name: string;
  status: 'intact' | 'damaged' | 'rebuilt' | 'memorialized';
  district: District;
  yearEstablished: number;
  yearsRebuilt: number[];
};

export type PublicMemoryMarker = {
  id: string;
  eventId: string;
  siteId: string;
  district: District;
  // A visible structure (plaque/monument/altered street name) that encodes the *public account*
  // of an event. It never overwrites the objective HistoryEvent it is derived from -- the
  // objective event remains the source of truth in history.events, this is a separate read-only
  // projection of what the city now visibly believes.
  inscription: string;
  evidenceStrengthAtCreation: number;
};

export type CityState = {
  seed: number;
  parcels: ParcelState[];
  landmarks: LandmarkState[];
  publicMemory: PublicMemoryMarker[];
  trafficCount: number;
  pedestrianCount: number;
  streetActivityCount: number;
};

function districtFor(x: number): District {
  if (x < -20) return 'west';
  if (x > 20) return 'east';
  return 'central';
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LAND_USES: LandUse[] = ['residential', 'commercial', 'industrial', 'civic'];

export function createCityState(seed: number, buildingIds: { id: string; x: number }[], landmarkSeeds: { id: string; name: string; x: number }[]): CityState {
  const random = mulberry32(seed);
  const parcels: ParcelState[] = buildingIds.map((building) => ({
    id: building.id,
    district: districtFor(building.x),
    landUse: LAND_USES[Math.floor(random() * LAND_USES.length)],
    constructionYear: 0,
    demolitions: 0,
    materialLineageIds: [],
  }));
  const landmarks: LandmarkState[] = landmarkSeeds.map((landmark) => ({
    id: landmark.id, name: landmark.name, status: 'intact', district: districtFor(landmark.x), yearEstablished: 0, yearsRebuilt: [],
  }));
  return { seed, parcels, landmarks, publicMemory: [], trafficCount: 0, pedestrianCount: 0, streetActivityCount: 0 };
}

// Bounded, deterministic population figures. These are aggregate counts driving instanced
// rendering density, not individually simulated agents -- there is no per-citizen AI, and no
// unbounded growth: values are always clamped to fixed caps regardless of city age or history size.
export function computeActivityCounts(city: CityState, history: CampaignHistory, qualityDensity: number): { trafficCount: number; pedestrianCount: number; streetActivityCount: number } {
  const random = mulberry32(city.seed + history.year);
  const transitAverage = (history.development.westTransit + history.development.eastTransit) / 2;
  const safetyAverage = (history.development.westSafety + history.development.eastSafety) / 2;
  const trafficBase = Math.round((6 + transitAverage / 10) * qualityDensity);
  const pedestrianBase = Math.round((10 + safetyAverage / 8 + history.development.population / 400) * qualityDensity);
  const streetActivityBase = Math.round((2 + (safetyAverage > 55 ? 3 : 1)) * qualityDensity);
  const jitter = () => Math.floor(random() * 3) - 1;
  return {
    trafficCount: Math.max(0, Math.min(24, trafficBase + jitter())),
    pedestrianCount: Math.max(0, Math.min(60, pedestrianBase + jitter())),
    streetActivityCount: Math.max(0, Math.min(10, streetActivityBase + jitter())),
  };
}

// Land-use evolution + construction/demolition lifecycle, run once per century advance.
// A parcel whose building has collapsed (structureCollapsed=true) is bulldozed and its land
// use re-rolled deterministically, biased by the current development trend (adaptation raises
// the odds of civic/commercial reconstruction; low trade favors industrial/ruin).
export function advanceCityCentury(city: CityState, history: CampaignHistory, collapsedParcelIds: Set<string>, relicIdsByEvent: Map<string, string[]>): void {
  const random = mulberry32(city.seed + history.year * 7 + city.parcels.length);
  for (const parcel of city.parcels) {
    if (!collapsedParcelIds.has(parcel.id)) continue;
    parcel.demolitions += 1;
    parcel.constructionYear = history.year;
    const roll = random();
    const adaptation = history.development.adaptation;
    parcel.landUse = adaptation > 50 ? (roll < 0.5 ? 'civic' : 'commercial') : adaptation > 20 ? (roll < 0.5 ? 'residential' : 'commercial') : (roll < 0.4 ? 'industrial' : 'ruin');
    const relics = relicIdsByEvent.get(parcel.id) ?? [];
    parcel.materialLineageIds = [...parcel.materialLineageIds, ...relics];
  }
}

export function markLandmarkDamaged(city: CityState, landmarkId: string, year: number): void {
  const landmark = city.landmarks.find((candidate) => candidate.id === landmarkId);
  if (!landmark || landmark.status === 'memorialized') return;
  landmark.status = 'damaged';
  landmark.yearsRebuilt.push(year);
}

export function rebuildLandmark(city: CityState, landmarkId: string): void {
  const landmark = city.landmarks.find((candidate) => candidate.id === landmarkId);
  if (!landmark) return;
  landmark.status = landmark.yearsRebuilt.length >= 2 ? 'memorialized' : 'rebuilt';
}

// Creates a visible public-memory marker derived from an objective HistoryEvent's *current*
// publicAccount text, without ever mutating the objective event. If the same event is later
// archaeologically recovered (evidenceStrength -> 1, publicAccount rewritten to the truth),
// callers should invoke this again to add a corrective marker rather than editing the old one,
// preserving a visible record of what the city used to believe.
export function projectPublicMemory(city: CityState, eventId: string, siteId: string, district: District, inscription: string, evidenceStrengthAtCreation: number): PublicMemoryMarker {
  const marker: PublicMemoryMarker = { id: `memory-${city.publicMemory.length + 1}`, eventId, siteId, district, inscription, evidenceStrengthAtCreation };
  city.publicMemory.push(marker);
  return marker;
}
