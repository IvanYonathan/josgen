import { TokenManager } from "./token-manager";
import { login as apiLogin, logout as apiLogout, register as apiRegister, me as apiMe } from "@/lib/api/auth";
import { User } from "@/types/user/user";
import { LoginRequest } from "../api/auth/login";
import { RegisterRequest } from "@/types/auth/auth";


/**
 * Authentication Service
 * High-level auth operations using the API layer
 */
export class AuthService {
  /**
   * Login user and store tokens
   */
  static async login(credentials: LoginRequest): Promise<User> {
    try {
      const response = await apiLogin(credentials);

      // Store tokens
      TokenManager.setTokens({
        access_token: response.access_token,
        refresh_token: response.refresh_token,
        token_type: response.token_type,
        expires_in: response.expires_in,
      });

      return response.user;
    } catch (error) {
      // Clear any existing tokens on login failure
      TokenManager.clearTokens();
      throw error;
    }
  }

  /**
   * Register user and store tokens
   */
  static async register(userData: RegisterRequest): Promise<User> {
    try {
      const response = await apiRegister(userData);

      // Store tokens
      TokenManager.setTokens({
        access_token: response.access_token,
        refresh_token: response.refresh_token,
        token_type: response.token_type,
        expires_in: response.expires_in,
      });

      return response.user;
    } catch (error) {
      // Clear any existing tokens on register failure
      TokenManager.clearTokens();
      throw error;
    }
  }

  /**
   * Logout user and clear tokens
   */
  static async logout(): Promise<void> {
    try {
      // Try to logout from server
      await apiLogout();
    } catch (error) {
      // Even if server logout fails, clear local tokens
      console.warn('Server logout failed:', error);
    } finally {
      // Always clear local tokens
      TokenManager.clearTokens();
    }
  }

  /**
   * Get current user info
   */
  static async getCurrentUser(): Promise<User> {
    if (!TokenManager.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    const response = await apiMe();
    return response.user;
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return TokenManager.isAuthenticated();
  }

  /**
   * Force logout (clear tokens without server call)
   */
  static forceLogout(): void {
    TokenManager.clearTokens();
  }
}