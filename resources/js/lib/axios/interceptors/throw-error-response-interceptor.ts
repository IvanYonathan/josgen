import type { AxiosInstance, AxiosResponse } from 'axios';
import type { ApiResponse } from '@/types/api/response';

/**
 * Applies error response interceptor to axios instance
 * Throws errors for failed API responses
 */
export function applyThrowErrorResponseInterceptors(
  axiosInstance: AxiosInstance,
  skippedEndpoints: string[] = [],
  skippedEndpointPatterns: string[] = []
): void {
  axiosInstance.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
      // Check if response indicates failure
      if (response.data && response.data.success === false) {
        throw new Error(response.data.message || 'API request failed');
      }
      return response;
    },
    (error) => {
      // Handle HTTP errors
      if (error.response) {
        const response = error.response as AxiosResponse<ApiResponse>;

        if (response.data && response.data.message) {
          throw new Error(response.data.message);
        }

        // Handle different HTTP status codes
        switch (response.status) {
          case 401:
            throw new Error('Unauthorized - Please log in again');
          case 403:
            throw new Error('Forbidden - You do not have permission');
          case 404:
            throw new Error('Resource not found');
          case 422:
            // Validation errors
            const validationErrors = response.data?.errors;
            if (validationErrors) {
              const firstError = Object.values(validationErrors)[0];
              throw new Error(Array.isArray(firstError) ? firstError[0] : 'Validation failed');
            }
            throw new Error('Validation failed');
          case 500:
            throw new Error('Internal server error');
          default:
            throw new Error(`Request failed with status ${response.status}`);
        }
      } else if (error.request) {
        // Network error
        throw new Error('Network error - Please check your connection');
      } else {
        // Other error
        throw new Error(error.message || 'An unexpected error occurred');
      }
    }
  );
}