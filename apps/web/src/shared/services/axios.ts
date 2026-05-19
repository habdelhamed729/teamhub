import axios from "axios";
import { useAuthStore } from "@/app/store/useAuthStore";
import { refresh } from "@/features/auth/api/auth.api";

export const api = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true, //hena bn3ml send ll cookies m3a kol request
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== "/auth/refresh" &&
      originalRequest.url !== "/auth/login" &&
      originalRequest.url !== "/auth/register"
    ) {
      originalRequest._retry = true;
      try {
        const { user } = await refresh(); //bn3ml refresh lma el token texpire
        useAuthStore.getState().setAuth(user);
        return api(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);