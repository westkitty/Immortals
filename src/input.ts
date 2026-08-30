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

const bindings: Record<string, GameAction[]> = {
  w: [Action.MoveForward], arrowup: [Action.MoveForward],
  s: [Action.MoveBack], arrowdown: [Action.MoveBack],
  a: [Action.MoveLeft], arrowleft: [Action.MoveLeft],
  d: [Action.MoveRight], arrowright: [Action.MoveRight],
  shift: [Action.Sprint], space: [Action.Jump], q: [Action.Dash],
  e: [Action.Grapple], g: [Action.Glide], v: [Action.Dive], x: [Action.Surf],
  f: [Action.Attack], r: [Action.Shockwave], h: [Action.History],
  c: [Action.Century], k: [Action.Save], t: [Action.DeepTime],
  escape: [Action.Pause], ']': [Action.CameraFaster], '[': [Action.CameraSlower],
  m: [Action.ReducedShake],
};

export type InputState = { down: Set<GameAction>; pressed: Set<GameAction>; released: Set<GameAction>; pointerDelta: { x: number; y: number }; keyDown: (key: string) => void; keyUp: (key: string) => void; consumeFrame: () => void };

export function createInputState(): InputState {
  const down = new Set<GameAction>();
  const pressed = new Set<GameAction>();
  const released = new Set<GameAction>();
  return {
    down, pressed, released, pointerDelta: { x: 0, y: 0 },
    keyDown(key) {
      for (const action of bindings[key.toLowerCase()] ?? []) {
        if (!down.has(action)) pressed.add(action);
        down.add(action);
      }
    },
    keyUp(key) { for (const action of bindings[key.toLowerCase()] ?? []) { down.delete(action); released.add(action); } },
    consumeFrame() { pressed.clear(); released.clear(); this.pointerDelta.x = 0; this.pointerDelta.y = 0; },
  };
}
