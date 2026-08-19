import axios from "axios";

function apiBase() {
  const raw = String(import.meta.env.VITE_API_URL || "")
    .trim()
    .replace(/\/$/, "");
  if (!raw) return "/api";
  return raw.endsWith("/api") ? raw : `${raw}/api`;
}

export const api = axios.create({
  baseURL: apiBase(),
  withCredentials: true,
});

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    if (err.response?.status === 401 && !err.config?._retry && !err.config?.url?.includes("/auth/")) {
      err.config._retry = true;
      try {
        await api.post("/auth/refresh");
        return api(err.config);
      } catch {
        /* session expired */
      }
    }
    return Promise.reject(err);
  },
);
