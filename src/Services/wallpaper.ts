import { apiUrl } from "./config";
import type { BingWallpaper } from "./types";

export const FALLBACK_WALLPAPER_URL = "/assets/default2.png";

export async function resolveWallpaperUrl(): Promise<string> {
  try {
    const response = await fetch(apiUrl("/api/wallpaper/bing"));
    if (response.ok) {
      const dto = (await response.json()) as BingWallpaper;
      if (dto?.imageUrl?.trim()) return dto.imageUrl;
    }
  } catch (e) {
    console.error(e);
  }
  return FALLBACK_WALLPAPER_URL;
}

