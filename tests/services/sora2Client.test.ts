import test from 'node:test';
import assert from 'node:assert/strict';
import { Sora2Client, Sora2Error } from '../../src/api/sora2/client';
import { GenerationRequest } from '../../src/api/sora2/types';

test('listModels performs authenticated fetch using the video beta header', async () => {
  const calls: { url: string; method?: string; headers?: Record<string, string> }[] = [];
  const client = new Sora2Client('key-123', {
    baseUrl: 'https://example.com',
    fetchImpl: async (url, init) => {
      calls.push({
        url,
        method: init?.method as string,
        headers: init?.headers as Record<string, string>,
      });
      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: [
            {
              id: 'sora-1.1',
              display_name: 'Sora 1.1',
              description: 'Flagship cinematic video model',
              metadata: {
                tags: ['cinematic'],
                capabilities: [{ id: 'motion', label: 'Dynamic Motion' }],
                video: {
                  max_duration_seconds: 60,
                  supported_aspect_ratios: ['16:9', '1:1'],
                  default_parameters: {
                    duration_seconds: 30,
                    aspect_ratio: '16:9',
                    resolution: '1080p',
                    guidance_scale: 7,
                    camera_motion: 'dynamic',
                  },
                },
              },
            },
          ],
        }),
      } as any;
    },
  });

  const models = await client.listModels();

  assert.equal(models[0].id, 'sora-1.1');
  assert.equal(models[0].name, 'Sora 1.1');
  assert.equal(models[0].maxDurationSeconds, 60);
  assert.equal(calls[0].url, 'https://example.com/models?type=video');
  assert.equal(calls[0].method, 'GET');
  assert.equal(calls[0].headers?.Authorization, 'Bearer key-123');
  assert.equal(calls[0].headers?.['OpenAI-Beta'], 'video-generation=2024-12-17');
});

test('submitGeneration posts payload in the Sora format and normalizes the response', async () => {
  let receivedBody: Record<string, unknown> | undefined;
  let receivedUrl = '';
  const client = new Sora2Client('key-123', {
    baseUrl: 'https://example.com',
    fetchImpl: async (_url, init) => {
      receivedUrl = _url;
      receivedBody = JSON.parse(init?.body as string);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          id: 'job-1',
          status: 'in_progress',
          model: 'demo',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          output: {
            video: { url: 'https://example.com/video.mp4' },
            thumbnails: [{ url: 'https://example.com/thumb.jpg' }],
          },
          metadata: {
            prompt: 'Test prompt',
            negative_prompt: 'No text',
            duration: 10,
            aspect_ratio: '16:9',
            guidance_scale: 7,
            camera_motion: 'dynamic',
            seed: 42,
            resolution: '1080p',
          },
        }),
      } as any;
    },
  });

  const request: GenerationRequest = {
    modelId: 'demo',
    prompt: 'Test prompt',
    negativePrompt: 'No text',
    parameters: {
      durationSeconds: 10,
      aspectRatio: '16:9',
      resolution: '1080p',
      guidanceScale: 7,
      cameraMotion: 'dynamic',
      seed: 42,
    },
    watermark: false,
  };

  const job = await client.submitGeneration(request);

  assert.equal(receivedUrl, 'https://example.com/videos');
  assert.equal(receivedBody?.model, 'demo');
  assert.equal(receivedBody?.prompt, 'Test prompt');
  assert.equal(receivedBody?.negative_prompt, 'No text');
  assert.equal(receivedBody?.aspect_ratio, '16:9');
  assert.equal(receivedBody?.duration, 10);
  assert.equal(receivedBody?.watermark, false);
  assert.equal(job.id, 'job-1');
  assert.equal(job.status, 'running');
  assert.equal(job.resultUrl, 'https://example.com/video.mp4');
  assert.equal(job.thumbnailUrl, 'https://example.com/thumb.jpg');
});

test('listJobs maps Sora API payloads into domain records', async () => {
  const client = new Sora2Client('key-123', {
    baseUrl: 'https://example.com',
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        data: [
          {
            id: 'job-42',
            status: 'completed',
            model: 'demo',
            created_at: '2024-02-01T00:00:00Z',
            updated_at: '2024-02-01T00:05:00Z',
            output: {
              video: { url: 'https://example.com/output.mp4' },
            },
            metadata: {
              prompt: 'Ocean waves at sunrise',
              duration: 20,
              aspect_ratio: '16:9',
              resolution: '4k',
              guidance_scale: 6,
              camera_motion: 'slow-pan',
            },
          },
        ],
        next_page_token: 'next',
      }),
    }) as any,
  });

  const result = await client.listJobs();

  assert.equal(result.jobs.length, 1);
  assert.equal(result.jobs[0].status, 'completed');
  assert.equal(result.jobs[0].request.parameters.resolution, '4k');
  assert.equal(result.jobs[0].resultUrl, 'https://example.com/output.mp4');
  assert.equal(result.nextPageToken, 'next');
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
