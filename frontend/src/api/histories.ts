// Note: These functions are helpers to be used inside React components that have access to the Auth0 hook.
// Example usage inside a component:
// const { getAccessTokenSilently } = useAuth0();
// await saveHistory(getAccessTokenSilently, payload);

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

export async function saveHistory(getToken: any, payload: any) {
  const token = await getToken({ audience: (import.meta.env.VITE_AUTH0_AUDIENCE || 'urn:uipathfinder-api') });
  const res = await fetch(`${API_BASE}/histories`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Save failed: ${res.status}`);
  return res.json();
}

export async function listHistories(
  getToken: any,
  opts: { limit?: number; offset?: number } = {},
) {
  const token = await getToken({
    audience: import.meta.env.VITE_AUTH0_AUDIENCE || "urn:uipathfinder-api",
  });
  const params = new URLSearchParams();
  if (opts.limit) params.set("limit", String(opts.limit));
  if (opts.offset) params.set("offset", String(opts.offset));
  const res = await fetch(`${API_BASE}/histories?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`List failed: ${res.status}`);
  return res.json();
}

export async function getHistory(getToken: any, id: string) {
  const token = await getToken({
    audience: import.meta.env.VITE_AUTH0_AUDIENCE || "urn:uipathfinder-api",
  });
  const res = await fetch(`${API_BASE}/histories/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Get failed: ${res.status}`);
  return res.json();
}
