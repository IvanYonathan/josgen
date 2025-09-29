import type { AxiosInstance, AxiosResponse } from 'axios';
import { AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/configs/network';

/**
 * Applies refresh token interceptor to axios instance
 * Automatically refreshes tokens when they expire
 */
export function applyRefreshTokenInterceptors(
  axiosInstance: AxiosInstance,
  skippedEndpoints: string[] = [],
  skippedEndpointPatterns: string[] = []
): void {
  let isRefreshing = false;
  let failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
  }> = [];

  const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });

    failedQueue = [];
  };

  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          }).catch((err) => {
            return Promise.reject(err);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

        if (!refreshToken) {
          processQueue(error, null);
          isRefreshing = false;
          // Redirect to login or emit logout event
          localStorage.removeItem(AUTH_TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          window.location.href = '/login';
          return Promise.reject(error);
        }

        try {
          const response = await axiosInstance.post('/auth/refresh', {
            refresh_token: refreshToken,
          });

          const { data } = response.data;
          const newToken = data.access_token;
          const newRefreshToken = data.refresh_token;

          localStorage.setItem(AUTH_TOKEN_KEY, newToken);
          localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);

          processQueue(null, newToken);
          isRefreshing = false;

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          isRefreshing = false;

          // Refresh failed, redirect to login
          localStorage.removeItem(AUTH_TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );
}