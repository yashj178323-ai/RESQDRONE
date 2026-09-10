import axios from 'axios';
import type { AxiosInstance } from 'axios';

const baseURL = import.meta.env.VITE_API_URL as string | undefined;

/** True only when an API base URL was configured at build time. */
export const hasBackend = Boolean(baseURL && baseURL.trim().length > 0);

/**
 * A single Axios instance for the whole app. When no backend is configured the
 * client still exists, but callers check `hasBackend` first and fall back to the
 * local simulator instead of firing requests that are certain to fail.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: baseURL ?? '/api',
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    // Never let a transport failure take the command centre down.
    console.warn('[api] request failed, continuing on local data:', error?.message);
    return Promise.reject(error);
  },
);

/** Fetch with a guaranteed local fallback, so the UI never depends on a server. */
export async function getOrFallback<T>(path: string, fallback: T): Promise<T> {
  if (!hasBackend) return fallback;
  try {
    const res = await apiClient.get<T>(path);
    return res.data;
  } catch {
    return fallback;
  }
}
