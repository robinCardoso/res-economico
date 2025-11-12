import type { AxiosError, AxiosResponse } from "axios";
import axios from "axios";

const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
const baseURL = rawBaseUrl ? rawBaseUrl : undefined;

export const api = axios.create({
  baseURL,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response) {
      console.error("API error:", {
        status: error.response.status,
        url: error.config?.url,
        data: error.response.data,
      });
    } else {
      console.error("Network/Client error calling API:", error.message);
    }
    return Promise.reject(error);
  },
);

export default api;

