/** Salted SHA-256 of the admin passcode. A convenience lock for this browser, not server-side security. */
export async function hashPasscode(pass: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${pass}`);
  if (globalThis.crypto?.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
  }
  // insecure contexts (plain http on a LAN IP) have no SubtleCrypto; fall back to FNV-1a
  let h = 0x811c9dc5;
  for (const byte of data) h = Math.imul(h ^ byte, 0x01000193) >>> 0;
  return `fnv-${h.toString(16)}`;
}

export function newSalt(): string {
  const bytes = new Uint8Array(12);
  globalThis.crypto?.getRandomValues?.(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("") || String(Math.random()).slice(2);
}

const SESSION_KEY = "wa.admin.unlocked";
export const isUnlocked = () => {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
};
export const setUnlocked = (on: boolean) => {
  try {
    if (on) sessionStorage.setItem(SESSION_KEY, "1");
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
};
