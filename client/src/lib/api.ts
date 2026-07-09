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
    // Broadcast session-expired events so any UI layer can react
    if (res.status === 401) {
      window.dispatchEvent(new CustomEvent("api:unauthorized", { detail: { url } }));
    }
    const err: any = new Error(data?.message || "Something went wrong");
    err.status = res.status;
    throw err;
  }

  return data;
}
