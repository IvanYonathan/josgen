import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { AUTH_TOKEN_KEY } from '@/configs/network';

/**
 * Applies authorization header interceptor to axios instance
 * Adds Bearer token to requests that require authentication
 */
export function applyAddAuthorizationHeaderInterceptors(
  axiosInstance: AxiosInstance,
  skippedEndpoints: string[] = [],
  skippedEndpointPatterns: string[] = []
): void {
  axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const url = config.url || '';

      // Check if this endpoint should skip auth
      const shouldSkip = skippedEndpoints.includes(url) ||
                        skippedEndpointPatterns.some(pattern => url.startsWith(pattern));

      if (!shouldSkip) {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
}