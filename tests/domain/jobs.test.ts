import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createJobTracker,
  markJobEvent,
  selectActiveJobs,
  selectCompletedJobs,
  selectFailedJobs,
  upsertJobFromApi,
} from '../../src/domain/jobs';
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

test('markJobEvent updates job progress when provided', () => {
  const createdAt = new Date(2024, 0, 1, 12, 0, 0).toISOString();
  let state = createJobTracker();
  state = upsertJobFromApi(
    state,
    baseJob({
      id: 'job-progress',
      status: 'running',
      progress: 20,
      createdAt,
      updatedAt: createdAt,
    })
  );

  state = markJobEvent(state, 'job-progress', {
    status: 'running',
    timestamp: new Date(2024, 0, 1, 12, 5, 0).toISOString(),
    progress: 80,
  });

  const job = state.jobs.find((item) => item.id === 'job-progress');
  if (!job) {
    throw new Error('Job should exist in state');
  }
  assert.equal(job.progress, 80);
  assert.equal(job.events[job.events.length - 1]?.progress, 80);
  assert.equal(job.status, 'running');
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
