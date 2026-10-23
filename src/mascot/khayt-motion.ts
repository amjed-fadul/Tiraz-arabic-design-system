export const khaytStates = [
  "idle",
  "thinking",
  "working",
  "waiting",
  "done",
  "blocked",
] as const;
export type KhaytState = (typeof khaytStates)[number];

export interface KhaytPose {
  lean: number;
  twist: number;
  stretch: number;
  lift: number;
  gazeX: number;
  gazeY: number;
  eye: number;
  thread: number;
  curl: number;
  whites: number;
  eyeRound: number;
  happy: number;
  concern: number;
  asymmetry: number;
  readyThread: number;
  thinkingThread: number;
  workingThread: number;
  weave: number;
  waitingThread: number;
  doneThread: number;
  blockedThread: number;
}
const rest: KhaytPose = {
  lean: 0,
  twist: 0,
  stretch: 1,
  lift: 0,
  gazeX: 0,
  gazeY: 0,
  eye: 1,
  thread: 0,
  curl: 0,
  whites: 0,
  eyeRound: 0,
  happy: 0,
  concern: 0,
  asymmetry: 0,
  readyThread: 1,
  thinkingThread: 0,
  workingThread: 0,
  weave: 0.45,
  waitingThread: 0,
  doneThread: 0,
  blockedThread: 0,
};
const pulse = (time: number, start: number, duration: number) =>
  time < start || time > start + duration
    ? 0
    : Math.sin(((time - start) / duration) * Math.PI);

/** Seconds of visible, unpaused time; finite states settle instead of looping. */
export function khaytPose(
  state: KhaytState,
  seconds: number,
  still = false,
): KhaytPose {
  const t = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const pose = { ...rest };
  if (state !== "idle") {
    pose.readyThread = 0;
    pose.whites = 1;
  }
  if (state === "thinking") {
    // A glance, a pause, then another thought. The pauses distinguish thinking
    // from working's steady rhythm without claiming measurable progress.
    const glance = still ? 0 : pulse(t % 5.8, 0.5, 1.6);
    const consider = still ? 0 : pulse(t % 5.8, 3.2, 1.1);
    pose.thinkingThread = 1;
    pose.lean = 20 + glance * 6 - consider * 3;
    pose.twist = -6;
    pose.gazeX = -4;
    pose.gazeY = -6 - glance;
    pose.eyeRound = 0.35;
    pose.asymmetry = 0.12;
    pose.thread = glance * -0.06;
    pose.curl = consider * 3;
  } else if (state === "working") {
    // Two alternating passes make a continuous weave, never a progress meter.
    const weave = still ? 0.45 : (t % 3.6) / 1.8;
    const pass = weave % 1;
    const across = Math.min(1, pass / 0.78);
    const travel = across * across * (3 - 2 * across);
    const gaze = weave < 1 ? travel : 1 - travel;
    const pack = Math.max(0, (pass - 0.78) / 0.22);
    const tug = still ? 0 : Math.sin(pack * Math.PI);
    pose.workingThread = 1;
    pose.weave = weave;
    pose.lean = 13 + gaze * 5 - tug * 3;
    pose.twist = tug * -2;
    pose.stretch = 0.99 - tug * 0.016;
    pose.gazeX = 3 + gaze * 3;
    pose.gazeY = 4;
    pose.eyeRound = 0.12;
  } else if (state === "waiting") {
    const wave = still ? 0 : pulse(t, 0.12, 0.95);
    pose.waitingThread = 1;
    pose.eyeRound = 1;
    pose.stretch = 1.035 + wave * 0.008;
    pose.thread = -0.25 + Math.sin(t * 11) * wave * 0.11;
    pose.curl = wave * 3;
  } else if (state === "done") {
    const prepare = still ? 0 : pulse(t, 0, 0.25);
    const lift = still ? 0 : pulse(t, 0.2, 0.55);
    const land = still ? 0 : pulse(t, 0.75, 0.35);
    pose.doneThread = 1;
    pose.happy = 1;
    pose.whites = 0;
    pose.stretch = 1 - prepare * 0.035 + lift * 0.015 - land * 0.025;
    pose.lift = lift * 9;
    pose.thread = -lift * 0.025;
    pose.curl = land * 2;
  } else if (state === "blocked") {
    const catchThread = still ? 0 : pulse(t, 0.1, 0.5);
    const notice = still ? 0 : pulse(t, 0.4, 0.65);
    pose.blockedThread = 1;
    pose.lean = -7 + catchThread * 9;
    pose.stretch = 0.94 - catchThread * 0.015;
    pose.eyeRound = 0.3;
    pose.concern = 1;
    pose.gazeY = -3;
    pose.gazeX = notice * 5;
    pose.thread = catchThread * 0.06;
  } else if (!still) {
    pose.stretch = 1 + Math.sin(t * 1.25) * 0.005;
    pose.thread = Math.sin(t * 1.25 - 0.5) * 0.025;
  }
  // Blinks are brief and sparse, with one double blink in a 13-second phrase.
  if (
    !still &&
    (state === "idle" || state === "thinking" || state === "working")
  ) {
    const beat = t % 13;
    const blink = Math.max(
      pulse(beat, 3.4, 0.18),
      pulse(beat, 8.8, 0.2),
      pulse(beat, 9.12, 0.15),
    );
    pose.eye *= 1 - blink * 0.94;
  }
  return pose;
}

export function mixPose(
  from: KhaytPose,
  to: KhaytPose,
  amount: number,
): KhaytPose {
  const t = Math.min(1, Math.max(0, amount));
  if (t === 0) return { ...from };
  if (t === 1) return { ...to };
  const ease = t * t * (3 - 2 * t);
  return Object.fromEntries(
    Object.keys(from).map((key) => {
      const k = key as keyof KhaytPose;
      return [k, from[k] + (to[k] - from[k]) * ease];
    }),
  ) as unknown as KhaytPose;
}

export function isLooping(state: KhaytState) {
  return state === "idle" || state === "thinking" || state === "working";
}
