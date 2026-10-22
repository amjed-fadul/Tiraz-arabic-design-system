/** References navigate only to HTTP(S) or local relative/fragment destinations. */
export function sourceHref(value?: string): string | undefined {
  if (!value) return;
  const href = value.trim();
  // Reject controls and backslashes before the browser can normalize a scheme/host.
  if (
    !href ||
    Array.from(href).some(
      (char) =>
        char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127 || char === "\\",
    ) ||
    href.startsWith("//")
  )
    return;
  const scheme = /^([a-z][a-z\d+.-]*):/i.exec(href);
  if (scheme && !/^https?$/i.test(scheme[1])) return;
  try {
    const url = new URL(href, "https://tiraz.invalid/");
    if (!/^https?:$/.test(url.protocol) || url.username || url.password) return;
    return href;
  } catch {
    return;
  }
}
