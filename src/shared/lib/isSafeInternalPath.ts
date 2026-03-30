const INTERNAL_PATH_ORIGIN = "http://internal";
const SUSPICIOUS_PATH_CHARS = /[\s\u0000-\u001F\u007F\\<>"'`]/;

export function isSafeInternalPath(path: string): boolean {
  if (!path) return false;
  if (path !== path.trim()) return false;
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false;
  if (SUSPICIOUS_PATH_CHARS.test(path)) return false;
  if (path.toLowerCase().includes("javascript:")) return false;

  try {
    const parsed = new URL(path, INTERNAL_PATH_ORIGIN);
    return parsed.origin === INTERNAL_PATH_ORIGIN;
  } catch {
    return false;
  }
}
