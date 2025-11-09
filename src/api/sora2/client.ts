import {
  GenerationJob,
  GenerationRequest,
  JobListResponse,
  Sora2ErrorShape,
  SoraModel,
  SoraModelApiResponse,
  SoraGenerationApiJob,
  SoraGenerationApiListResponse,
  buildGenerationPayload,
  normalizeGenerationJob,
  normalizeModel,
} from './types';

type RequestOptions = {
  method?: string;
  headers?: Record<string, string> | Array<[string, string]>;
  body?: string;
};

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

type FetchImpl = (input: string, init?: RequestOptions) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}>;

export interface Sora2ClientOptions {
  baseUrl?: string;
  fetchImpl?: FetchImpl;
  betaHeader?: string;
  modelPath?: string;
}

export class Sora2Client {
  private readonly baseUrl: string;
  private readonly fetchImpl: FetchImpl;
  private readonly betaHeader: string;
  private readonly modelPath: string;

  constructor(private readonly apiKey: string, options: Sora2ClientOptions = {}) {
    if (!apiKey) {
      throw new Error('Sora2Client requires a non-empty API key.');
    }

    this.baseUrl = options.baseUrl ?? 'https://api.openai.com/v1';
    this.fetchImpl = options.fetchImpl ?? (globalThis.fetch as unknown as FetchImpl);
    this.betaHeader = options.betaHeader ?? 'video-generation=2024-12-17';
    this.modelPath = options.modelPath ?? '/models?type=video';

    if (!this.fetchImpl) {
      throw new Error('No fetch implementation available. Provide one via options.fetchImpl.');
    }
  }

  async listModels(): Promise<SoraModel[]> {
    const response = await this.request<SoraModelApiResponse>(this.modelPath, {
      method: 'GET',
    });
    const rawModels = Array.isArray(response?.data) ? response.data : [];
    return rawModels.map(normalizeModel);
  }

  async submitGeneration(request: GenerationRequest): Promise<GenerationJob> {
    const payload = buildGenerationPayload(request);
    const response = await this.request<SoraGenerationApiJob>('/videos', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeGenerationJob(response);
  }

  async getJob(jobId: string): Promise<GenerationJob> {
    if (!jobId) {
      throw new Error('jobId is required.');
    }
    const response = await this.request<SoraGenerationApiJob>(`/videos/${jobId}`, { method: 'GET' });
    return normalizeGenerationJob(response);
  }

  async cancelJob(jobId: string): Promise<GenerationJob> {
    if (!jobId) {
      throw new Error('jobId is required.');
    }
    const response = await this.request<SoraGenerationApiJob>(`/videos/${jobId}/cancel`, { method: 'POST' });
    return normalizeGenerationJob(response);
  }

  async listJobs(params: { pageToken?: string; pageSize?: number } = {}): Promise<JobListResponse> {
    const search = new URLSearchParams();
    if (params.pageToken) {
      search.set('page_token', params.pageToken);
    }
    if (params.pageSize) {
      search.set('page_size', String(params.pageSize));
    }
    const query = search.toString();
    const response = await this.request<SoraGenerationApiListResponse>(`/videos${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
    return {
      jobs: response.data.map(normalizeGenerationJob),
      nextPageToken: response.next_page_token,
    };
  }

  private async request<T>(pathOrUrl: string, init: RequestOptions): Promise<T> {
    const headers = normalizeHeaders(init.headers);
    const isAbsolute = /^https?:/i.test(pathOrUrl);
    const url = isAbsolute ? pathOrUrl : `${this.baseUrl}${pathOrUrl}`;
    const response = await this.fetchImpl(url, {
      ...init,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        'OpenAI-Beta': this.betaHeader,
        ...headers,
      },
    });

    if (!response.ok) {
      const errorBody = (await safeParseJson(response)) as Sora2ErrorShape | undefined;
      const message = errorBody?.message ?? `Request to ${pathOrUrl} failed with status ${response.status}`;
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

function normalizeHeaders(headers: RequestOptions['headers']): Record<string, string> {
  if (!headers) {
    return {};
  }
  if (Array.isArray(headers)) {
    return headers.reduce<Record<string, string>>((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
  }
  if (typeof headers === 'object') {
    return { ...(headers as Record<string, string>) };
  }
  return {};
}
