import test from 'node:test';
import assert from 'node:assert/strict';
import { createJobTracker, selectActiveJobs, selectCompletedJobs, selectFailedJobs, upsertJobFromApi } from '../../src/domain/jobs';
import { GenerationJob } from '@/api/sora2/types';

const baseJob = (overrides: Partial<GenerationJob>): GenerationJob => ({
  id: 'job-1',
  status: 'queued',
  modelId: 'model-a',
  createdAt: new Date(2024, 0, 1, 12, 0, 0).toISOString(),
  updatedAt: new Date(2024, 0, 1, 12, 0, 0).toISOString(),
  progress: 0,
  request: {
    modelId: 'model-a',
    prompt: 'An astronaut exploring a neon forest',
    parameters: {
      durationSeconds: 20,
      aspectRatio: '16:9',
      resolution: '1080p',
      guidanceScale: 7,
      cameraMotion: 'dynamic',
    },
  },
  ...overrides,
});

test('upsertJobFromApi inserts and updates jobs with events', () => {
  let state = createJobTracker();
  state = upsertJobFromApi(state, baseJob({ id: 'job-1' }));
  assert.equal(state.jobs.length, 1);
  assert.equal(state.jobs[0].events.length, 1);

  state = upsertJobFromApi(
    state,
    baseJob({
      id: 'job-1',
      status: 'running',
      progress: 50,
      updatedAt: new Date(2024, 0, 1, 12, 5, 0).toISOString(),
    })
  );
  assert.equal(state.jobs[0].status, 'running');
  assert.equal(state.jobs[0].events.length, 2);
});

test('completed jobs are separated from active and failed lists', () => {
  let state = createJobTracker();
  state = upsertJobFromApi(state, baseJob({ id: 'job-a', status: 'running' }));
  state = upsertJobFromApi(state, baseJob({
    id: 'job-b',
    status: 'completed',
    progress: 100,
    updatedAt: new Date(2024, 0, 1, 12, 10, 0).toISOString(),
  }));
  state = upsertJobFromApi(state, baseJob({
    id: 'job-c',
    status: 'failed',
    progress: 0,
    updatedAt: new Date(2024, 0, 1, 12, 15, 0).toISOString(),
  }));

  assert.equal(selectActiveJobs(state).length, 1);
  assert.equal(selectCompletedJobs(state).length, 1);
  assert.equal(selectFailedJobs(state).length, 1);
});

test('jobs remain sorted by creation time desc', () => {
  let state = createJobTracker();
  state = upsertJobFromApi(state, baseJob({ id: 'job-old', createdAt: new Date(2024, 0, 1).toISOString() }));
  state = upsertJobFromApi(state, baseJob({ id: 'job-new', createdAt: new Date(2024, 0, 2).toISOString() }));
  assert.equal(state.jobs[0].id, 'job-new');
});
