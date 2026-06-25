import axios from "axios";
import { createClient } from "@/lib/supabase/client";

const API_BASE_URL = "/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 120000,
});

// Attach Supabase JWT on every request
apiClient.interceptors.request.use(async (config) => {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Global response error handler
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail || error.message || "An error occurred";

    // Only redirect to login if 401 and NOT already on an auth page
    if (
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith("/auth")
    ) {
      window.location.href = "/auth/login";
    }

    return Promise.reject(new Error(message));
  }
);

// ─── API service functions ────────────────────────────────────────────────────

export const profileAPI = {
  create: (data: object) => apiClient.post("/profile", data),
  get: () => apiClient.get("/profile"),
  update: (data: object) => apiClient.put("/profile", data),
};

export const chatAPI = {
  sendMessage: (message: string) => apiClient.post("/chat", { message }),
  getHistory: () => apiClient.get("/chat/history"),
  clearHistory: () => apiClient.delete("/chat/history"),
};

export const foodAPI = {
  analyzeImage: (formData: FormData) =>
    apiClient.post("/analyze-food", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getHistory: () => apiClient.get("/analyze-food/history"),
};

export const recipeAPI = {
  generate: (formData: FormData) =>
    apiClient.post("/generate-recipe", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getHistory: () => apiClient.get("/generate-recipe/history"),
};

export const dashboardAPI = {
  getStats: () => apiClient.get("/dashboard/stats"),
};
