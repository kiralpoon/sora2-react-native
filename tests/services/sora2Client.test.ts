import test from 'node:test';
import assert from 'node:assert/strict';
import { Sora2Client, Sora2Error } from '../../src/api/sora2/client';
import { GenerationRequest } from '../../src/api/sora2/types';

test('listModels performs authenticated fetch', async () => {
  const calls: string[] = [];
  const client = new Sora2Client('key-123', {
    baseUrl: 'https://example.com',
    fetchImpl: async (url, init) => {
      calls.push(`${url}::${(init?.method as string) ?? 'GET'}`);
      return {
        ok: true,
        status: 200,
        json: async () => [{ id: 'demo-model' }],
      } as any;
    },
  });

  const models = await client.listModels();
  assert.equal(models[0].id, 'demo-model');
  assert.equal(calls[0], 'https://example.com/models::GET');
});

test('submitGeneration posts payload and returns job', async () => {
  let receivedBody: string | undefined;
  const client = new Sora2Client('key-123', {
    baseUrl: 'https://example.com',
    fetchImpl: async (_url, init) => {
      receivedBody = init?.body as string;
      return {
        ok: true,
        status: 200,
        json: async () => ({ id: 'job-1', status: 'queued', modelId: 'demo', createdAt: '2024-01-01', updatedAt: '2024-01-01', progress: 0, request: {} }),
      } as any;
    },
  });

  const request: GenerationRequest = {
    modelId: 'demo',
    prompt: 'Test prompt',
    parameters: {
      durationSeconds: 10,
      aspectRatio: '16:9',
      resolution: '1080p',
      guidanceScale: 7,
      cameraMotion: 'dynamic',
    },
  };

  const job = await client.submitGeneration(request);
  assert.equal(job.id, 'job-1');
  assert.ok(receivedBody);
  assert.ok((receivedBody as string).includes('Test prompt'));
});

test('non-ok responses throw Sora2Error', async () => {
  const client = new Sora2Client('key-123', {
    baseUrl: 'https://example.com',
    fetchImpl: async () => ({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Unauthorized', code: 'unauthorized' }),
    }) as any,
  });

  await assert.rejects(() => client.listModels(), (error: unknown) => {
    assert.ok(error instanceof Sora2Error);
    const soraError = error as Sora2Error;
    assert.equal(soraError.status, 401);
    assert.equal(soraError.code, 'unauthorized');
    return true;
  });
});
