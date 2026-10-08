export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(new URL(path, window.location.origin), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) throw new Error(`${init?.method ?? 'GET'} ${path} failed with ${res.status}`);
  return res.json() as Promise<T>;
}
