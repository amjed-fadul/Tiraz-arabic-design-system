import bodyUrl from "./assets/khayt-body.png";
import threadUrl from "./assets/khayt-thread.png";
import eyeUrl from "./assets/khayt-eye.png";
import whiteUrl from "./assets/khayt-eye-white.png";
import happyUrl from "./assets/khayt-eye-happy.png";
import concernedUrl from "./assets/khayt-eye-concerned.png";
import thinkingUrl from "./assets/khayt-thread-thinking.png";
import workingUrl from "./assets/khayt-thread-working.png";
import doneUrl from "./assets/khayt-thread-done.png";
import blockedUrl from "./assets/khayt-thread-blocked.png";

export type KhaytSprites = Record<
  | "body"
  | "thread"
  | "thinking"
  | "working"
  | "done"
  | "blocked"
  | "eye"
  | "bareEye"
  | "white"
  | "happy"
  | "concerned",
  HTMLCanvasElement
>;
let originals: Promise<Omit<KhaytSprites, "bareEye">> | undefined;
const colors = new Map<string, KhaytSprites>();
const clamp = (value: number) => Math.min(255, Math.max(0, value));

function load(
  url: string,
  crop: [number, number, number, number],
  maxEdge = 768,
) {
  return new Promise<HTMLCanvasElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, maxEdge / Math.max(crop[2], crop[3]));
      canvas.width = Math.round(crop[2] * scale);
      canvas.height = Math.round(crop[3] * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(image, ...crop, 0, 0, canvas.width, canvas.height);
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
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
    // Select dyed cotton by chroma; ivory retains its own material.
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

/** Original files stay intact; bounded, display-sized rasters are shared by instances. */
export async function khaytSprites(color: string): Promise<KhaytSprites> {
  const hex = /^#[\da-f]{6}$/i.test(color) ? color.toUpperCase() : "#946D91";
  if (colors.has(hex)) return colors.get(hex)!;
  originals ??= Promise.all([
    load(bodyUrl, [232, 144, 790, 1020]),
    load(threadUrl, [118, 145, 1042, 1002], 576),
    load(eyeUrl, [446, 254, 362, 744], 192),
    load(whiteUrl, [245, 268, 594, 929], 192),
    load(happyUrl, [275, 303, 921, 474], 192),
    load(thinkingUrl, [48, 118, 1076, 1189], 256),
    load(workingUrl, [76, 108, 864, 1373], 576),
    load(doneUrl, [53, 96, 858, 1467], 576),
    load(blockedUrl, [94, 150, 936, 1154], 288),
    load(concernedUrl, [184, 375, 757, 729], 192),
  ])
    .then(
      ([
        body,
        thread,
        eye,
        white,
        happy,
        thinking,
        working,
        done,
        blocked,
        concerned,
      ]) => ({
        body,
        thread,
        eye,
        white,
        happy,
        thinking,
        working,
        done,
        blocked,
        concerned,
      }),
    )
    .catch((error) => {
      originals = undefined;
      throw error;
    });
  const source = await originals;
  if (colors.has(hex)) return colors.get(hex)!;
  const result: KhaytSprites = {
    body: tint(source.body, hex),
    thread: tint(source.thread, hex),
    thinking: tint(source.thinking, hex),
    working: tint(source.working, hex),
    done: tint(source.done, hex),
    blocked: tint(source.blocked, hex),
    white: source.white,
    eye: source.eye,
    bareEye: tint(source.eye, hex, true),
    happy: tint(source.happy, hex, true),
    concerned: tint(source.concerned, hex),
  };
  if (colors.size >= 8) colors.delete(colors.keys().next().value!);
  colors.set(hex, result);
  return result;
}
