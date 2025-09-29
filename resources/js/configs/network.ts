/**
 * API Base URL for the Laravel backend
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * API request timeout in milliseconds
 */
export const API_TIMEOUT = import.meta.env.VITE_API_TIMEOUT ? parseInt(import.meta.env.VITE_API_TIMEOUT) : 30000;

/**
 * Auth token storage key
 */
export const AUTH_TOKEN_KEY = 'josgen_auth_token';

/**
 * Refresh token storage key
 */
export const REFRESH_TOKEN_KEY = 'josgen_refresh_token';