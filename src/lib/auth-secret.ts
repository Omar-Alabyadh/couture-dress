/**
 * Resolves the Auth.js / NextAuth JWT encryption secret.
 *
 * `process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET` is unsafe: an empty
 * `AUTH_SECRET` in the environment (common when the key exists but has no value)
 * blocks the `??` fallback and yields a blank secret — OAuth succeeds, then
 * `jwt.encode` fails and Auth.js redirects with `error=Configuration`.
 */
export function resolveAuthSecret(): string | undefined {
  const a = process.env.AUTH_SECRET?.trim();
  if (a) return a;
  const b = process.env.NEXTAUTH_SECRET?.trim();
  if (b) return b;
  return undefined;
}
