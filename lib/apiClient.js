export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

function buildHeaders(token, headers = {}) {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };
}

async function parseJsonResponse(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function apiGet(path, token, init = {}) {
  const res = await fetch(path, {
    method: "GET",
    cache: "no-store",
    ...init,
    headers: buildHeaders(token, init.headers),
  });

  const json = await parseJsonResponse(res);
  if (!res.ok) {
    throw new ApiError(json?.error || json?.message || "Request failed", res.status, json);
  }

  return json;
}

export async function apiMutate(path, token, { method = "POST", body, ...init } = {}) {
  const res = await fetch(path, {
    method,
    cache: "no-store",
    ...init,
    headers: buildHeaders(token, init.headers),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const json = await parseJsonResponse(res);
  if (!res.ok) {
    throw new ApiError(json?.error || json?.message || "Request failed", res.status, json);
  }

  return json;
}
