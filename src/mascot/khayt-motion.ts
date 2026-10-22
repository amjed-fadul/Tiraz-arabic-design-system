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
  gazeX: number;
  gazeY: number;
  eye: number;
  thread: number;
  curl: number;
}
const rest: KhaytPose = {
  lean: 0,
  twist: 0,
  stretch: 1,
  gazeX: 0,
  gazeY: 0,
  eye: 1,
  thread: 0,
  curl: 0,
};
const tau = Math.PI * 2;
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
  const t = Math.max(0, seconds);
  const pose = { ...rest };
  if (state === "thinking") {
    pose.lean = -9 + (still ? 0 : Math.sin(t * 1.4) * 5);
    pose.gazeX = -4;
    pose.gazeY = -6;
    pose.thread = -0.13 + (still ? 0 : Math.sin(t * 1.4 - 0.6) * 0.07);
    pose.curl = still ? 0 : Math.sin(t * 1.4) * 6;
  } else if (state === "working") {
    const cycle = still ? 0.18 : (t % 3.2) / 3.2;
    const wind = Math.sin(cycle * tau);
    const follow = Math.sin(cycle * tau - 0.65);
    pose.lean = wind * 12;
    pose.twist = follow * 7;
    pose.stretch = 1 - Math.cos(cycle * tau * 2) * 0.018;
    pose.gazeX = 5 + wind * 4;
    pose.gazeY = -3 - Math.max(0, follow) * 3;
    pose.thread = 0.06 + follow * 0.2;
    pose.curl = Math.sin(cycle * tau - 1) * 12;
  } else if (state === "waiting") {
    pose.lean = 7;
    pose.gazeY = -2;
    pose.thread = -0.28;
    pose.curl = -5;
    pose.stretch = 1.015;
    if (!still) pose.thread -= pulse(t, 0.15, 0.75) * 0.12;
  } else if (state === "done") {
    const nod = still ? 0 : pulse(t, 0.08, 0.7);
    pose.stretch = 1 - nod * 0.045;
    pose.gazeY = nod * 5;
    pose.eye = 0.85 - nod * 0.4;
    pose.thread = -0.08 - nod * 0.2;
    pose.curl = -4;
  } else if (state === "blocked") {
    pose.lean = -10;
    pose.gazeX = -4;
    pose.eye = 0.82;
    pose.thread = 0.3;
    pose.curl = 9;
  } else if (!still) {
    pose.stretch = 1 + Math.sin(t * 1.25) * 0.004;
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
