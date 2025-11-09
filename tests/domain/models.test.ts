import test from 'node:test';
import assert from 'node:assert/strict';
import { createCatalogState, selectVisibleModels, summarizeCatalog, toggleFavorite, updateFilter } from '../../src/domain/models';
import { SoraModel } from '../../src/api/sora2/types';

const baseModels: SoraModel[] = [
  {
    id: 'model-a',
    name: 'Action Studio',
    description: 'Fast paced cinematic sequences',
    capabilities: [
      { id: 'motion', label: 'Motion' },
      { id: 'sound', label: 'Audio' },
    ],
    maxDurationSeconds: 60,
    aspectRatios: ['16:9', '9:16'],
    defaultParameters: {
      durationSeconds: 30,
      aspectRatio: '16:9',
      resolution: '1080p',
      guidanceScale: 7,
      cameraMotion: 'dynamic',
    },
    tags: ['cinematic', 'action'],
  },
  {
    id: 'model-b',
    name: 'Travel Vista',
    description: 'Sweeping aerial landscapes',
    capabilities: [{ id: 'motion', label: 'Motion' }],
    maxDurationSeconds: 90,
    aspectRatios: ['16:9'],
    defaultParameters: {
      durationSeconds: 45,
      aspectRatio: '16:9',
      resolution: '4k',
      guidanceScale: 6,
      cameraMotion: 'dynamic',
    },
    tags: ['landscape'],
  },
  {
    id: 'model-c',
    name: 'Storyboard Sketch',
    description: 'Hand-drawn storyboards for animation planning',
    capabilities: [{ id: 'stylization', label: 'Stylization' }],
    maxDurationSeconds: 30,
    aspectRatios: ['1:1', '4:5'],
    defaultParameters: {
      durationSeconds: 20,
      aspectRatio: '1:1',
      resolution: '720p',
      guidanceScale: 9,
      cameraMotion: 'static',
    },
    tags: ['animation', 'previs'],
  },
];

test('favorites float to the top of the catalog', () => {
  let state = createCatalogState(baseModels);
  state = toggleFavorite(state, 'model-b');
  const visible = selectVisibleModels(state);
  assert.equal(visible[0].id, 'model-b');
  assert.ok(visible[0].favorite);
});

test('search term filters by name and description', () => {
  let state = createCatalogState(baseModels);
  state = updateFilter(state, { searchTerm: 'landscape' });
  const visible = selectVisibleModels(state);
  assert.equal(visible.length, 1);
  assert.equal(visible[0].id, 'model-b');
});

test('capability and aspect ratio filters apply simultaneously', () => {
  let state = createCatalogState(baseModels);
  state = updateFilter(state, { capabilityIds: ['stylization'], aspectRatios: ['4:5'] });
  const visible = selectVisibleModels(state);
  assert.equal(visible.length, 1);
  assert.equal(visible[0].id, 'model-c');
});

test('summaries include total, favorite, and filtered counts', () => {
  let state = createCatalogState(baseModels);
  state = toggleFavorite(state, 'model-a');
  state = updateFilter(state, { tags: ['landscape'] });
  const summary = summarizeCatalog(state);
  assert.deepEqual(summary, { total: 3, favorites: 1, filtered: 1 });
});
