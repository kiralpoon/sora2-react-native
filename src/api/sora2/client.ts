import {
  GenerationJob,
  GenerationRequest,
  JobListResponse,
  Sora2ErrorShape,
  SoraModel,
} from './types';

export class Sora2Error extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'Sora2Error';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type FetchImpl = (input: string, init?: Record<string, unknown>) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}>;

export interface Sora2ClientOptions {
  baseUrl?: string;
  fetchImpl?: FetchImpl;
}

export class Sora2Client {
  private readonly baseUrl: string;
  private readonly fetchImpl: FetchImpl;

  constructor(private readonly apiKey: string, options: Sora2ClientOptions = {}) {
    if (!apiKey) {
      throw new Error('Sora2Client requires a non-empty API key.');
    }

    this.baseUrl = options.baseUrl ?? 'https://api.openai.com/v1/videos';
    this.fetchImpl = options.fetchImpl ?? (globalThis.fetch as unknown as FetchImpl);

    if (!this.fetchImpl) {
      throw new Error('No fetch implementation available. Provide one via options.fetchImpl.');
    }
  }

  async listModels(): Promise<SoraModel[]> {
    const response = await this.request<SoraModel[]>('/models', {
      method: 'GET',
    });
    return response;
  }

  async submitGeneration(request: GenerationRequest): Promise<GenerationJob> {
    const response = await this.request<GenerationJob>('/generations', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response;
  }

  async getJob(jobId: string): Promise<GenerationJob> {
    if (!jobId) {
      throw new Error('jobId is required.');
    }
    return this.request<GenerationJob>(`/generations/${jobId}`, { method: 'GET' });
  }

  async cancelJob(jobId: string): Promise<GenerationJob> {
    if (!jobId) {
      throw new Error('jobId is required.');
    }
    return this.request<GenerationJob>(`/generations/${jobId}`, { method: 'DELETE' });
  }

  async listJobs(params: { pageToken?: string; pageSize?: number } = {}): Promise<JobListResponse> {
    const search = new URLSearchParams();
    if (params.pageToken) {
      search.set('pageToken', params.pageToken);
    }
    if (params.pageSize) {
      search.set('pageSize', String(params.pageSize));
    }
    const query = search.toString();
    return this.request<JobListResponse>(`/generations${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
  }

  private async request<T>(path: string, init: Record<string, unknown>): Promise<T> {
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      ...init,
    });

    if (!response.ok) {
      const errorBody = (await safeParseJson(response)) as Sora2ErrorShape | undefined;
      const message = errorBody?.message ?? `Request to ${path} failed with status ${response.status}`;
      throw new Sora2Error(message, response.status, errorBody?.code, errorBody?.details);
    }

    return (await response.json()) as T;
  }
}

async function safeParseJson(response: { json: () => Promise<unknown> }): Promise<unknown | undefined> {
  try {
    return await response.json();
  } catch (error) {
    return undefined;
  }
}
