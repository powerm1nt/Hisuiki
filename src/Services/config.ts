export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(
  /\/+$/,
  "",
);

export const ASSET_BASE_URL = (
  import.meta.env.VITE_ASSET_BASE_URL ?? "https://cdn.hisuiki.com/static"
).replace(/\/+$/, "");

export const apiUrl = (path: string): string =>
  `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

export const assetUrl = (path: string): string =>
  `${ASSET_BASE_URL}/${path.replace(/^\/+/, "")}`;
