import { SoraModel } from '../api/sora2/types';

export interface ModelFilter {
  searchTerm: string;
  tags: string[];
  aspectRatios: string[];
  capabilityIds: string[];
  maxDurationSeconds?: number;
}

export interface ModelCatalogState {
  models: SoraModel[];
  favoriteIds: string[];
  filter: ModelFilter;
}

export function createCatalogState(models: SoraModel[], favoriteIds: string[] = []): ModelCatalogState {
  return {
    models: [...models],
    favoriteIds: Array.from(new Set(favoriteIds)),
    filter: {
      searchTerm: '',
      tags: [],
      aspectRatios: [],
      capabilityIds: [],
      maxDurationSeconds: undefined,
    },
  };
}

export function toggleFavorite(state: ModelCatalogState, modelId: string): ModelCatalogState {
  const exists = state.favoriteIds.includes(modelId);
  const favoriteIds = exists
    ? state.favoriteIds.filter((id) => id !== modelId)
    : [...state.favoriteIds, modelId];
  return { ...state, favoriteIds };
}

export function updateFilter(state: ModelCatalogState, patch: Partial<ModelFilter>): ModelCatalogState {
  return { ...state, filter: { ...state.filter, ...patch } };
}

export interface ModelView extends SoraModel {
  favorite: boolean;
}

export function selectVisibleModels(state: ModelCatalogState): ModelView[] {
  const { models, favoriteIds, filter } = state;
  const filtered = models.filter((model) => matchesFilter(model, filter));
  const views: ModelView[] = filtered.map((model) => ({ ...model, favorite: favoriteIds.includes(model.id) }));
  return views.sort((a, b) => sortByFavorite(a, b, favoriteIds) || a.name.localeCompare(b.name));
}

function matchesFilter(model: SoraModel, filter: ModelFilter): boolean {
  if (filter.searchTerm) {
    const haystack = `${model.name} ${model.description}`.toLowerCase();
    if (!haystack.includes(filter.searchTerm.toLowerCase())) {
      return false;
    }
  }

  if (filter.tags.length > 0 && !filter.tags.every((tag) => model.tags.includes(tag))) {
    return false;
  }

  if (filter.aspectRatios.length > 0 && !filter.aspectRatios.some((ratio) => model.aspectRatios.includes(ratio))) {
    return false;
  }

  if (filter.capabilityIds.length > 0) {
    const capabilitySet = new Set(model.capabilities.map((capability) => capability.id));
    const hasAll = filter.capabilityIds.every((id) => capabilitySet.has(id));
    if (!hasAll) {
      return false;
    }
  }

  if (filter.maxDurationSeconds !== undefined && model.maxDurationSeconds > filter.maxDurationSeconds) {
    return false;
  }

  return true;
}

function sortByFavorite(a: ModelView, b: ModelView, favoriteIds: string[]): number {
  const aFavorite = favoriteIds.includes(a.id);
  const bFavorite = favoriteIds.includes(b.id);
  if (aFavorite && !bFavorite) {
    return -1;
  }
  if (!aFavorite && bFavorite) {
    return 1;
  }
  return 0;
}

export function summarizeCatalog(state: ModelCatalogState): {
  total: number;
  favorites: number;
  filtered: number;
} {
  const visible = selectVisibleModels(state);
  return {
    total: state.models.length,
    favorites: state.favoriteIds.length,
    filtered: visible.length,
  };
}
