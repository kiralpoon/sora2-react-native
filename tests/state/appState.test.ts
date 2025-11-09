import test from 'node:test';
import assert from 'node:assert/strict';
import { GenerationJob, SoraModel } from '@/api/sora2/types';
import {
  addNotification,
  applyModelFilter,
  changeSettings,
  createAppState,
  getOverview,
  recordApiJob,
  selectVisibleModelView,
  toggleModelFavorite,
} from '../../src/state/appState';
import { PromptTemplate } from '../../src/domain/prompts';

const models: SoraModel[] = [
  {
    id: 'demo-model',
    name: 'Demo',
    description: 'Demo model',
    capabilities: [],
    maxDurationSeconds: 30,
    aspectRatios: ['16:9'],
    defaultParameters: {
      durationSeconds: 10,
      aspectRatio: '16:9',
      resolution: '1080p',
      guidanceScale: 5,
      cameraMotion: 'static',
    },
    tags: [],
  },
];

const templates: PromptTemplate[] = [
  {
    id: 'template',
    name: 'Template',
    updatedAt: new Date().toISOString(),
    prompt: 'Prompt',
    parameters: {
      durationSeconds: 10,
      aspectRatio: '16:9',
      resolution: '1080p',
      guidanceScale: 5,
      cameraMotion: 'static',
    },
  },
];

test('toggleModelFavorite updates overview counts', () => {
  let state = createAppState(models, templates);
  state = toggleModelFavorite(state, 'demo-model');
  const overview = getOverview(state);
  assert.equal(overview.models.favorites, 1);
});

test('applyModelFilter narrows visible models', () => {
  let state = createAppState(models, templates);
  state = applyModelFilter(state, { searchTerm: 'missing' });
  const visible = selectVisibleModelView(state);
  assert.equal(visible.length, 0);
});

test('recordApiJob updates job counts in overview', () => {
  let state = createAppState(models, templates);
  const job: GenerationJob = {
    id: 'job-1',
    status: 'completed',
    modelId: 'demo-model',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    progress: 100,
    request: {
      modelId: 'demo-model',
      prompt: 'Prompt',
      parameters: templates[0].parameters,
    },
    resultUrl: 'https://example.com',
  };
  state = recordApiJob(state, job);
  const overview = getOverview(state);
  assert.equal(overview.completedJobs, 1);
});

test('addNotification and changeSettings mutate respective slices', () => {
  let state = createAppState(models, templates);
  state = addNotification(state, {
    id: 'notif-1',
    type: 'info',
    title: 'Hello',
    message: 'World',
    createdAt: new Date().toISOString(),
  });
  state = changeSettings(state, { theme: 'dark' });
  assert.equal(state.notifications.items.length, 1);
  assert.equal(state.settings.theme, 'dark');
});
