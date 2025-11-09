import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PromptDraft,
  PromptTemplate,
  createPromptLibrary,
  loadTemplate,
  removeTemplate,
  renameTemplate,
  saveTemplate,
  validatePrompt,
} from '../../src/domain/prompts';

const baseTemplate: PromptTemplate = {
  id: 'template-1',
  name: 'City at night',
  updatedAt: new Date(2024, 0, 1).toISOString(),
  prompt: 'A neon-lit futuristic city street, bustling with autonomous vehicles.',
  negativePrompt: 'No rain, no fog.',
  storyboard: [{ id: 'shot-1', description: 'Wide establishing shot.' }],
  parameters: {
    durationSeconds: 20,
    aspectRatio: '16:9',
    resolution: '1080p',
    guidanceScale: 8,
    cameraMotion: 'dynamic',
  },
};

test('saveTemplate upserts and updates timestamps', () => {
  const library = createPromptLibrary();
  const saved = saveTemplate(library, baseTemplate);
  assert.equal(saved.templates.length, 1);
  const updated = saveTemplate(saved, { ...baseTemplate, prompt: 'Updated prompt' });
  assert.equal(updated.templates.length, 1);
  assert.equal(updated.templates[0].prompt, 'Updated prompt');
  assert.notEqual(updated.templates[0].updatedAt, baseTemplate.updatedAt);
});

test('renameTemplate trims and persists new name', () => {
  const library = createPromptLibrary([baseTemplate]);
  const renamed = renameTemplate(library, baseTemplate.id, '  City Nightlife  ');
  assert.equal(renamed.templates[0].name, 'City Nightlife');
});

test('removeTemplate deletes only selected template', () => {
  const library = createPromptLibrary([baseTemplate, { ...baseTemplate, id: 'template-2' }]);
  const trimmed = removeTemplate(library, baseTemplate.id);
  assert.equal(trimmed.templates.length, 1);
  assert.equal(trimmed.templates[0].id, 'template-2');
});

test('validatePrompt enforces prompt length, guidance scale, and banned phrases', () => {
  const draft: PromptDraft = {
    prompt: 'Short prompt with forbidden keyword',
    parameters: {
      durationSeconds: 20,
      aspectRatio: '16:9',
      resolution: '1080p',
      guidanceScale: 20,
      cameraMotion: 'dynamic',
    },
  };

  const result = validatePrompt(draft, {
    maxPromptLength: 10,
    maxStoryboardSteps: 5,
    guidanceScaleRange: [1, 15],
    bannedPhrases: ['forbidden'],
  });

  assert.equal(result.isValid, false);
  assert.ok(result.errors.some((message) => message.includes('exceeds')));
  assert.ok(result.errors.some((message) => message.includes('Guidance scale')));
  assert.ok(result.warnings.some((message) => message.includes('forbidden')));
});

test('loadTemplate returns a defensive copy', () => {
  const library = createPromptLibrary([baseTemplate]);
  const template = loadTemplate(library, baseTemplate.id);
  assert.ok(template);
  if (!template) {
    throw new Error('Template expected');
  }
  template.name = 'Mutated';
  const original = loadTemplate(library, baseTemplate.id);
  assert.equal(original?.name, baseTemplate.name);
});
