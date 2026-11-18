export async function adminFetch(input: string, init: RequestInit = {}) {
  return fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
}
