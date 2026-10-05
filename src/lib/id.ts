/** Short, sortable-enough unique id for locally stored records. */
export function uid(prefix = ""): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}${Date.now().toString(36)}${rand}`;
}
