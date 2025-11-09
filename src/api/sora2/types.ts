export interface SoraModelCapability {
  id: string;
  label: string;
  description?: string;
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

export interface GenerationParameters {
  durationSeconds: number;
  aspectRatio: string;
  resolution: '720p' | '1080p' | '4k';
  guidanceScale: number;
  cameraMotion: 'static' | 'slow-pan' | 'dynamic';
  seed?: number;
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
