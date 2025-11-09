export type ThemePreference = 'system' | 'light' | 'dark';

export interface SettingsState {
  theme: ThemePreference;
  locale: string;
  analyticsEnabled: boolean;
  pushNotificationsEnabled: boolean;
}

export function createSettingsState(initial: Partial<SettingsState> = {}): SettingsState {
  return {
    theme: initial.theme ?? 'system',
    locale: initial.locale ?? 'en',
    analyticsEnabled: initial.analyticsEnabled ?? false,
    pushNotificationsEnabled: initial.pushNotificationsEnabled ?? false,
  };
}

export function updateSettings(state: SettingsState, patch: Partial<SettingsState>): SettingsState {
  return { ...state, ...patch };
}
