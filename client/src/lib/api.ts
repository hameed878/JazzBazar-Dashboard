export async function apiRequest(url: string, options: RequestInit = {}) {
  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers:
      options.body instanceof FormData
        ? options.headers
        : { "Content-Type": "application/json", ...options.headers },
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    // Broadcast session-expired events for admin-protected routes only (not login endpoints)
    // so that bad-credential 401s don't trigger the "session expired" flow
    if (
      res.status === 401 &&
      url.startsWith("/api/admin/") &&
      !url.endsWith("/login")
    ) {
      window.dispatchEvent(new CustomEvent("api:unauthorized", { detail: { url } }));
    }
    const err: any = new Error(data?.message || "Something went wrong");
    err.status = res.status;
    throw err;
  }

  return data;
}
