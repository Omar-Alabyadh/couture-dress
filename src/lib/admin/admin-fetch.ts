/**
 * Admin API fetch with cookies + one retry on 5xx (transient pooler cold starts).
 */
export async function adminFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const opts: RequestInit = {
    ...init,
    credentials: "include",
    cache: init?.cache ?? "no-store",
  };

  let res = await fetch(input, opts);
  if (res.status < 500) return res;

  await new Promise((r) => setTimeout(r, 400));
  res = await fetch(input, opts);
  return res;
}
