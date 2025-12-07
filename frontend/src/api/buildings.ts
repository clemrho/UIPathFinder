const API_BASE = import.meta.env.VITE_API_BASE || "/api";

async function maybeGetToken(getToken: any) {
  if (typeof getToken !== "function") return null;
  try {
    return await getToken({
      audience: import.meta.env.VITE_AUTH0_AUDIENCE || "urn:uipathfinder-api",
    });
  } catch (e) {
    console.warn("token fetch failed, falling back to guest", e);
    return null;
  }
}

export async function listBuildingUsage(getToken: any) {
  const token = await maybeGetToken(getToken);
  const res = await fetch(`${API_BASE}/building-usage`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`Usage fetch failed: ${res.status}`);
  return res.json();
}

export async function incrementBuildingUsageApi(getToken: any, pathOptions: any[]) {
  const token = await maybeGetToken(getToken);
  const res = await fetch(`${API_BASE}/building-usage/increment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ pathOptions }),
  });
  if (!res.ok) throw new Error(`Usage increment failed: ${res.status}`);
  return res.json();
}
