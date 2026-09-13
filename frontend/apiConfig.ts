/// <reference types="vite/client" />

/**
 * API Configuration for SwiftCart
 * Connected directly to Render backend: https://swiftcart-wjbj.onrender.com
 */

export const RENDER_BACKEND_URL = 'https://swiftcart-wjbj.onrender.com';

export function getBackendBaseUrl(): string {
  // 1. Explicit Vite env variable if provided
  const envBackendUrl = (import.meta as any).env?.VITE_BACKEND_URL;
  if (envBackendUrl) {
    return String(envBackendUrl).replace(/\/+$/, '');
  }

  // 2. Direct connection to live Render backend
  return RENDER_BACKEND_URL;
}

export function getApiUrl(path: string): string {
  const base = getBackendBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

export const BACKEND_URL = getBackendBaseUrl();

