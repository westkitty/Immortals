// Frame-budget adaptive quality governor.
//
// Device-agnostic: it never inspects user-agent strings or device type. It only reacts to
// measured frame duration (the thing that actually determines whether the game feels smooth),
// so a low-end desktop and a capable tablet are judged by the same yardstick. Touch input is
// never treated as a low-quality signal on its own -- only sustained slow frames lower the tier.
//
// Hysteresis: separate "downgrade" and "upgrade" thresholds (with required consecutive-sample
// counts) stop the governor from oscillating every frame when frame time sits near a boundary.
export type QualityLevel = 'low' | 'medium' | 'high';
export type QualityTierSetting = 'auto' | QualityLevel;

export type FrameBudgetState = {
  level: QualityLevel;
  auto: boolean;
  averageFrameMs: number;
  consecutiveSlow: number;
  consecutiveFast: number;
};

const DOWNGRADE_MS: Record<QualityLevel, number> = { high: 26, medium: 34, low: Infinity };
const UPGRADE_MS: Record<QualityLevel, number> = { low: 20, medium: 16, high: -Infinity };
const REQUIRED_SAMPLES = 20; // ~1/3s at 60fps, or a handful of seconds when already struggling
const SMOOTHING = 0.08;

export function createFrameBudgetState(initial: QualityLevel = 'high'): FrameBudgetState {
  return { level: initial, auto: true, averageFrameMs: 1000 / 60, consecutiveSlow: 0, consecutiveFast: 0 };
}

const LEVELS: QualityLevel[] = ['low', 'medium', 'high'];

function step(level: QualityLevel, direction: -1 | 1): QualityLevel {
  const index = LEVELS.indexOf(level);
  const next = LEVELS[Math.max(0, Math.min(LEVELS.length - 1, index + direction))];
  return next;
}

// Pure reducer: given the current governor state and one frame's duration, returns the
// next state. Called once per rendered frame; manual/deterministic replay stepping
// (window.advanceTime) does not drive real frame timings and intentionally does not call this.
export function stepFrameBudget(state: FrameBudgetState, frameMs: number, manualTier: QualityTierSetting): FrameBudgetState {
  if (manualTier !== 'auto') {
    return { level: manualTier, auto: false, averageFrameMs: state.averageFrameMs, consecutiveSlow: 0, consecutiveFast: 0 };
  }
  const clamped = Math.max(1, Math.min(250, frameMs));
  const averageFrameMs = state.averageFrameMs + (clamped - state.averageFrameMs) * SMOOTHING;
  const tooSlow = averageFrameMs > DOWNGRADE_MS[state.level];
  const fastEnough = averageFrameMs < UPGRADE_MS[state.level];
  const consecutiveSlow = tooSlow ? state.consecutiveSlow + 1 : 0;
  const consecutiveFast = fastEnough ? state.consecutiveFast + 1 : 0;
  if (consecutiveSlow >= REQUIRED_SAMPLES && state.level !== 'low') {
    return { level: step(state.level, -1), auto: true, averageFrameMs, consecutiveSlow: 0, consecutiveFast: 0 };
  }
  if (consecutiveFast >= REQUIRED_SAMPLES && state.level !== 'high') {
    return { level: step(state.level, 1), auto: true, averageFrameMs, consecutiveSlow: 0, consecutiveFast: 0 };
  }
  return { level: state.level, auto: true, averageFrameMs, consecutiveSlow, consecutiveFast };
}

export type QualityProfile = {
  pixelRatioCap: number;
  shadowsEnabled: boolean;
  drawDistance: number;
  trafficDensity: number;
  pedestrianDensity: number;
  cityDetailDensity: number;
};

// Presentation degrades first, in this fixed order: pixel ratio, then shadows, then draw
// distance, then background population density. Core traversal geometry, combat truth,
// destruction truth, and history state are never affected by quality level.
export function qualityProfile(level: QualityLevel): QualityProfile {
  if (level === 'low') return { pixelRatioCap: 1, shadowsEnabled: false, drawDistance: 160, trafficDensity: 0.35, pedestrianDensity: 0.3, cityDetailDensity: 0.3 };
  if (level === 'medium') return { pixelRatioCap: 1.35, shadowsEnabled: true, drawDistance: 260, trafficDensity: 0.7, pedestrianDensity: 0.65, cityDetailDensity: 0.65 };
  return { pixelRatioCap: 1.75, shadowsEnabled: true, drawDistance: 400, trafficDensity: 1, pedestrianDensity: 1, cityDetailDensity: 1 };
}
