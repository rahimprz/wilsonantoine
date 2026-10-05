/** Lets the hero hold its entrance until the preloader curtain lifts. */
let done = false;
const waiters = new Set<() => void>();

export function onIntroDone(fn: () => void): () => void {
  if (done) {
    fn();
    return () => {};
  }
  waiters.add(fn);
  return () => {
    waiters.delete(fn);
  };
}

export function finishIntro() {
  if (done) return;
  done = true;
  waiters.forEach((fn) => fn());
  waiters.clear();
}
