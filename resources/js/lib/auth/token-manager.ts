import { AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY } from "@/configs/network";

export interface TokenData {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

/**
 * Token Manager for handling authentication tokens
 */
export class TokenManager {
  /**
   * Store authentication tokens
   */
  static setTokens(tokenData: TokenData): void {
    localStorage.setItem(AUTH_TOKEN_KEY, tokenData.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokenData.refresh_token);
  }

  /**
   * Get access token
   */
  static getAccessToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }

  /**
   * Get refresh token
   */
  static getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  /**
   * Check if user is authenticated (has valid token)
   */
  static isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * Clear all tokens (logout)
   */
  static clearTokens(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  /**
   * Update access token (used by refresh interceptor)
   */
  static updateAccessToken(token: string): void {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }

  /**
   * Update refresh token
   */
  static updateRefreshToken(token: string): void {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  }
}