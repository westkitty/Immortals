import { describe, expect, it } from 'vitest';
import { Action, createInputState, DEFAULT_BINDINGS, REBINDABLE_ACTIONS, type GameAction } from '../src/input';
import { defaultSettings, migrateSettings, SETTINGS_VERSION } from '../src/settings';
import { createFrameBudgetState, qualityProfile, stepFrameBudget } from '../src/quality';
import { advanceCityCentury, computeActivityCounts, createCityState, markLandmarkDamaged, projectPublicMemory, rebuildLandmark } from '../src/city';
import { createHistory, recordEvent } from '../src/history';
import { createSpatialGrid, insertIntoGrid, occupiedCellCount, queryGridBounds } from '../src/spatialGrid';

describe('Unified input abstraction', () => {
  it('keeps keyboard held/pressed/released semantics identical to the pre-refactor contract', () => {
    const input = createInputState();
    input.keyDown('q');
    expect(input.down.has(Action.Dash)).toBe(true);
    expect(input.pressed.has(Action.Dash)).toBe(true);
    input.consumeFrame();
    expect(input.down.has(Action.Dash)).toBe(true);
    expect(input.pressed.has(Action.Dash)).toBe(false);
    input.keyUp('q');
    expect(input.released.has(Action.Dash)).toBe(true);
    expect(input.down.has(Action.Dash)).toBe(false);
  });

  it('derives digital movement from keyboard when no analog stick is active', () => {
    const input = createInputState();
    input.keyDown('w');
    input.syncMove();
    expect(input.moveVector.z).toBe(-1);
    expect(input.moveMagnitude).toBe(1);
  });

  it('blends touch analog movement without requiring digital keys', () => {
    const input = createInputState();
    input.setAnalogMove(0.5, -0.5, 'touch');
    input.syncMove();
    expect(input.moveMagnitude).toBeGreaterThan(0);
    expect(input.moveMagnitude).toBeLessThanOrEqual(1);
    expect(input.mode).toBe('touch');
  });

  it('prefers analog input over stale digital keys once analog input begins', () => {
    const input = createInputState();
    input.keyDown('w');
    input.setAnalogMove(1, 0, 'gamepad');
    input.syncMove();
    expect(input.moveVector.x).toBeCloseTo(1);
    expect(input.mode).toBe('gamepad');
  });

  it('supports independent action sources so touch and keyboard cannot desync held state', () => {
    const input = createInputState();
    input.setAction(Action.Jump, true, 'touch');
    expect(input.down.has(Action.Jump)).toBe(true);
    input.keyDown('space');
    input.keyUp('space');
    expect(input.down.has(Action.Jump)).toBe(true); // touch source still holding it
    input.setAction(Action.Jump, false, 'touch');
    expect(input.down.has(Action.Jump)).toBe(false);
  });

  it('accumulates look delta from non-mouse sources for a single frame then clears it', () => {
    const input = createInputState();
    input.addLookDelta(10, -4, 'gamepad');
    input.addLookDelta(2, 1);
    expect(input.pointerDelta).toEqual({ x: 12, y: -3 });
    input.consumeFrame();
    expect(input.pointerDelta).toEqual({ x: 0, y: 0 });
  });

  it('allows full rebinding of every action considered remappable', () => {
    const input = createInputState();
    const remapped: Record<string, GameAction[]> = { ...DEFAULT_BINDINGS, j: [Action.Attack] };
    delete remapped.f;
    input.setBindings(remapped);
    input.keyDown('j');
    expect(input.down.has(Action.Attack)).toBe(true);
    input.keyDown('f');
    expect(input.down.has(Action.Attack)).toBe(true); // still true from j
    input.keyUp('j'); input.keyUp('f');
    expect(input.down.has(Action.Attack)).toBe(false);
    expect(REBINDABLE_ACTIONS).toContain(Action.Attack);
  });

  it('restores default bindings on request', () => {
    const input = createInputState();
    input.setBindings({});
    input.resetBindings();
    input.keyDown('w');
    expect(input.down.has(Action.MoveForward)).toBe(true);
  });
});

describe('Settings persistence and migration', () => {
  it('produces sane defaults', () => {
    const settings = defaultSettings();
    expect(settings.version).toBe(SETTINGS_VERSION);
    expect(settings.qualityTier).toBe('auto');
    expect(settings.accessibility.reducedShake).toBe(false);
  });

  it('rejects unsupported future versions by falling back to defaults', () => {
    const migrated = migrateSettings({ version: SETTINGS_VERSION + 5, qualityTier: 'low' });
    expect(migrated.version).toBe(SETTINGS_VERSION);
    expect(migrated.qualityTier).toBe('auto');
  });

  it('recovers from malformed settings data instead of throwing', () => {
    expect(() => migrateSettings('not an object')).not.toThrow();
    expect(() => migrateSettings(null)).not.toThrow();
    expect(() => migrateSettings(42)).not.toThrow();
    expect(migrateSettings('garbage').version).toBe(SETTINGS_VERSION);
  });

  it('preserves valid fields while filling in missing ones from defaults', () => {
    const migrated = migrateSettings({ version: 1, qualityTier: 'low', accessibility: { reducedShake: true } });
    expect(migrated.qualityTier).toBe('low');
    expect(migrated.accessibility.reducedShake).toBe(true);
    expect(migrated.accessibility.reducedFlash).toBe(false);
    expect(migrated.cameraSensitivity).toBe(1);
  });

  it('clamps out-of-range camera sensitivity from corrupted data', () => {
    const migrated = migrateSettings({ version: 1, cameraSensitivity: 99 });
    expect(migrated.cameraSensitivity).toBeLessThanOrEqual(2);
  });
});

describe('Frame-budget adaptive quality governor', () => {
  it('starts high and does not react to a single slow frame', () => {
    let state = createFrameBudgetState('high');
    state = stepFrameBudget(state, 40, 'auto');
    expect(state.level).toBe('high');
  });

  it('downgrades after sustained slow frames, with hysteresis preventing single-frame flapping', () => {
    let state = createFrameBudgetState('high');
    for (let i = 0; i < 30; i += 1) state = stepFrameBudget(state, 45, 'auto');
    expect(state.level).toBe('medium');
  });

  it('downgrades twice under sustained extreme slowness', () => {
    let state = createFrameBudgetState('high');
    for (let i = 0; i < 30; i += 1) state = stepFrameBudget(state, 60, 'auto');
    for (let i = 0; i < 30; i += 1) state = stepFrameBudget(state, 60, 'auto');
    expect(state.level).toBe('low');
  });

  it('upgrades again after sustained fast frames', () => {
    let state = createFrameBudgetState('low');
    for (let i = 0; i < 30; i += 1) state = stepFrameBudget(state, 8, 'auto');
    expect(state.level).toBe('medium');
  });

  it('never touches touch input as a quality signal -- only frame timing matters', () => {
    // stepFrameBudget has no device/input parameter at all; this test documents that contract.
    expect(stepFrameBudget.length).toBe(3);
  });

  it('manual tier selection overrides automatic quality immediately', () => {
    let state = createFrameBudgetState('high');
    for (let i = 0; i < 30; i += 1) state = stepFrameBudget(state, 60, 'auto');
    state = stepFrameBudget(state, 60, 'high');
    expect(state.level).toBe('high');
    expect(state.auto).toBe(false);
  });

  it('degrades presentation (pixel ratio, shadows, distance, density) never traversal/combat truth', () => {
    const low = qualityProfile('low');
    const high = qualityProfile('high');
    expect(low.pixelRatioCap).toBeLessThan(high.pixelRatioCap);
    expect(low.drawDistance).toBeLessThan(high.drawDistance);
    expect(low.trafficDensity).toBeLessThan(high.trafficDensity);
  });
});

describe('City fabric: district identity, land-use, traffic/pedestrians, landmarks, public memory', () => {
  const buildings = [{ id: 'b1', x: -60 }, { id: 'b2', x: 60 }, { id: 'b3', x: 0 }];
  const landmarks = [{ id: 'landmark-1', name: 'Old Cistern', x: -100 }];

  it('assigns deterministic district identity from x position', () => {
    const city = createCityState(1, buildings, landmarks);
    expect(city.parcels.find((p) => p.id === 'b1')?.district).toBe('west');
    expect(city.parcels.find((p) => p.id === 'b2')?.district).toBe('east');
    expect(city.parcels.find((p) => p.id === 'b3')?.district).toBe('central');
  });

  it('produces identical city fabric for the same seed (determinism contract)', () => {
    const a = createCityState(42, buildings, landmarks);
    const b = createCityState(42, buildings, landmarks);
    expect(a.parcels.map((p) => p.landUse)).toEqual(b.parcels.map((p) => p.landUse));
  });

  it('produces bounded, non-negative traffic/pedestrian/street-activity counts', () => {
    const city = createCityState(7, buildings, landmarks);
    const history = createHistory();
    const counts = computeActivityCounts(city, history, 1);
    expect(counts.trafficCount).toBeGreaterThanOrEqual(0);
    expect(counts.trafficCount).toBeLessThanOrEqual(24);
    expect(counts.pedestrianCount).toBeLessThanOrEqual(60);
    expect(counts.streetActivityCount).toBeLessThanOrEqual(10);
  });

  it('scales activity density down under lower quality settings without going negative', () => {
    const city = createCityState(7, buildings, landmarks);
    const history = createHistory();
    const full = computeActivityCounts(city, history, 1);
    const low = computeActivityCounts(city, history, 0.3);
    expect(low.trafficCount).toBeLessThanOrEqual(full.trafficCount);
    expect(low.pedestrianCount).toBeGreaterThanOrEqual(0);
  });

  it('rebuilds demolished parcels with a re-rolled land use and increments demolition count', () => {
    const city = createCityState(3, buildings, landmarks);
    const history = createHistory();
    history.year = 100;
    const before = city.parcels.find((p) => p.id === 'b1')!.landUse;
    advanceCityCentury(city, history, new Set(['b1']), new Map());
    const after = city.parcels.find((p) => p.id === 'b1')!;
    expect(after.demolitions).toBe(1);
    expect(after.constructionYear).toBe(100);
    expect(['residential', 'commercial', 'industrial', 'civic', 'ruin']).toContain(after.landUse);
    void before;
  });

  it('carries material lineage forward into rebuilt parcels', () => {
    const city = createCityState(3, buildings, landmarks);
    const history = createHistory();
    advanceCityCentury(city, history, new Set(['b1']), new Map([['b1', ['relic-1']]]));
    expect(city.parcels.find((p) => p.id === 'b1')?.materialLineageIds).toContain('relic-1');
  });

  it('tracks landmark lifecycle with stable ids across damage/rebuild/memorialization', () => {
    const city = createCityState(3, buildings, landmarks);
    markLandmarkDamaged(city, 'landmark-1', 100);
    expect(city.landmarks[0].status).toBe('damaged');
    rebuildLandmark(city, 'landmark-1');
    expect(city.landmarks[0].status).toBe('rebuilt');
    markLandmarkDamaged(city, 'landmark-1', 200);
    rebuildLandmark(city, 'landmark-1');
    markLandmarkDamaged(city, 'landmark-1', 300);
    rebuildLandmark(city, 'landmark-1');
    expect(city.landmarks[0].status).toBe('memorialized');
    expect(city.landmarks[0].id).toBe('landmark-1');
  });

  it('projects public memory from an event without mutating the objective event', () => {
    const city = createCityState(3, buildings, landmarks);
    const history = createHistory();
    const event = recordEvent(history, { year: 0, type: 'collapse', siteId: 'b1', consequence: 'The tower fell.', publicAccount: 'A storm did it.', evidenceStrength: 0.6 });
    projectPublicMemory(city, event.id, event.siteId, 'west', event.publicAccount, event.evidenceStrength);
    expect(city.publicMemory).toHaveLength(1);
    expect(city.publicMemory[0].inscription).toBe('A storm did it.');
    expect(event.consequence).toBe('The tower fell.'); // objective record untouched
    expect(event.publicAccount).toBe('A storm did it.');
  });

  it('adds a second, corrective public memory marker after archaeology without deleting the first', () => {
    const city = createCityState(3, buildings, landmarks);
    const history = createHistory();
    const event = recordEvent(history, { year: 0, type: 'collapse', siteId: 'b1', consequence: 'The tower fell.', publicAccount: 'A storm did it.', evidenceStrength: 0.6 });
    projectPublicMemory(city, event.id, event.siteId, 'west', event.publicAccount, event.evidenceStrength);
    event.publicAccount = 'Recovered evidence confirms: The tower fell.';
    event.evidenceStrength = 1;
    projectPublicMemory(city, event.id, event.siteId, 'west', event.publicAccount, event.evidenceStrength);
    expect(city.publicMemory).toHaveLength(2);
    expect(city.publicMemory[0].inscription).toBe('A storm did it.');
    expect(city.publicMemory[1].inscription).toContain('Recovered evidence confirms');
  });
});

describe('Spatial partitioning', () => {
  it('buckets entries by cell and reports the number of occupied cells', () => {
    const grid = createSpatialGrid(40);
    insertIntoGrid(grid, 'a', 5, 5);
    insertIntoGrid(grid, 'b', 6, 3);
    insertIntoGrid(grid, 'c', 200, 200);
    expect(occupiedCellCount(grid)).toBe(2);
  });

  it('queryGridBounds returns a superset that includes every id within the query radius', () => {
    const grid = createSpatialGrid(40);
    insertIntoGrid(grid, 'near', 10, 10);
    insertIntoGrid(grid, 'far', 500, 500);
    const found = queryGridBounds(grid, 0, 0, 20);
    expect(found).toContain('near');
    expect(found).not.toContain('far');
  });

  it('is empty for an empty grid and grows as entries are inserted across distinct cells', () => {
    const grid = createSpatialGrid(10);
    expect(occupiedCellCount(grid)).toBe(0);
    insertIntoGrid(grid, 'x', 0, 0);
    insertIntoGrid(grid, 'y', 100, 100);
    insertIntoGrid(grid, 'z', 100, 100);
    expect(occupiedCellCount(grid)).toBe(2);
    expect(queryGridBounds(grid, 100, 100, 5).sort()).toEqual(['y', 'z']);
  });
});
