import { createCatalogState, selectVisibleModels, summarizeCatalog, toggleFavorite, updateFilter } from '../domain/models';
import { createPromptLibrary, PromptDraft, PromptLibraryState, PromptTemplate, validatePrompt } from '../domain/prompts';
import { createJobTracker, JobTrackerState, selectActiveJobs, selectCompletedJobs, selectFailedJobs, upsertJobFromApi } from '../domain/jobs';
import { createNotificationCenter, NotificationCenterState, NotificationItem, pushNotification } from '../domain/notifications';
import { createSettingsState, SettingsState, updateSettings } from '../domain/settings';
import { GenerationJob, SoraModel } from '../api/sora2/types';

export interface AppState {
  catalog: ReturnType<typeof createCatalogState>;
  prompts: PromptLibraryState;
  jobs: JobTrackerState;
  notifications: NotificationCenterState;
  settings: SettingsState;
}

export interface AppStateOverview {
  models: ReturnType<typeof summarizeCatalog>;
  activeJobs: number;
  completedJobs: number;
  failedJobs: number;
}

export function createAppState(models: SoraModel[], templates: PromptTemplate[] = []): AppState {
  return {
    catalog: createCatalogState(models),
    prompts: createPromptLibrary(templates),
    jobs: createJobTracker(),
    notifications: createNotificationCenter(),
    settings: createSettingsState(),
  };
}

export function toggleModelFavorite(state: AppState, modelId: string): AppState {
  return { ...state, catalog: toggleFavorite(state.catalog, modelId) };
}

export function applyModelFilter(state: AppState, patch: Partial<AppState['catalog']['filter']>): AppState {
  return { ...state, catalog: updateFilter(state.catalog, patch) };
}

export function recordApiJob(state: AppState, job: GenerationJob): AppState {
  return { ...state, jobs: upsertJobFromApi(state.jobs, job) };
}

export function addNotification(state: AppState, notification: NotificationItem): AppState {
  return { ...state, notifications: pushNotification(state.notifications, notification) };
}

export function changeSettings(state: AppState, patch: Partial<SettingsState>): AppState {
  return { ...state, settings: updateSettings(state.settings, patch) };
}

export function getOverview(state: AppState): AppStateOverview {
  return {
    models: summarizeCatalog(state.catalog),
    activeJobs: selectActiveJobs(state.jobs).length,
    completedJobs: selectCompletedJobs(state.jobs).length,
    failedJobs: selectFailedJobs(state.jobs).length,
  };
}

export function validateDraft(state: AppState, draft: PromptDraft): ReturnType<typeof validatePrompt> {
  const DEFAULT_RULES = {
    maxPromptLength: 1_000,
    maxStoryboardSteps: 10,
    guidanceScaleRange: [0.5, 15] as [number, number],
  };
  return validatePrompt(draft, DEFAULT_RULES);
}

export function selectVisibleModelView(state: AppState) {
  return selectVisibleModels(state.catalog);
}
