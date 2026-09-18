const API_BASE = import.meta.env.VITE_API_BASE_URL;

export function resolveFileUrl(fileUrl) {
  if (!fileUrl) return null;

  try {
    const url = new URL(fileUrl);
    return `${API_BASE}${url.pathname}${url.search}`;
  } catch (e) {
    return `${API_BASE}${fileUrl}`;
  }
}