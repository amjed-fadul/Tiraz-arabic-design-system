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
  thread(
    ctx,
    sprites.working,
    145,
    288,
    0.12,
    0.118,
    pose.workingThread,
    pose,
    0.025,
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
