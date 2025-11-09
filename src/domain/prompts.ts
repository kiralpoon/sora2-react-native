import { GenerationParameters, StoryboardStep } from '../api/sora2/types';

export interface PromptDraft {
  prompt: string;
  negativePrompt?: string;
  storyboard?: StoryboardStep[];
  parameters: GenerationParameters;
}

export interface PromptTemplate extends PromptDraft {
  id: string;
  name: string;
  updatedAt: string;
}

export interface PromptLibraryState {
  templates: PromptTemplate[];
}

export interface PromptValidationRuleSet {
  maxPromptLength: number;
  maxStoryboardSteps: number;
  bannedPhrases?: string[];
  guidanceScaleRange: [number, number];
}

export interface PromptValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function createPromptLibrary(initialTemplates: PromptTemplate[] = []): PromptLibraryState {
  return { templates: [...initialTemplates] };
}

export function saveTemplate(library: PromptLibraryState, template: PromptTemplate): PromptLibraryState {
  const existingIndex = library.templates.findIndex((item) => item.id === template.id);
  if (existingIndex >= 0) {
    const nextTemplates = [...library.templates];
    nextTemplates[existingIndex] = { ...template, updatedAt: timestamp() };
    return { templates: nextTemplates };
  }
  return { templates: [...library.templates, { ...template, updatedAt: timestamp() }] };
}

export function removeTemplate(library: PromptLibraryState, templateId: string): PromptLibraryState {
  return { templates: library.templates.filter((template) => template.id !== templateId) };
}

export function renameTemplate(library: PromptLibraryState, templateId: string, name: string): PromptLibraryState {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Template name cannot be empty.');
  }
  return {
    templates: library.templates.map((template) =>
      template.id === templateId ? { ...template, name: trimmed, updatedAt: timestamp() } : template
    ),
  };
}

export function loadTemplate(library: PromptLibraryState, templateId: string): PromptTemplate | undefined {
  const found = library.templates.find((template) => template.id === templateId);
  return found ? { ...found } : undefined;
}

export function validatePrompt(draft: PromptDraft, rules: PromptValidationRuleSet): PromptValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!draft.prompt.trim()) {
    errors.push('Prompt is required.');
  }

  if (draft.prompt.length > rules.maxPromptLength) {
    errors.push(`Prompt exceeds ${rules.maxPromptLength} characters.`);
  }

  if (draft.storyboard && draft.storyboard.length > rules.maxStoryboardSteps) {
    warnings.push(`Storyboard has ${draft.storyboard.length} steps; consider reducing to ${rules.maxStoryboardSteps}.`);
  }

  const [minGuidance, maxGuidance] = rules.guidanceScaleRange;
  if (draft.parameters.guidanceScale < minGuidance || draft.parameters.guidanceScale > maxGuidance) {
    errors.push(`Guidance scale must be between ${minGuidance} and ${maxGuidance}.`);
  }

  if (rules.bannedPhrases) {
    for (const phrase of rules.bannedPhrases) {
      if (draft.prompt.toLowerCase().includes(phrase.toLowerCase())) {
        warnings.push(`Prompt contains discouraged phrase: "${phrase}".`);
      }
    }
  }

  return { isValid: errors.length === 0, errors, warnings };
}

function timestamp(): string {
  return new Date().toISOString();
}
