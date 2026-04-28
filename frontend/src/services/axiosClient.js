// services/axiosClient.js
import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  timeout: 60000, // 60s for model inference
});

// Request interceptor
axiosClient.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Response interceptor
axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.detail || error.message || "Unknown error";
    return Promise.reject(new Error(message));
  }
);

export default axiosClient;
