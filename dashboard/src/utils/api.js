/**
 * Centralized API utility for the Bluestock Village Platform.
 * Automatically handles base URLs, auth headers, and common error responses.
 */

const API_BASE = import.meta.env.VITE_API_URL || "";

export async function fetchApi(endpoint, options = {}) {
  const token = localStorage.getItem("token");

  // Ensure endpoint starts with a slash if not provided
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      // Only redirect if we're not already on the login page to avoid loops
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    throw new Error(data.error || `API Error: ${response.status}`);
  }

  return data;
}
