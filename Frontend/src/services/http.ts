export const BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:3001"
    : "https://chatapp-1-i5is.onrender.com";

export const api = async (url: string, options?: RequestInit) => {
  const headers: Record<string, string> = {};

  // Don't set Content-Type for FormData
  const isFormData = options?.body instanceof FormData;

  if (!isFormData && options?.method !== "GET") {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(
    `${BASE_URL}${url}`,

    {
      ...options,

      credentials: "include",

      headers: {
        ...headers,
        ...options?.headers,
      },
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));

    throw new Error(errorData.message || "API error");
  }

  return res.json();
};
