import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
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
