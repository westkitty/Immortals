import { DEFAULT_BINDINGS, type GameAction } from './input';

// Settings are stored separately from the campaign save envelope (SAVE_KEY in main.ts) because
// they describe *how a person plays* (bindings, quality, accessibility) rather than *what has
// happened in the city*. Keeping them apart means resetting/clearing a campaign save never has to
// touch a player's accessibility or control preferences, and vice versa.
export const SETTINGS_KEY = 'immortals-3d-settings-v1';
export const SETTINGS_VERSION = 1;

export type QualityTier = 'auto' | 'low' | 'medium' | 'high';

export type AccessibilitySettings = {
  reducedShake: boolean;
  reducedFlash: boolean;
  highContrastHud: boolean;
  subtitlesForPrompts: boolean;
  holdToggleAssist: boolean; // lets "hold" actions (grapple, glide) work as toggles instead
};

export type PersistedSettings = {
  version: number;
  bindings: Record<string, GameAction[]>;
  qualityTier: QualityTier;
  cameraSensitivity: number;
  accessibility: AccessibilitySettings;
  onboardingSeen: string[]; // ids of onboarding hints already shown, so they do not repeat
  hapticsEnabled: boolean;
};

export function defaultSettings(): PersistedSettings {
  return {
    version: SETTINGS_VERSION,
    bindings: cloneBindings(DEFAULT_BINDINGS),
    qualityTier: 'auto',
    cameraSensitivity: 1,
    accessibility: { reducedShake: false, reducedFlash: false, highContrastHud: false, subtitlesForPrompts: true, holdToggleAssist: false },
    onboardingSeen: [],
    hapticsEnabled: true,
  };
}

function cloneBindings(source: Record<string, GameAction[]>): Record<string, GameAction[]> {
  const clone: Record<string, GameAction[]> = {};
  for (const key of Object.keys(source)) clone[key] = [...source[key]];
  return clone;
}

// Migrates an arbitrary parsed JSON payload into a valid PersistedSettings object.
// Unknown/future versions and malformed shapes fall back to defaults instead of throwing,
// so a corrupted or newer-than-supported settings blob never blocks the game from starting.
export function migrateSettings(raw: unknown): PersistedSettings {
  const fallback = defaultSettings();
  if (!raw || typeof raw !== 'object') return fallback;
  const input = raw as Partial<PersistedSettings> & { version?: unknown };
  const version = Number(input.version);
  if (!Number.isInteger(version) || version > SETTINGS_VERSION || version < 1) return fallback;
  const bindings = input.bindings && typeof input.bindings === 'object' ? cloneBindings(input.bindings as Record<string, GameAction[]>) : fallback.bindings;
  const qualityTier: QualityTier = input.qualityTier === 'low' || input.qualityTier === 'medium' || input.qualityTier === 'high' || input.qualityTier === 'auto' ? input.qualityTier : fallback.qualityTier;
  const cameraSensitivity = Number.isFinite(input.cameraSensitivity) ? Math.max(0.5, Math.min(2, input.cameraSensitivity as number)) : fallback.cameraSensitivity;
  const accessibility: AccessibilitySettings = {
    reducedShake: typeof input.accessibility?.reducedShake === 'boolean' ? input.accessibility.reducedShake : fallback.accessibility.reducedShake,
    reducedFlash: typeof input.accessibility?.reducedFlash === 'boolean' ? input.accessibility.reducedFlash : fallback.accessibility.reducedFlash,
    highContrastHud: typeof input.accessibility?.highContrastHud === 'boolean' ? input.accessibility.highContrastHud : fallback.accessibility.highContrastHud,
    subtitlesForPrompts: typeof input.accessibility?.subtitlesForPrompts === 'boolean' ? input.accessibility.subtitlesForPrompts : fallback.accessibility.subtitlesForPrompts,
    holdToggleAssist: typeof input.accessibility?.holdToggleAssist === 'boolean' ? input.accessibility.holdToggleAssist : fallback.accessibility.holdToggleAssist,
  };
  const onboardingSeen = Array.isArray(input.onboardingSeen) ? input.onboardingSeen.filter((id): id is string => typeof id === 'string') : fallback.onboardingSeen;
  const hapticsEnabled = typeof input.hapticsEnabled === 'boolean' ? input.hapticsEnabled : fallback.hapticsEnabled;
  return { version: SETTINGS_VERSION, bindings, qualityTier, cameraSensitivity, accessibility, onboardingSeen, hapticsEnabled };
}

export function loadSettings(storage: Pick<Storage, 'getItem'> = localStorage): PersistedSettings {
  try { return migrateSettings(JSON.parse(storage.getItem(SETTINGS_KEY) ?? 'null')); }
  catch { return defaultSettings(); }
}

export function saveSettings(settings: PersistedSettings, storage: Pick<Storage, 'setItem'> = localStorage): void {
  storage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
