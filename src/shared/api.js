let csrfToken = null;
export function setCsrfToken(token) {
  csrfToken = token;
}
export async function api(path, { method = "GET", body } = {}) {
  const isForm = body instanceof FormData;
  let response;
  try {
    response = await fetch("/api" + path, {
      method,
      credentials: "same-origin",
      headers: {
        ...(!isForm && body ? { "Content-Type": "application/json" } : {}),
        ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
      },
      ...(body ? { body: isForm ? body : JSON.stringify(body) } : {}),
    });
  } catch {
    throw new Error(
      "Cannot reach the server. Start the backend with npm run dev:full or npm run demo.",
    );
  }
  const data = await response.json().catch(() => ({
    error: "The API is unavailable. Check that the backend is running.",
  }));
  if (!response.ok) {
    const error = new Error(
      data.error ||
        Object.values(data.errors || {}).join("; ") ||
        "Request failed",
    );
    error.status = response.status;
    throw error;
  }
  return data;
}
export const post = (path, body = {}) => api(path, { method: "POST", body });
export const put = (path, body) => api(path, { method: "PUT", body });
