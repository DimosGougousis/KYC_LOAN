// Absolute URL on the current origin: identical in the browser, and works under Node/jsdom in tests.
export function apiUrl(path: string): string {
  return new URL(path, window.location.origin).toString();
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(path), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) throw new Error(`${init?.method ?? 'GET'} ${path} failed with ${res.status}`);
  return res.json() as Promise<T>;
}
