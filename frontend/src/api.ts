// src/api.ts

const API_BASE =
  import.meta.env.VITE_API_BASE ?? "http://localhost:8000"; // fallback

export const SAPIBase = API_BASE;
