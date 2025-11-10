import { create } from 'zustand';

/**
 * Feature Flags Store
 *
 * Global store for managing feature flags across the application.
 * Use this to enable/disable features for gradual rollout, A/B testing,
 * or as kill switches for problematic features.
 *
 * @example
 * const { userExportEnabled } = useFeatureFlags();
 * {userExportEnabled && <ExportButton />}
 */

interface FeatureFlagsState {
  // User Management Features
  userExportEnabled: boolean;          // Export users to CSV/Excel
  userBulkActionsEnabled: boolean;     // Bulk delete/edit/assign users
  userAdvancedFiltersEnabled: boolean; // More filter options (date ranges, custom fields)

  // Future Features (examples - add as needed)
  // divisionExportEnabled: boolean;
  // eventBulkActionsEnabled: boolean;
  // advancedReportsEnabled: boolean;
}

interface FeatureFlagsActions {
  /**
   * Enable a specific feature flag
   */
  enableFeature: (feature: keyof FeatureFlagsState) => void;

  /**
   * Disable a specific feature flag
   */
  disableFeature: (feature: keyof FeatureFlagsState) => void;

  /**
   * Toggle a feature flag on/off
   */
  toggleFeature: (feature: keyof FeatureFlagsState) => void;

  /**
   * Load feature flags from API or localStorage
   * Call this on app initialization
   */
  loadFeatureFlags: () => Promise<void>;
}

type FeatureFlagsStore = FeatureFlagsState & FeatureFlagsActions;

/**
 * Feature Flags Store
 *
 * Default: All features disabled for safety
 * Enable features by calling enableFeature() or via loadFeatureFlags()
 */
export const useFeatureFlags = create<FeatureFlagsStore>((set) => ({
  // User Management Features (disabled by default)
  userExportEnabled: false,
  userBulkActionsEnabled: false,
  userAdvancedFiltersEnabled: false,

  // Actions
  enableFeature: (feature) => set({ [feature]: true }),

  disableFeature: (feature) => set({ [feature]: false }),

  toggleFeature: (feature) => set((state) => ({ [feature]: !state[feature] })),

  loadFeatureFlags: async () => {
    try {
      // Option 1: Load from localStorage (for demo/development)
      const storedFlags = localStorage.getItem('josgen_feature_flags');
      if (storedFlags) {
        const flags = JSON.parse(storedFlags);
        set(flags);
        return;
      }

      // Option 2: Load from API (recommended for production)
      // const response = await AxiosJosgen.get('/api/feature-flags');
      // set(response.data.data);

      // For now, enable features manually for testing
      // TODO(IvanYonathan): Remove this and use API in production
      set({
        userExportEnabled: false,          // Enable when export feature is ready
        userBulkActionsEnabled: false,     // Enable when bulk actions are ready
        userAdvancedFiltersEnabled: false, // Enable when advanced filters are ready
      });
    } catch (error) {
      console.error('Failed to load feature flags:', error);
      // Fail safely - keep all features disabled
    }
  },
}));

/**
 * Helper function to save current flags to localStorage
 * Useful for testing/development
 */
export const saveFeatureFlagsToLocalStorage = () => {
  const flags = useFeatureFlags.getState();
  const flagsToSave: Record<string, boolean> = {};

  // Extract only the flag values (not the actions)
  Object.keys(flags).forEach((key) => {
    if (typeof flags[key as keyof typeof flags] === 'boolean') {
      flagsToSave[key] = flags[key as keyof typeof flags] as boolean;
    }
  });

  localStorage.setItem('josgen_feature_flags', JSON.stringify(flagsToSave));
};
