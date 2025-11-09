import React from 'react';
import { Button, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { GenerationJob } from './src/api/sora2/types';
import { GenerationRequest, SoraModel } from './src/api/sora2/types';
import type { AppState } from './src/state/appState';
import type { ModelView } from './src/domain/models';
import type { NotificationItem } from './src/domain/notifications';
import type { GenerationJobRecord } from './src/domain/jobs';
import {
  addNotification,
  applyModelFilter,
  changeSettings,
  createAppState,
  getOverview,
  recordApiJob,
  selectVisibleModelView,
  toggleModelFavorite,
  validateDraft,
} from './src/state/appState';
import { PromptTemplate } from './src/domain/prompts';

const seedModels: SoraModel[] = [
  {
    id: 'cinematic-pro',
    name: 'Cinematic Pro',
    description: 'High fidelity cinematic footage with dramatic lighting and camera motion.',
    capabilities: [
      { id: 'motion', label: 'Dynamic Motion' },
      { id: 'sound', label: 'Audio Bed' },
    ],
    maxDurationSeconds: 60,
    aspectRatios: ['16:9', '21:9'],
    defaultParameters: {
      durationSeconds: 30,
      aspectRatio: '16:9',
      resolution: '1080p',
      guidanceScale: 7.5,
      cameraMotion: 'dynamic',
    },
    tags: ['cinematic', 'live-action'],
  },
  {
    id: 'studio-illustration',
    name: 'Studio Illustration',
    description: 'Stylized illustration sequences ideal for storyboards and motion graphics.',
    capabilities: [{ id: 'stylization', label: 'Stylization Control' }],
    maxDurationSeconds: 45,
    aspectRatios: ['1:1', '4:5', '9:16'],
    defaultParameters: {
      durationSeconds: 20,
      aspectRatio: '9:16',
      resolution: '1080p',
      guidanceScale: 9,
      cameraMotion: 'slow-pan',
    },
    tags: ['animation', 'stylized'],
  },
  {
    id: 'aerial-discovery',
    name: 'Aerial Discovery',
    description: 'Sweeping aerial drone perspectives suitable for landscapes and establishing shots.',
    capabilities: [
      { id: 'motion', label: 'Dynamic Motion' },
      { id: 'geo', label: 'Geographic Awareness' },
    ],
    maxDurationSeconds: 90,
    aspectRatios: ['16:9'],
    defaultParameters: {
      durationSeconds: 40,
      aspectRatio: '16:9',
      resolution: '4k',
      guidanceScale: 6,
      cameraMotion: 'dynamic',
    },
    tags: ['landscape', 'travel'],
  },
];

const seedTemplates: PromptTemplate[] = [
  {
    id: 'sunrise-travel',
    name: 'Sunrise Travel Montage',
    updatedAt: new Date().toISOString(),
    prompt: 'Sunrise over coastal mountains captured by drone with warm cinematic color grading.',
    negativePrompt: 'No logos, no text overlays, no jitter.',
    storyboard: [
      { id: 'shot-1', description: 'Wide establishing shot approaching cliffs.' },
      { id: 'shot-2', description: 'Slow pan revealing sunrise reflections.' },
    ],
    parameters: {
      durationSeconds: 30,
      aspectRatio: '16:9',
      resolution: '4k',
      guidanceScale: 7,
      cameraMotion: 'dynamic',
    },
  },
];

const initialState: AppState = createAppState(seedModels, seedTemplates);

export default function App() {
  const [state, setState] = React.useState<AppState>(initialState);
  const [searchTerm, setSearchTerm] = React.useState('');

  const overview = React.useMemo(() => getOverview(state), [state]);
  const visibleModels = React.useMemo<ReturnType<typeof selectVisibleModelView>>(() => selectVisibleModelView(state), [state]);

  const applySearch = (term: string) => {
    setSearchTerm(term);
    setState((previous: AppState) => applyModelFilter(previous, { searchTerm: term }));
  };

  const handleFavoriteToggle = (modelId: string) => {
    setState((previous: AppState) => toggleModelFavorite(previous, modelId));
  };

  const handleValidateTemplate = () => {
    const template = seedTemplates[0];
    const validation = validateDraft(state, template);
    const notification: NotificationItem = {
      id: `validation-${Date.now()}`,
      type: validation.isValid ? 'success' : 'error',
      title: validation.isValid ? 'Prompt validated' : 'Prompt issues found',
      message: validation.isValid
        ? 'Template is ready for submission.'
        : validation.errors.concat(validation.warnings).join('\n'),
      createdAt: new Date().toISOString(),
    };
    setState((previous: AppState) => addNotification(previous, notification));
  };

  const handleSimulateJobCompletion = () => {
    const request: GenerationRequest = {
      modelId: visibleModels[0]?.id ?? seedModels[0].id,
      prompt: seedTemplates[0].prompt,
      parameters: seedTemplates[0].parameters,
      negativePrompt: seedTemplates[0].negativePrompt,
      storyboard: seedTemplates[0].storyboard,
    };

    const now = new Date();
    const jobId = `job-${now.getTime()}`;
    const mockJob: GenerationJob = {
      id: jobId,
      status: 'completed' as const,
      modelId: request.modelId,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      progress: 100,
      request,
      resultUrl: 'https://example.com/video.mp4',
      thumbnailUrl: 'https://example.com/video.jpg',
    };

    setState((previous: AppState) => recordApiJob(previous, mockJob));
  };

  const handleToggleTheme = () => {
    setState((previous: AppState) =>
      changeSettings(previous, {
        theme: previous.settings.theme === 'dark' ? 'light' : 'dark',
      })
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Sora2 Video Studio</Text>
      <Text style={styles.subheading}>Overview</Text>
      <View style={styles.card}>
        <Text>Total models: {overview.models.total}</Text>
        <Text>Favorites: {overview.models.favorites}</Text>
        <Text>Visible: {overview.models.filtered}</Text>
        <Text>Active jobs: {overview.activeJobs}</Text>
        <Text>Completed jobs: {overview.completedJobs}</Text>
        <Text>Failed jobs: {overview.failedJobs}</Text>
      </View>

      <Text style={styles.subheading}>Model Catalog</Text>
      <View style={styles.card}>
        <Text>Current search: {searchTerm || '∅'}</Text>
        <View style={styles.row}>
          <Pressable style={styles.chip} onPress={() => applySearch('cinematic')}>
            <Text>Search cinematic</Text>
          </Pressable>
          <Pressable style={styles.chip} onPress={() => applySearch('landscape')}>
            <Text>Search landscape</Text>
          </Pressable>
          <Pressable style={styles.chip} onPress={() => applySearch('')}>
            <Text>Clear search</Text>
          </Pressable>
        </View>

        {visibleModels.map((model: ModelView) => (
          <View key={model.id} style={styles.modelRow}>
            <View style={styles.modelHeader}>
              <Text style={styles.modelName}>{model.name}</Text>
              <Pressable onPress={() => handleFavoriteToggle(model.id)}>
                <Text style={styles.favorite}>{model.favorite ? '★' : '☆'}</Text>
              </Pressable>
            </View>
            <Text style={styles.modelDescription}>{model.description}</Text>
            <Text style={styles.modelMeta}>
              Duration ≤ {model.maxDurationSeconds}s • Ratios: {model.aspectRatios.join(', ')} • Tags: {model.tags.join(', ')}
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.subheading}>Prompt Templates</Text>
      <View style={styles.card}>
        {seedTemplates.map((template) => (
          <View key={template.id} style={styles.template}>
            <Text style={styles.templateName}>{template.name}</Text>
            <Text numberOfLines={3}>{template.prompt}</Text>
            <Text style={styles.templateMeta}>Last updated {new Date(template.updatedAt).toLocaleString()}</Text>
          </View>
        ))}
        <Button title="Validate active template" onPress={handleValidateTemplate} />
      </View>

      <Text style={styles.subheading}>Job History</Text>
      <View style={styles.card}>
        {state.jobs.jobs.length === 0 ? (
          <Text>No jobs yet. Trigger the simulator below.</Text>
        ) : (
          state.jobs.jobs.map((job: GenerationJobRecord) => (
            <View key={job.id} style={styles.job}>
              <Text style={styles.jobTitle}>{job.request.prompt.slice(0, 40)}...</Text>
              <Text>Status: {job.status}</Text>
              <Text>Progress: {job.progress}%</Text>
              {job.resultUrl ? <Text>Result: {job.resultUrl}</Text> : null}
            </View>
          ))
        )}
        <Button title="Simulate finished job" onPress={handleSimulateJobCompletion} />
      </View>

      <Text style={styles.subheading}>Notifications</Text>
      <View style={styles.card}>
        {state.notifications.items.length === 0 ? (
          <Text>No notifications yet.</Text>
        ) : (
          state.notifications.items.map((notification: NotificationItem) => (
            <View key={notification.id} style={styles.notification}>
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <Text>{notification.message}</Text>
            </View>
          ))
        )}
      </View>

      <Text style={styles.subheading}>Settings</Text>
      <View style={styles.card}>
        <Text>Theme: {state.settings.theme}</Text>
        <Button title="Toggle theme" onPress={handleToggleTheme} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0d0f12',
  },
  content: {
    padding: 24,
    gap: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: '600',
    color: '#f6f7f9',
  },
  subheading: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f6f7f9',
  },
  card: {
    backgroundColor: '#1a1d23',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    backgroundColor: '#2b2f38',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  modelRow: {
    borderTopWidth: 1,
    borderTopColor: '#2f333d',
    paddingTop: 12,
    gap: 4,
  },
  modelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modelName: {
    color: '#f0f1f5',
    fontWeight: '600',
  },
  favorite: {
    fontSize: 18,
    color: '#ffd166',
  },
  modelDescription: {
    color: '#c4c7d1',
  },
  modelMeta: {
    color: '#8c92a3',
    fontSize: 12,
  },
  template: {
    borderTopWidth: 1,
    borderTopColor: '#2f333d',
    paddingTop: 12,
    gap: 6,
  },
  templateName: {
    fontWeight: '600',
    color: '#f0f1f5',
  },
  templateMeta: {
    fontSize: 12,
    color: '#8c92a3',
  },
  job: {
    borderTopWidth: 1,
    borderTopColor: '#2f333d',
    paddingTop: 12,
    gap: 4,
  },
  jobTitle: {
    color: '#f0f1f5',
    fontWeight: '600',
  },
  notification: {
    borderTopWidth: 1,
    borderTopColor: '#2f333d',
    paddingTop: 12,
    gap: 4,
  },
  notificationTitle: {
    fontWeight: '600',
    color: '#f0f1f5',
  },
});
