export const APP_BASENAME = "/blueprints-app";

export function normalizeRedirectPath(path: string): string | null {
  if (!path.startsWith("/") || path.startsWith("//")) return null;

  if (path === APP_BASENAME || path.startsWith(`${APP_BASENAME}/`)) {
    return path;
  }

  return `${APP_BASENAME}${path}`;
}

export function restoreGitHubPagesPath(): void {
  const redirectPath = redirectPathFromSearch(window.location.search);
  if (!redirectPath) return;

  const normalized = normalizeRedirectPath(redirectPath);
  if (normalized) {
    history.replaceState(null, "", normalized);
  }
}

export function redirectPathFromSearch(search: string): string | null {
  return new URLSearchParams(search).get("redirect");
}

export function appUrl(path: string): string {
  const base = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  return new URL(path.replace(/^\//, ""), `${window.location.origin}${base}`).toString();
}
