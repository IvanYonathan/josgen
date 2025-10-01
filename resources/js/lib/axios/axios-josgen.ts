import { API_BASE_URL, API_TIMEOUT } from "@/configs/network";
import axios, { AxiosInstance, CreateAxiosDefaults } from "axios";
import { applyThrowErrorResponseInterceptors } from "./interceptors/throw-error-response-interceptor";
import { applyAddAuthorizationHeaderInterceptors } from "./interceptors/add-authorization-header-interceptor";
import { applyRefreshTokenInterceptors } from "./interceptors/refresh-token-interceptor";
import { ApiResponse } from "@/types/api/response";

/**
 * Skip Endpoints - Endpoints that do not require an access token
 */
const skippedEndpoints: string[] = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/forgot-password',
  '/auth/reset-password',
];

/**
 * Skip Endpoint Patterns - URL patterns that should skip the auth interceptor
 */
const skippedEndpointPatterns: string[] = [
  // Add patterns here if needed
];

function createAxiosBaseInstance(options?: Partial<CreateAxiosDefaults>, customize?: (instance: AxiosInstance) => void) {
  const newAxios = axios.create({
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUT,
    withCredentials: true, // Keep cookies for web session auth
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options?.headers,
    },
  });

  // Customize the new instance if a function is provided before copying interceptors
  customize?.(newAxios);

  applyAddAuthorizationHeaderInterceptors(newAxios, skippedEndpoints, skippedEndpointPatterns);

  applyThrowErrorResponseInterceptors(newAxios, skippedEndpoints, skippedEndpointPatterns);

  applyRefreshTokenInterceptors(newAxios, skippedEndpoints, skippedEndpointPatterns);

  return newAxios;
}

const AxiosJosgen = createAxiosBaseInstance();

export {
  createAxiosBaseInstance,
  AxiosJosgen
};

export type {
  ApiResponse,
};