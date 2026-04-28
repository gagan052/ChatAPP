export const BASE_URL = window.location.hostname === "localhost" 
  ? "http://localhost:3001" 
  : "https://chatapp-1-i5is.onrender.com";

export const api = async (url: string, options?: RequestInit) => {
  const token = localStorage.getItem("token");
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: {
      ...headers,
      ...options?.headers,
    },
  });

  console.log(res);
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "API error");
  }

  return res.json();
};