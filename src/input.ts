export const Action = {
  MoveForward: 'moveForward',
  MoveBack: 'moveBack',
  MoveLeft: 'moveLeft',
  MoveRight: 'moveRight',
  LookX: 'lookX',
  LookY: 'lookY',
  Sprint: 'sprint',
  Jump: 'jump',
  Rebound: 'rebound',
  Dash: 'dash',
  Grapple: 'grapple',
  Glide: 'glide',
  Dive: 'dive',
  Surf: 'surf',
  Attack: 'attack',
  Shockwave: 'shockwave',
  Archaeology: 'archaeology',
  Century: 'century',
  Save: 'save',
  History: 'history',
  DeepTime: 'deepTime',
  Pause: 'pause',
  CameraFaster: 'cameraFaster',
  CameraSlower: 'cameraSlower',
  ReducedShake: 'reducedShake',
} as const;

export type GameAction = typeof Action[keyof typeof Action];

// Actions a player can rebind via the settings surface. Look axes, pause, and camera
// speed trims are deliberately excluded: they are either continuous (handled outside the
// discrete key-binding table) or considered fixed chrome rather than remappable gameplay.
export const REBINDABLE_ACTIONS: GameAction[] = [
  Action.MoveForward, Action.MoveBack, Action.MoveLeft, Action.MoveRight,
  Action.Sprint, Action.Jump, Action.Dash, Action.Grapple, Action.Glide, Action.Dive, Action.Surf,
  Action.Attack, Action.Shockwave, Action.History, Action.Archaeology, Action.Century, Action.Save, Action.DeepTime,
  Action.ReducedShake,
];

export const DEFAULT_BINDINGS: Record<string, GameAction[]> = {
  w: [Action.MoveForward], arrowup: [Action.MoveForward],
  s: [Action.MoveBack], arrowdown: [Action.MoveBack],
  a: [Action.MoveLeft, Action.Archaeology], arrowleft: [Action.MoveLeft],
  d: [Action.MoveRight], arrowright: [Action.MoveRight],
  shift: [Action.Sprint], space: [Action.Jump], q: [Action.Dash],
  e: [Action.Grapple], g: [Action.Glide], v: [Action.Dive], x: [Action.Surf],
  f: [Action.Attack], r: [Action.Shockwave], h: [Action.History],
  c: [Action.Century], k: [Action.Save], t: [Action.DeepTime],
  escape: [Action.Pause], ']': [Action.CameraFaster], '[': [Action.CameraSlower],
  m: [Action.ReducedShake],
};

function cloneBindings(source: Record<string, GameAction[]>): Record<string, GameAction[]> {
  const clone: Record<string, GameAction[]> = {};
  for (const key of Object.keys(source)) clone[key] = [...source[key]];
  return clone;
}

// Input mode is tracked by observing the most recent meaningful interaction event rather than
// sniffing the user agent or classifying the device once at startup: a laptop with a touchscreen
// can be driven by keyboard one moment and touch the next, and a gamepad can be connected mid-session.
export type InputMode = 'keyboard' | 'mouse' | 'touch' | 'gamepad';

export type InputState = {
  down: Set<GameAction>;
  pressed: Set<GameAction>;
  released: Set<GameAction>;
  pointerDelta: { x: number; y: number };
  bindings: Record<string, GameAction[]>;
  mode: InputMode;
  // Analog movement/look intent contributed by touch joystick + gamepad left stick, blended
  // with digital keyboard movement in `moveVector`/`moveMagnitude` so main.ts's existing movement
  // code (which reads `down`) keeps working unmodified for keyboard/mouse, while touch and gamepad
  // additionally get proportional (non-binary) speed control.
  moveVector: { x: number; z: number };
  moveMagnitude: number;
  keyDown: (key: string) => void;
  keyUp: (key: string) => void;
  setBindings: (bindings: Record<string, GameAction[]>) => void;
  resetBindings: () => void;
  setAction: (action: GameAction, held: boolean, mode?: InputMode) => void;
  setAnalogMove: (x: number, z: number, mode?: InputMode) => void;
  addLookDelta: (x: number, y: number, mode?: InputMode) => void;
  setMode: (mode: InputMode) => void;
  pollGamepad: () => void;
  syncMove: () => void;
  consumeFrame: () => void;
};

const GAMEPAD_DEADZONE = 0.18;

// Default gamepad button/axis mapping (standard "standard" gamepad layout: Xbox/PS-style).
const GAMEPAD_BUTTON_ACTIONS: Record<number, GameAction> = {
  0: Action.Jump, // A / Cross
  1: Action.Dash, // B / Circle
  2: Action.Attack, // X / Square
  3: Action.Glide, // Y / Triangle
  4: Action.Surf, // LB / L1
  5: Action.Grapple, // RB / R1
  9: Action.Pause, // Start / Options
  12: Action.CameraFaster,
  13: Action.CameraSlower,
};

export function createInputState(initialBindings?: Record<string, GameAction[]>): InputState {
  const down = new Set<GameAction>();
  const pressed = new Set<GameAction>();
  const released = new Set<GameAction>();
  const bindings = cloneBindings(initialBindings ?? DEFAULT_BINDINGS);
  const keyboardDown = new Set<GameAction>();
  const touchDown = new Set<GameAction>();
  const gamepadDown = new Set<GameAction>();
  let mode: InputMode = 'keyboard';
  let touchMoveX = 0, touchMoveZ = 0, gamepadMoveX = 0, gamepadMoveZ = 0;
  let gamepadIndex: number | null = null;
  let lastGamepadButtons = new Map<number, boolean>();

  const recomputeAction = (action: GameAction) => {
    const held = keyboardDown.has(action) || touchDown.has(action) || gamepadDown.has(action);
    const was = down.has(action);
    if (held && !was) { down.add(action); pressed.add(action); }
    else if (!held && was) { down.delete(action); released.add(action); }
  };

  const state: InputState = {
    down, pressed, released, pointerDelta: { x: 0, y: 0 }, bindings, mode,
    moveVector: { x: 0, z: 0 }, moveMagnitude: 0,
    keyDown(key) {
      state.mode = 'keyboard';
      for (const action of bindings[key.toLowerCase()] ?? []) { keyboardDown.add(action); recomputeAction(action); }
    },
    keyUp(key) {
      for (const action of bindings[key.toLowerCase()] ?? []) { keyboardDown.delete(action); recomputeAction(action); }
    },
    setBindings(next) {
      for (const key of Object.keys(bindings)) delete bindings[key];
      for (const key of Object.keys(next)) bindings[key] = [...next[key]];
    },
    resetBindings() { state.setBindings(DEFAULT_BINDINGS); },
    setAction(action, held, sourceMode) {
      if (sourceMode) state.mode = sourceMode;
      const bucket = sourceMode === 'gamepad' ? gamepadDown : sourceMode === 'touch' ? touchDown : keyboardDown;
      if (held) bucket.add(action); else bucket.delete(action);
      recomputeAction(action);
    },
    setAnalogMove(x, z, sourceMode) {
      if (sourceMode === 'touch') { touchMoveX = x; touchMoveZ = z; state.mode = 'touch'; }
      else if (sourceMode === 'gamepad') { gamepadMoveX = x; gamepadMoveZ = z; state.mode = 'gamepad'; }
    },
    addLookDelta(x, y, sourceMode) {
      if (sourceMode) state.mode = sourceMode;
      state.pointerDelta.x += x;
      state.pointerDelta.y += y;
    },
    setMode(next) { state.mode = next; },
    pollGamepad() {
      const pads = typeof navigator !== 'undefined' ? navigator.getGamepads?.() ?? [] : [];
      let pad: Gamepad | null = null;
      if (gamepadIndex !== null) pad = pads[gamepadIndex] ?? null;
      if (!pad) { pad = Array.from(pads).find((candidate): candidate is Gamepad => !!candidate) ?? null; gamepadIndex = pad?.index ?? null; }
      if (!pad) { gamepadMoveX = 0; gamepadMoveZ = 0; for (const action of gamepadDown) { gamepadDown.delete(action); recomputeAction(action); } return; }
      const ax0 = pad.axes[0] ?? 0, ax1 = pad.axes[1] ?? 0, ax2 = pad.axes[2] ?? 0, ax3 = pad.axes[3] ?? 0;
      const moveActive = Math.hypot(ax0, ax1) > GAMEPAD_DEADZONE;
      gamepadMoveX = moveActive ? ax0 : 0;
      gamepadMoveZ = moveActive ? ax1 : 0;
      if (moveActive) state.mode = 'gamepad';
      if (Math.hypot(ax2, ax3) > GAMEPAD_DEADZONE) { state.addLookDelta(ax2 * 32, ax3 * 26, 'gamepad'); }
      const leftTrigger = pad.buttons[6]?.value ?? 0;
      const rightTrigger = pad.buttons[7]?.value ?? 0;
      state.setAction(Action.Sprint, rightTrigger > 0.35 || pad.buttons[10]?.pressed === true, moveActive || rightTrigger > 0.35 ? 'gamepad' : undefined);
      state.setAction(Action.Shockwave, leftTrigger > 0.6, undefined);
      for (const [index, action] of Object.entries(GAMEPAD_BUTTON_ACTIONS)) {
        const pressedNow = pad.buttons[Number(index)]?.pressed === true;
        const wasPressed = lastGamepadButtons.get(Number(index)) === true;
        if (pressedNow && !wasPressed) state.mode = 'gamepad';
        state.setAction(action, pressedNow, undefined);
        lastGamepadButtons.set(Number(index), pressedNow);
      }
    },
    syncMove() {
      const kbX = (keyboardDown.has(Action.MoveRight) ? 1 : 0) - (keyboardDown.has(Action.MoveLeft) ? 1 : 0);
      const kbZ = (keyboardDown.has(Action.MoveBack) ? 1 : 0) - (keyboardDown.has(Action.MoveForward) ? 1 : 0);
      const analogX = touchMoveX + gamepadMoveX;
      const analogZ = touchMoveZ + gamepadMoveZ;
      const usingAnalog = Math.hypot(analogX, analogZ) > 0.001;
      state.moveVector.x = usingAnalog ? THREE_clamp(analogX) : kbX;
      state.moveVector.z = usingAnalog ? THREE_clamp(analogZ) : kbZ;
      state.moveMagnitude = usingAnalog ? Math.min(1, Math.hypot(analogX, analogZ)) : (kbX || kbZ ? 1 : 0);
    },
    consumeFrame() {
      pressed.clear(); released.clear(); state.pointerDelta.x = 0; state.pointerDelta.y = 0;
    },
  };
  return state;
}

function THREE_clamp(value: number): number { return Math.max(-1, Math.min(1, value)); }
