/**
 * The loom's animation clock: seconds of running time. It follows real time
 * between frames, so the opening weave finishes on schedule even when frames
 * arrive slowly. Paused stretches (hidden tab, off-screen, pause button) are
 * excluded by calling pause(); the next tick then starts a new stretch.
 */
export function createLoomClock(startAt = 0) {
  let elapsed = startAt * 1000;
  let last: number | undefined;
  return {
    tick(now: number) {
      if (last !== undefined) elapsed += Math.max(0, now - last);
      last = now;
    },
    pause() {
      last = undefined;
    },
    get seconds() {
      return elapsed / 1000;
    },
  };
}
