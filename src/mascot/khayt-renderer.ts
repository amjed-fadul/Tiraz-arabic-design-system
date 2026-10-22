import bodyUrl from "./assets/khayt-body.png";
import threadUrl from "./assets/khayt-thread.png";
import eyeUrl from "./assets/khayt-eye.png";
import type { KhaytPose } from "./khayt-motion";

type Sprites = {
  body: HTMLCanvasElement;
  thread: HTMLCanvasElement;
  eye: HTMLCanvasElement;
};
let originals: Promise<Sprites> | undefined;
const colors = new Map<string, Sprites>();
const clamp = (value: number) => Math.min(255, Math.max(0, value));

function load(url: string, crop: [number, number, number, number]) {
  return new Promise<HTMLCanvasElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = crop[2];
      canvas.height = crop[3];
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(image, ...crop, 0, 0, canvas.width, canvas.height);
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
      // Ignore the generator's almost-transparent fringe, preserving soft edges.
      for (let i = 3; i < pixels.data.length; i += 4)
        if (pixels.data[i] < 12) pixels.data[i] = 0;
      ctx.putImageData(pixels, 0, 0);
      resolve(canvas);
    };
    image.onerror = () => reject(new Error("Khayt artwork could not load"));
    image.src = url;
  });
}

function tint(source: HTMLCanvasElement, hex: string, eye = false) {
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(source, 0, 0);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const rgb = [1, 3, 5].map((offset) =>
    parseInt(hex.slice(offset, offset + 2), 16),
  );
  const lightEye = rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722 < 85;
  for (let i = 0; i < pixels.data.length; i += 4) {
    if (!pixels.data[i + 3]) continue;
    const [r, g, b] = [pixels.data[i], pixels.data[i + 1], pixels.data[i + 2]];
    if (eye) {
      if (lightEye) {
        pixels.data[i] = 232 + r * 0.08;
        pixels.data[i + 1] = 224 + g * 0.08;
        pixels.data[i + 2] = 210 + b * 0.08;
      }
      continue;
    }
    // Select dyed yarn by chroma, so the ivory core retains its own material.
    const weight = Math.min(1, Math.max(0, (Math.min(r, b) - g - 5) / 18));
    const shade = g / 125;
    const highlight = Math.max(0, g - 165) * 0.45;
    for (let channel = 0; channel < 3; channel++) {
      const old = pixels.data[i + channel];
      pixels.data[i + channel] =
        old * (1 - weight) + clamp(rgb[channel] * shade + highlight) * weight;
    }
  }
  ctx.putImageData(pixels, 0, 0);
  return canvas;
}

export async function khaytSprites(color: string): Promise<Sprites> {
  const hex = /^#[\da-f]{6}$/i.test(color) ? color.toUpperCase() : "#946D91";
  if (colors.has(hex)) return colors.get(hex)!;
  originals ??= Promise.all([
    load(bodyUrl, [232, 144, 790, 1020]),
    load(threadUrl, [118, 145, 1042, 1002]),
    load(eyeUrl, [446, 254, 362, 744]),
  ])
    .then(([body, thread, eye]) => ({ body, thread, eye }))
    .catch((error) => {
      originals = undefined;
      throw error;
    });
  const source = await originals;
  if (colors.has(hex)) return colors.get(hex)!;
  const result = {
    body: tint(source.body, hex),
    thread: tint(source.thread, hex),
    eye: tint(source.eye, hex, true),
  };
  if (colors.size >= 8) colors.delete(colors.keys().next().value!);
  colors.set(hex, result);
  return result;
}

function bend(pose: KhaytPose, v: number) {
  return (
    pose.lean * (1 - v) ** 1.5 +
    pose.twist * Math.sin(v * Math.PI * 2) * (1 - v)
  );
}

/** Raster puppet: the cotton body, ceramic eyes, and loose thread move separately. */
export function drawKhayt(
  ctx: CanvasRenderingContext2D,
  sprites: Sprites,
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
    x = 97,
    y = 452 - h;
  // The attachment is hidden behind the upper yarn tier. Motion grows towards
  // the free tip instead of sliding the root around the body.
  ctx.save();
  ctx.translate(x + w - 22 + bend(pose, 0.23), y + h * 0.23);
  ctx.rotate(pose.thread);
  const threadW = 126,
    threadH = 133;
  for (let row = 0; row < 40; row++) {
    const v = row / 40;
    const offset = pose.curl * (1 - v) ** 2;
    ctx.drawImage(
      sprites.thread,
      0,
      v * sprites.thread.height,
      sprites.thread.width,
      sprites.thread.height / 40,
      -7 + offset,
      -123 + v * threadH,
      threadW,
      threadH / 40 + 0.35,
    );
  }
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
  const faceX = x + w / 2 + bend(pose, 0.636) + pose.gazeX;
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(faceX + side * 29, faceY + pose.gazeY);
    ctx.rotate(-pose.lean / 500);
    const eyeH = 37 * pose.eye;
    ctx.drawImage(sprites.eye, -9, -eyeH / 2, 18, eyeH);
    ctx.restore();
  }
  ctx.restore();
}
