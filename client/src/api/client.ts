// Thin typed wrapper around fetch for the PhotoApp API.
import type {
  AlbumDetail,
  AlbumListItem,
  PhotoDetail,
  PhotoListItem,
  ShareResponse,
  User
} from "./types";

// Defaults to same-origin proxy in dev, overrideable for deployed setups.
const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";

const apiFetch = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const headers = new Headers(options.headers || {});
  // Let the browser set multipart boundaries automatically for FormData uploads.
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...options,
    headers
  });

  if (!response.ok) {
    const text = await response.text();
    try {
      // Prefer backend-provided error text when available.
      const data = JSON.parse(text) as { error?: string };
      throw new Error(data.error || "Request failed");
    } catch {
      // Fallback handles non-JSON error bodies.
      throw new Error(text || "Request failed");
    }
  }

  if (response.status === 204) {
    // Keep helper generic even for endpoints that return no payload.
    return null as T;
  }

  return (await response.json()) as T;
};

export const getMe = () => apiFetch<User>("/me");

export const login = (email: string, password: string) =>
  apiFetch<User>("/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });

export const logout = () => apiFetch<void>("/logout", { method: "POST" });

export const fetchPhotos = async (params: {
  page?: number;
  limit?: number;
  tag?: string;
  q?: string;
  albumId?: string;
}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  });
  return apiFetch<{ items: PhotoListItem[]; page: number; total: number }>(
    `/photos?${search.toString()}`
  );
};

export const fetchPhoto = (id: string) => apiFetch<PhotoDetail>(`/photos/${id}`);

export const fetchAlbums = () => apiFetch<{ items: AlbumListItem[] }>("/albums");

export const fetchAlbum = (id: string) => apiFetch<AlbumDetail>(`/albums/${id}`);

export const fetchTags = () => apiFetch<{ items: string[] }>("/tags");

export const createShareLink = (payload: {
  resourceType: "photo" | "album";
  resourceId: string;
  expiresAt?: string | null;
}) =>
  apiFetch<{ token: string; expiresAt: string }>("/share-links", {
    method: "POST",
    body: JSON.stringify(payload)
  });

export const fetchShare = (token: string) => apiFetch<ShareResponse>(`/share/${token}`);

export const acceptInvite = (token: string, password: string) =>
  apiFetch<{ id: string; email: string }>("/invites/accept", {
    method: "POST",
    body: JSON.stringify({ token, password })
  });

export const createInvite = (email: string, expiresAt?: string | null) =>
  apiFetch<{ id: string; email: string; token: string; expiresAt: string }>("/invites", {
    method: "POST",
    body: JSON.stringify({ email, expiresAt: expiresAt ?? null })
  });

export const uploadPhoto = (formData: FormData) =>
  apiFetch<{ id: string; title: string; createdAt: string }>("/photos", {
    method: "POST",
    body: formData
  });
