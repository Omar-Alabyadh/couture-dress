/**
 * Defer work until after the current effect flush so eslint
 * `react-hooks/set-state-in-effect` does not treat async loaders as synchronous cascades.
 */
export function runAfterEffectFlush(task: () => void): () => void {
  const id = globalThis.setTimeout(task, 0);
  return () => globalThis.clearTimeout(id);
}
