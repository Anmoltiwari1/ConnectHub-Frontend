/**
 * API Configuration
 * -----------------
 * Central configuration for all microservice URLs.
 * The React frontend talks DIRECTLY to each microservice (no proxy needed).
 */

export const API = {
  AUTH:      'http://localhost:8081/auth',
  ROOMS:     'http://localhost:8082/rooms',
  MESSAGES:  'http://localhost:8083/messages',
  MEDIA:     'http://localhost:8084/media',
  PRESENCE:  'http://localhost:8085/presence',
  WEBSOCKET: 'http://localhost:8087/ws',
};

/**
 * Helper function to make authenticated API calls.
 * Automatically injects the JWT token from localStorage.
 */
export async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    ...(options.headers || {}),
  };

  // Only set Content-Type for non-FormData bodies
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `HTTP ${response.status}`);
  }

  // Handle empty responses (204 No Content, etc.)
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
