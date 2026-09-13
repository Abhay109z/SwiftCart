/// <reference types="vite/client" />

/**
 * API Configuration for SwiftCart
 * Supports full-stack monolithic deployment, local AI Studio preview,
 * and decoupled Vercel frontend + Render backend architecture.
 */

const RENDER_BACKEND_URL = 'https://swiftcart-wjbj.onrender.com';

export function getBackendBaseUrl(): string {
  // 1. Explicit Vite env variable if provided
  const envBackendUrl = (import.meta as any).env?.VITE_BACKEND_URL;
  if (envBackendUrl) {
    return String(envBackendUrl).replace(/\/+$/, '');
  }

  // 2. If running on Vercel or any remote frontend domain, route directly to Render backend
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('vercel.app') || hostname.includes('swiftcart')) {
      return RENDER_BACKEND_URL;
    }
  }

  // 3. In local dev, AI Studio preview, or same-origin container, use relative paths
  return '';
}

export function getApiUrl(path: string): string {
  const base = getBackendBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

export const BACKEND_URL = getBackendBaseUrl();
