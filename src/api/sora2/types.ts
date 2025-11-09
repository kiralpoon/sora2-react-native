export interface SoraModelCapability {
  id: string;
  label: string;
  description?: string;
}

export type GenerationResolution = '720p' | '1080p' | '4k';
export type GenerationCameraMotion = 'static' | 'slow-pan' | 'dynamic';

export interface GenerationParameters {
  durationSeconds: number;
  aspectRatio: string;
  resolution: GenerationResolution;
  guidanceScale: number;
  cameraMotion: GenerationCameraMotion;
  seed?: number;
}

export interface SoraModel {
  id: string;
  name: string;
  description: string;
  capabilities: SoraModelCapability[];
  maxDurationSeconds: number;
  aspectRatios: string[];
  defaultParameters: GenerationParameters;
  tags: string[];
}

export interface StoryboardStep {
  id: string;
  description: string;
  durationSeconds?: number;
}

export interface GenerationRequestMetadata {
  title?: string;
  description?: string;
  notes?: string;
}

export interface GenerationRequest {
  modelId: string;
  prompt: string;
  negativePrompt?: string;
  storyboard?: StoryboardStep[];
  parameters: GenerationParameters;
  metadata?: GenerationRequestMetadata;
  watermark?: boolean;
}

export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'canceled';

export interface GenerationJob {
  id: string;
  status: JobStatus;
  modelId: string;
  createdAt: string;
  updatedAt: string;
  progress: number;
  request: GenerationRequest;
  resultUrl?: string;
  thumbnailUrl?: string;
  errorMessage?: string;
}

export interface JobListResponse {
  jobs: GenerationJob[];
  nextPageToken?: string;
}

export interface Sora2ErrorShape {
  message: string;
  code?: string;
  details?: unknown;
}

/**
 * API response structures from the OpenAI Sora video generation endpoints.
 */
export interface SoraModelApiResponse {
  data: SoraModelApiModel[];
  next_page_token?: string;
}

export interface SoraModelApiModel {
  id: string;
  object?: string;
  created?: number;
  display_name?: string;
  description?: string;
  metadata?: {
    tags?: string[];
    capabilities?: SoraModelCapability[];
    video?: {
      max_duration_seconds?: number;
      default_aspect_ratio?: string;
      supported_aspect_ratios?: string[];
      default_parameters?: {
        duration_seconds?: number;
        aspect_ratio?: string;
        resolution?: GenerationResolution;
        guidance_scale?: number;
        camera_motion?: GenerationCameraMotion;
        seed?: number;
      };
    };
  };
}

export interface SoraGenerationApiRequest {
  model: string;
  prompt: string;
  negative_prompt?: string;
  aspect_ratio?: string;
  duration?: number;
  guidance_scale?: number;
  camera_motion?: GenerationCameraMotion;
  seed?: number;
  resolution?: GenerationResolution;
  storyboard?: { id?: string; description: string; duration?: number }[];
  metadata?: GenerationRequestMetadata;
  watermark?: boolean;
}

export interface SoraGenerationApiJob {
  id: string;
  object?: string;
  model: string;
  status: 'queued' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  updated_at: string;
  estimated_completion_at?: string;
  error?: { code?: string; message: string };
  output?: {
    video?: { url: string; format?: string; quality?: string } | null;
    thumbnails?: { url: string }[];
  };
  metadata?: {
    prompt?: string;
    negative_prompt?: string;
    duration?: number;
    aspect_ratio?: string;
    guidance_scale?: number;
    camera_motion?: GenerationCameraMotion;
    seed?: number;
    resolution?: GenerationResolution;
    storyboard?: { id?: string; description: string; duration?: number }[];
    request_metadata?: GenerationRequestMetadata;
    watermark?: boolean;
  };
}

export interface SoraGenerationApiListResponse {
  data: SoraGenerationApiJob[];
  next_page_token?: string;
}

export function normalizeModel(model: SoraModelApiModel): SoraModel {
  const videoMeta = model.metadata?.video ?? {};
  const defaultParams = videoMeta.default_parameters ?? {};
  const aspectRatios = videoMeta.supported_aspect_ratios ??
    (videoMeta.default_aspect_ratio ? [videoMeta.default_aspect_ratio] : ['16:9']);

  const maxDuration = videoMeta.max_duration_seconds ?? defaultParams.duration_seconds ?? 60;
  const defaultDuration = defaultParams.duration_seconds ?? Math.min(30, maxDuration);
  const defaultAspect = defaultParams.aspect_ratio ?? videoMeta.default_aspect_ratio ?? aspectRatios[0] ?? '16:9';
  const guidanceScale = defaultParams.guidance_scale ?? 7;
  const resolution = defaultParams.resolution ?? '1080p';
  const cameraMotion = defaultParams.camera_motion ?? 'dynamic';

  return {
    id: model.id,
    name: model.display_name ?? model.id,
    description: model.description ?? '',
    capabilities: model.metadata?.capabilities ?? [],
    maxDurationSeconds: maxDuration,
    aspectRatios,
    defaultParameters: {
      durationSeconds: defaultDuration,
      aspectRatio: defaultAspect,
      resolution,
      guidanceScale,
      cameraMotion,
      seed: defaultParams.seed,
    },
    tags: model.metadata?.tags ?? [],
  };
}

export function buildGenerationPayload(request: GenerationRequest): SoraGenerationApiRequest {
  return {
    model: request.modelId,
    prompt: request.prompt,
    negative_prompt: request.negativePrompt,
    aspect_ratio: request.parameters.aspectRatio,
    duration: request.parameters.durationSeconds,
    guidance_scale: request.parameters.guidanceScale,
    camera_motion: request.parameters.cameraMotion,
    seed: request.parameters.seed,
    resolution: request.parameters.resolution,
    storyboard: request.storyboard?.map((step) => ({
      id: step.id,
      description: step.description,
      duration: step.durationSeconds,
    })),
    metadata: request.metadata,
    watermark: request.watermark,
  };
}

export function normalizeGenerationJob(job: SoraGenerationApiJob): GenerationJob {
  const statusMap: Record<SoraGenerationApiJob['status'], JobStatus> = {
    queued: 'queued',
    in_progress: 'running',
    completed: 'completed',
    failed: 'failed',
    cancelled: 'canceled',
  };

  const progressMap: Record<SoraGenerationApiJob['status'], number> = {
    queued: 0,
    in_progress: 50,
    completed: 100,
    failed: 100,
    cancelled: 0,
  };

  const metadata = job.metadata ?? {};

  const parameters: GenerationParameters = {
    durationSeconds: metadata.duration ?? 0,
    aspectRatio: metadata.aspect_ratio ?? '16:9',
    resolution: metadata.resolution ?? '1080p',
    guidanceScale: metadata.guidance_scale ?? 7,
    cameraMotion: metadata.camera_motion ?? 'dynamic',
    seed: metadata.seed,
  };

  const request: GenerationRequest = {
    modelId: job.model,
    prompt: metadata.prompt ?? '',
    negativePrompt: metadata.negative_prompt,
    storyboard: metadata.storyboard?.map((step, index) => ({
      id: step.id ?? `shot-${index}`,
      description: step.description,
      durationSeconds: step.duration,
    })),
    parameters,
    metadata: metadata.request_metadata,
    watermark: (metadata as { watermark?: boolean } | undefined)?.watermark,
  };

  return {
    id: job.id,
    status: statusMap[job.status],
    modelId: job.model,
    createdAt: job.created_at,
    updatedAt: job.updated_at,
    progress: progressMap[job.status],
    request,
    resultUrl: job.output?.video?.url ?? undefined,
    thumbnailUrl: job.output?.thumbnails?.[0]?.url ?? undefined,
    errorMessage: job.error?.message,
  };
}
