import type { KhaytSprites } from "./khayt-artwork";
import type { KhaytPose } from "./khayt-motion";

function bend(pose: KhaytPose, v: number) {
  return (
    pose.lean * (1 - v) ** 1.5 +
    pose.twist * Math.sin(v * Math.PI * 2) * (1 - v)
  );
}

function thread(
  ctx: CanvasRenderingContext2D,
  sprite: HTMLCanvasElement,
  width: number,
  height: number,
  rootX: number,
  rootY: number,
  opacity: number,
  pose: KhaytPose,
  rotationLimit = 1,
) {
  if (opacity < 0.001) return;
  ctx.save();
  ctx.globalAlpha = opacity;
  // Limit each silhouette's turn, including while two states crossfade.
  ctx.rotate(Math.max(-rotationLimit, Math.min(rotationLimit, pose.thread)));
  // Root stays attached. Only the free length responds to the cotton's motion.
  for (let row = 0; row < 48; row++) {
    const v = row / 48;
    const distance = Math.abs(v - rootY);
    const offset = pose.curl * distance * Math.sin(v * Math.PI * 2);
    ctx.drawImage(
      sprite,
      0,
      v * sprite.height,
      sprite.width,
      sprite.height / 48,
      -rootX * width + offset,
      (v - rootY) * height,
      width,
      height / 48 + 0.35,
    );
  }
  ctx.restore();
}

type YarnPalette = { shade: string; cotton: string; light: string };
const yarnPalettes = new WeakMap<HTMLCanvasElement, YarnPalette>();

function yarnPalette(body: HTMLCanvasElement): YarnPalette {
  const cached = yarnPalettes.get(body);
  if (cached) return cached;
  // Sample dyed cotton once per cached sprite, so every agent keeps its color.
  const pixels = body
    .getContext("2d")!
    .getImageData(
      Math.floor(body.width * 0.4),
      Math.floor(body.height * 0.4),
      8,
      8,
    ).data;
  const rgb = [0, 1, 2].map((channel) => {
    let total = 0;
    for (let i = channel; i < pixels.length; i += 4) total += pixels[i];
    return total / (pixels.length / 4);
  });
  const color = (shade: number, light = 0) =>
    `rgb(${rgb.map((value) => Math.round(value * shade + (255 - value) * light)).join(" ")})`;
  const palette = {
    shade: color(0.6),
    cotton: color(1),
    light: color(1, 0.32),
  };
  yarnPalettes.set(body, palette);
  return palette;
}

function cotton(
  ctx: CanvasRenderingContext2D,
  path: Path2D,
  size: number,
  palette: YarnPalette,
  detailed: boolean,
) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = size;
  ctx.strokeStyle = palette.shade;
  ctx.stroke(path);
  ctx.translate(-0.45, -0.65);
  ctx.lineWidth = size * 0.78;
  ctx.strokeStyle = palette.cotton;
  ctx.stroke(path);
  ctx.translate(-0.35, -0.45);
  ctx.lineWidth = size * 0.23;
  ctx.strokeStyle = palette.light;
  ctx.stroke(path);
  if (detailed) {
    ctx.setLineDash([0.65, 2.4]);
    ctx.lineWidth = size * 0.72;
    ctx.globalAlpha *= 0.35;
    ctx.stroke(path);
  }
  ctx.restore();
}

function miniWeave(
  ctx: CanvasRenderingContext2D,
  body: HTMLCanvasElement,
  pose: KhaytPose,
  rootX: number,
  rootY: number,
) {
  if (pose.workingThread < 0.001) return;
  const palette = yarnPalette(body);
  const detailed = ctx.canvas.width >= 160;
  const left = 358,
    right = 466,
    top = 350,
    gap = 15;
  const pass = Math.floor(pose.weave);
  const time = pose.weave - pass;
  const smooth = (value: number) => value * value * (3 - 2 * value);
  const travel = smooth(Math.min(1, time / 0.78));
  const pack = smooth(Math.max(0, (time - 0.78) / 0.22));
  const forward = pass % 2 === 0;
  const tipX = left + (right - left) * (forward ? travel : 1 - travel);
  const warpX = (index: number) => left + 6 + index * 16;

  ctx.save();
  ctx.globalAlpha = pose.workingThread;
  // The free strand stays attached to the spool as its body leans and tugs.
  const feed = new Path2D();
  feed.moveTo(rootX, rootY);
  feed.bezierCurveTo(rootX + 83, rootY - 48, 486, top - 78, tipX, top);
  cotton(ctx, feed, 8.5, palette, detailed);

  ctx.save();
  ctx.beginPath();
  ctx.rect(left - 12, top - 7, right - left + 24, 84);
  ctx.clip();
  for (let index = 0; index < 7; index++) {
    const warp = new Path2D();
    const x = warpX(index);
    warp.moveTo(x, top - 5);
    warp.bezierCurveTo(x - 1, top + 24, x + 1, top + 52, x, top + 77);
    cotton(ctx, warp, 6, palette, detailed);
  }

  // Finished rows feed down into the cloth. Two passes restore identical
  // geometry and parity, so the loop has no reset, flash, or completion cue.
  for (let row = 5; row >= 0; row--) {
    const y = top + (row + pack) * gap;
    const progress = row === 0 ? travel : 1;
    const parity = (pass + row) % 2;
    const startX = parity === 0 ? left : right;
    const endX = startX + (parity === 0 ? 1 : -1) * (right - left) * progress;
    ctx.save();
    ctx.globalAlpha *= Math.max(0, Math.min(1, (top + 77 - y) / 20));
    const weft = new Path2D();
    weft.moveTo(startX, y);
    const steps = Math.ceil(progress * 42);
    for (let step = 1; step <= steps; step++) {
      const x = startX + ((endX - startX) * step) / steps;
      weft.lineTo(x, y + Math.sin(((x - left) / 16) * Math.PI) * 0.65);
    }
    cotton(ctx, weft, 8, palette, detailed);
    // Alternating crossings expose the warp over every other weft.
    for (let index = 0; index < 7; index++) {
      const x = warpX(index);
      if (
        (index + parity) % 2 === 0 ||
        x < Math.min(startX, endX) ||
        x > Math.max(startX, endX)
      )
        continue;
      const crossing = new Path2D();
      crossing.moveTo(x, y - 4);
      crossing.lineTo(x, y + 4);
      cotton(ctx, crossing, 6, palette, detailed);
    }
    const turn = new Path2D();
    turn.moveTo(startX, y + gap);
    turn.bezierCurveTo(
      startX + (parity === 0 ? -8 : 8),
      y + gap,
      startX + (parity === 0 ? -8 : 8),
      y,
      startX,
      y,
    );
    cotton(ctx, turn, 8, palette, detailed);
    ctx.restore();
  }
  // Lift the free yarn for the return pass while the new row settles.
  if (pack > 0) {
    const turn = new Path2D();
    const outside = (forward ? 8 : -8) * pack;
    turn.moveTo(tipX, top + pack * gap);
    turn.bezierCurveTo(
      tipX + outside,
      top + pack * gap,
      tipX + outside,
      top,
      tipX,
      top,
    );
    cotton(ctx, turn, 8, palette, detailed);
  }
  ctx.restore();
  ctx.restore();
}

/** Generated cotton and ceramic layers deform independently, retaining their texture. */
export function drawKhayt(
  ctx: CanvasRenderingContext2D,
  sprites: KhaytSprites,
  pose: KhaytPose,
) {
  const width = ctx.canvas.width;
  ctx.clearRect(0, 0, width, width);
  ctx.save();
  ctx.scale(width / 512, width / 512);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  const h = 338 * pose.stretch,
    w = 262,
    x = 85,
    y = 452 - h - pose.lift;
  const angle = pose.lean / 260;
  const rootX = w / 2 - 22 + bend(pose, 0.23);
  const rootY = -h * 0.77;
  miniWeave(
    ctx,
    sprites.body,
    pose,
    x + w / 2 + rootX * Math.cos(angle) - rootY * Math.sin(angle),
    452 - pose.lift + rootX * Math.sin(angle) + rootY * Math.cos(angle),
  );
  ctx.translate(x + w / 2, 452 - pose.lift);
  ctx.rotate(pose.lean / 260);
  ctx.translate(-x - w / 2, -452 + pose.lift);
  ctx.save();
  ctx.translate(x + w - 22 + bend(pose, 0.23), y + h * 0.23);
  thread(ctx, sprites.thread, 114, 119, 0.055, 0.925, pose.readyThread, pose);
  thread(
    ctx,
    sprites.thinking,
    72,
    82,
    0.066,
    0.924,
    pose.thinkingThread,
    pose,
  );
  thread(ctx, sprites.thread, 91, 159, 0.055, 0.925, pose.waitingThread, pose);
  thread(
    ctx,
    sprites.done,
    132,
    264,
    0.04,
    0.026,
    pose.doneThread,
    pose,
    0.025,
  );
  thread(ctx, sprites.blocked, 91, 126, 0.015, 0.43, pose.blockedThread, pose);
  ctx.restore();
  for (let row = 0; row < 80; row++) {
    const v = row / 80;
    ctx.drawImage(
      sprites.body,
      0,
      v * sprites.body.height,
      sprites.body.width,
      sprites.body.height / 80,
      x + bend(pose, v),
      y + v * h,
      w,
      h / 80 + 0.25,
    );
  }
  const faceY = y + h * 0.636;
  const faceX = x + w / 2 + bend(pose, 0.636);
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(faceX + side * 31, faceY);
    ctx.rotate(-pose.lean / 500);
    const eyeH = (43 + pose.eyeRound * 4) * (1 + side * pose.asymmetry);
    const eyeW = 32 + pose.eyeRound * 9;
    ctx.scale(1, pose.eye);
    const open = Math.max(0, 1 - pose.happy - pose.concern);
    ctx.globalAlpha = pose.whites * open;
    ctx.drawImage(sprites.white, -eyeW / 2, -eyeH / 2, eyeW, eyeH);
    // Pupils stay dark over ivory, even when the user chooses a very dark yarn.
    const pupilW = 18 + pose.eyeRound * 8;
    const pupilH = 29 + pose.eyeRound * 5;
    ctx.drawImage(
      sprites.eye,
      pose.gazeX - pupilW / 2,
      pose.gazeY - pupilH / 2,
      pupilW,
      pupilH,
    );
    ctx.globalAlpha = (1 - pose.whites) * open;
    ctx.drawImage(sprites.bareEye, pose.gazeX - 9, pose.gazeY - 18.5, 18, 37);
    ctx.globalAlpha = pose.happy;
    ctx.drawImage(sprites.happy, -17.5, -10.5, 35, 21);
    ctx.globalAlpha = pose.concern;
    ctx.scale(-side, 1);
    ctx.drawImage(
      sprites.concerned,
      -18 + pose.gazeX * -side * 0.2,
      -22,
      36,
      44,
    );
    ctx.restore();
  }
  ctx.restore();
}
