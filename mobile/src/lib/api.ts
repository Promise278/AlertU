import { Platform } from 'react-native';

import { firebaseAuth } from './firebase';

const DEV_AUTH_TOKEN = process.env.EXPO_PUBLIC_DEV_AUTH_TOKEN;
const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

const localUrl = Platform.select({
  android: 'http://10.0.2.2:5000',
  default: 'http://localhost:5000',
});

// Development still uses the local backend. Release builds use the hosted API
// unless EXPO_PUBLIC_API_URL explicitly overrides it.
const defaultUrl = __DEV__ ? localUrl : 'https://alertu.onrender.com';

export const API_URL = (configuredUrl || defaultUrl || 'http://localhost:5000').replace(
  /\/+$/,
  ''
);

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, message: string, code = 'API_ERROR', details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type ApiOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, headers = {}, signal } = options;
  const url = `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...headers,
  };

  let requestBody: string | undefined;
  if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json';
    requestBody = JSON.stringify(body);
  }

  if (auth) {
    try {
      const token = await firebaseAuth.currentUser?.getIdToken();
      if (token) {
        requestHeaders.Authorization = `Bearer ${token}`;
      } else if (__DEV__ && DEV_AUTH_TOKEN) {
        // Local-only fallback used before Firebase Auth is configured.
        requestHeaders.Authorization = `Bearer ${DEV_AUTH_TOKEN}`;
      }
    } catch {
      if (__DEV__ && DEV_AUTH_TOKEN) {
        requestHeaders.Authorization = `Bearer ${DEV_AUTH_TOKEN}`;
      }
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: requestBody,
      signal,
    });
  } catch {
    throw new ApiError(
      0,
      `Could not reach the AlertU API at ${url}. Check that the backend is running and that EXPO_PUBLIC_API_URL points to the right host.`,
      'NETWORK_ERROR'
    );
  }

  const text = await response.text();
  let payload: unknown = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const envelope = payload as
      | { error?: { message?: string; code?: string; details?: unknown } }
      | null;
    throw new ApiError(
      response.status,
      envelope?.error?.message || `API request failed with HTTP ${response.status}`,
      envelope?.error?.code || 'API_ERROR',
      envelope?.error?.details
    );
  }

  return payload as T;
}
