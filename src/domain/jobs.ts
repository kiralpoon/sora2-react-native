import { GenerationJob, JobStatus } from '../api/sora2/types';

export interface JobTimelineEvent {
  status: JobStatus;
  timestamp: string;
  note?: string;
  progress?: number;
}

export interface GenerationJobRecord extends GenerationJob {
  events: JobTimelineEvent[];
}

export interface JobTrackerState {
  jobs: GenerationJobRecord[];
}

export function createJobTracker(initialJobs: GenerationJobRecord[] = []): JobTrackerState {
  return { jobs: [...initialJobs].sort(descendingByCreatedAt) };
}

export function upsertJobFromApi(state: JobTrackerState, job: GenerationJob): JobTrackerState {
  const nextJobs = [...state.jobs];
  const index = nextJobs.findIndex((existing) => existing.id === job.id);
  if (index >= 0) {
    nextJobs[index] = mergeJob(nextJobs[index], job);
  } else {
    nextJobs.push(createRecord(job));
  }
  nextJobs.sort(descendingByCreatedAt);
  return { jobs: nextJobs };
}

export function markJobEvent(state: JobTrackerState, jobId: string, event: JobTimelineEvent): JobTrackerState {
  const nextJobs = state.jobs.map((job) =>
    job.id === jobId ? { ...job, events: [...job.events, event], status: event.status, updatedAt: event.timestamp } : job
  );
  return { jobs: nextJobs.sort(descendingByCreatedAt) };
}

export function selectActiveJobs(state: JobTrackerState): GenerationJobRecord[] {
  return state.jobs.filter((job) => job.status === 'queued' || job.status === 'running');
}

export function selectCompletedJobs(state: JobTrackerState): GenerationJobRecord[] {
  return state.jobs.filter((job) => job.status === 'completed');
}

export function selectFailedJobs(state: JobTrackerState): GenerationJobRecord[] {
  return state.jobs.filter((job) => job.status === 'failed' || job.status === 'canceled');
}

function createRecord(job: GenerationJob): GenerationJobRecord {
  return {
    ...job,
    events: [
      {
        status: job.status,
        timestamp: job.createdAt,
        progress: job.progress,
      },
    ],
  };
}

function mergeJob(existing: GenerationJobRecord, next: GenerationJob): GenerationJobRecord {
  const events = [...existing.events];
  if (existing.status !== next.status) {
    events.push({ status: next.status, timestamp: next.updatedAt, progress: next.progress });
  } else if (existing.progress !== next.progress) {
    events.push({ status: next.status, timestamp: next.updatedAt, progress: next.progress });
  }
  return {
    ...existing,
    ...next,
    events,
  };
}

function descendingByCreatedAt(a: GenerationJob, b: GenerationJob): number {
  return Date.parse(b.createdAt) - Date.parse(a.createdAt);
}
