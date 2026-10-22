import { posix } from "node:path";

function dimensions(bytes, extension, path) {
  if (extension === ".png") {
    if (
      bytes.length < 33 ||
      !bytes
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
      bytes.readUInt32BE(8) !== 13 ||
      bytes.toString("ascii", 12, 16) !== "IHDR"
    )
      throw new Error(`Invalid PNG asset: ${path}`);
    return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
  }
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8)
    throw new Error(`Invalid JPEG asset: ${path}`);
  let offset = 2;
  while (offset + 3 < bytes.length) {
    if (bytes[offset++] !== 0xff) break;
    while (bytes[offset] === 0xff) offset++;
    const marker = bytes[offset++];
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    const length = bytes.readUInt16BE(offset);
    if (length < 2 || offset + length > bytes.length) break;
    if (
      [
        0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce,
        0xcf,
      ].includes(marker)
    ) {
      if (length < 8) break;
      return [bytes.readUInt16BE(offset + 5), bytes.readUInt16BE(offset + 3)];
    }
    offset += length;
  }
  throw new Error(`Invalid JPEG dimensions: ${path}`);
}

export function decodeText(bytes, path) {
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    if (bytes.some((byte) => byte < 32 && ![9, 10, 13].includes(byte)))
      throw new Error();
    return text;
  } catch {
    throw new Error(`Unsupported binary file: ${path}`);
  }
}

// The shadcn registry schema carries strings and its CLI writes UTF-8. Wrapping
// the original raster bytes avoids decoding binary as text or recompressing art.
export function registrySource(source) {
  const renames = new Map();
  const output = new Map();
  for (const [path, bytes] of source) {
    if (!bytes.length)
      throw new Error(
        `Empty source file cannot be delivered by shadcn: ${path}`,
      );
    const extension = posix.extname(path).toLowerCase();
    if (![".png", ".jpg", ".jpeg"].includes(extension)) {
      output.set(path, decodeText(bytes, path));
      continue;
    }
    const target = path.slice(0, -extension.length) + ".svg";
    if (source.has(target) || output.has(target))
      throw new Error(
        `Registry asset conversion collision: ${path} -> ${target}`,
      );
    const [width, height] = dimensions(bytes, extension, path);
    if (!width || !height) throw new Error(`Invalid image dimensions: ${path}`);
    const mime = extension === ".png" ? "image/png" : "image/jpeg";
    output.set(
      target,
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><image width="${width}" height="${height}" href="data:${mime};base64,${bytes.toString("base64")}"/></svg>\n`,
    );
    renames.set(path, target);
  }
  for (const [path, content] of output) {
    if (path.endsWith(".svg")) continue;
    const replace = (reference) => {
      const [, pathname, suffix = ""] = reference.match(/^([^?#]*)([?#].*)?$/s);
      const local = posix.normalize(posix.join(posix.dirname(path), pathname));
      const target = renames.get(local);
      if (target) {
        let relative = posix.relative(posix.dirname(path), target);
        if (pathname.startsWith("./") && !relative.startsWith("."))
          relative = `./${relative}`;
        return relative + suffix;
      }
      // Registry metadata records source-root-relative paths.
      if (path.startsWith("system/ai/") && renames.has(`system/${pathname}`))
        return (
          renames.get(`system/${pathname}`).slice("system/".length) + suffix
        );
      return reference;
    };
    output.set(
      path,
      content
        .replace(
          /(["'`])([^"'`\r\n]+)\1/g,
          (whole, quote, reference) => `${quote}${replace(reference)}${quote}`,
        )
        .replace(
          /(\]\()([^\s)]+)(\))/g,
          (whole, before, reference, after) =>
            `${before}${replace(reference)}${after}`,
        ),
    );
  }
  return new Map([...output].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}
