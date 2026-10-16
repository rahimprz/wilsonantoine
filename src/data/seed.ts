import { importBackup } from "./stores";
import { SEALED_SEED } from "./seed.sealed";

const APPLIED_KEY = "wa.seed.applied";

function fromB64(s: string) {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

function appliedIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(APPLIED_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

/**
 * The first time the dashboard is unlocked in a browser, opens the sealed setup data (the figures
 * from the publisher's statement) with the passcode just entered and merges it in. Runs once per
 * browser; does nothing if it was applied before, if the passcode can't open it, or if WebCrypto is
 * unavailable. Returns true when data was added.
 */
export async function applySealedSeed(passcode: string): Promise<boolean> {
  if (!SEALED_SEED.data || appliedIds().includes(SEALED_SEED.id)) return false;
  try {
    const subtle = globalThis.crypto?.subtle;
    if (!subtle) return false;
    const material = await subtle.importKey("raw", new TextEncoder().encode(passcode), "PBKDF2", false, ["deriveKey"]);
    const key = await subtle.deriveKey(
      { name: "PBKDF2", hash: "SHA-256", salt: fromB64(SEALED_SEED.salt), iterations: SEALED_SEED.iterations },
      material,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"],
    );
    const plain = await subtle.decrypt({ name: "AES-GCM", iv: fromB64(SEALED_SEED.iv) }, key, fromB64(SEALED_SEED.data));
    importBackup(JSON.parse(new TextDecoder().decode(plain)));
    localStorage.setItem(APPLIED_KEY, JSON.stringify([...appliedIds(), SEALED_SEED.id]));
    return true;
  } catch {
    // a different passcode (it was changed before the first unlock) simply leaves the data out
    return false;
  }
}
