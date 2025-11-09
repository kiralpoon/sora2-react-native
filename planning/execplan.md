# Build Expo Sora2 Video Generation App

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This document must be maintained in accordance with `.agent/PLANS.md` in the repository root.

## Purpose / Big Picture

Implement a React Native application using Expo that allows creators to generate watermark-free Sora2 videos from their mobile devices. After following this plan, a user can authenticate with their Sora2 API key, explore available generation models, craft prompts with advanced parameters, submit jobs, monitor progress, and review resulting videos. The plan also covers a continuously updated ExecPlan workflow so stakeholders can track delivery status in real time, and it documents how to run and test the app locally before preparing deployments.

## Progress

Keep this section current after every meaningful milestone, PR merge, or blocked issue. Update both the summary table and the nested checklists below so readers can scan high-level status while also seeing the concrete subtasks that remain.

- **Status** values: `todo`, `in-progress`, `blocked`, `in-review`, `done` (use emoji/checkboxes).
- **Timestamp (UTC)**: refresh whenever status, owner, or notes change.
- **Owner**: list the active assignee or `Unassigned`.
- **Notes**: short summary of what changed since the previous update and what is next.

| Feature Stream | Status | Last Update (UTC) | Owner | Latest Notes |
| --- | --- | --- | --- | --- |
| ExecPlan foundation | ✅ Done | 2025-11-09 12:40 | gpt-5-codex | Drafted initial ExecPlan outlining scope, local testing workflow, and live-tracking expectations. |
| Expo scaffolding & architecture | 🟡 In-Progress | 2025-11-09 15:35 | gpt-5-codex | Connected domain state to an Expo-style App.tsx mock; navigation + native scaffolding still pending. |
| API client & secure auth | 🟡 In-Progress | 2025-11-09 15:35 | gpt-5-codex | Typed fetch client and in-memory key bridge in place; secure storage + polling outstanding. |
| Model discovery & prompt builder | 🟡 In-Progress | 2025-11-09 15:35 | gpt-5-codex | Single-screen UI now renders catalog search, favorites, and template validation. Navigation split still TODO. |
| Submission, history, result viewer | 🟡 In-Progress | 2025-11-09 15:35 | gpt-5-codex | Job simulator populates history/notifications; dedicated submission flow + playback still needed. |
| Notifications, logging, settings | 🟡 In-Progress | 2025-11-09 15:35 | gpt-5-codex | Notification list + theme toggle wired in UI; toast system and logging infra pending. |
| Testing, QA, deployment docs | 🟡 In-Progress | 2025-11-09 15:35 | gpt-5-codex | Type-safe build, lint, and domain test suites run locally; Expo integration checks outstanding. |

### Live Feature Progress Checklist

- [x] **ExecPlan foundation**
  - [x] Capture scope, goals, and end-to-end workflow expectations.
  - [x] Document local testing steps and dependencies.
  - [x] Define live update protocol and maintenance cadence.
- [ ] **Expo scaffolding & architecture**
  - [ ] Initialize Expo TypeScript project with navigation and UI toolkit.
  - [ ] Configure linting, formatting, and commit hooks.
  - [x] Establish folder structure and environment variable handling.
  - [x] Connect domain state to initial Expo screen prototypes.
- [ ] **API client & secure auth**
  - [x] Implement Sora2 API wrapper with typed requests/responses.
  - [ ] Wire secure key storage and injection into requests.
  - [ ] Build polling/cancellation utilities and error normalization.
- [ ] **Model discovery & prompt builder**
  - [x] Ship model catalog UI with filters, search, and favorites.
  - [x] Implement prompt builder with validation and template persistence.
  - [ ] Provide guidance content and negative/storyboard sections.
- [ ] **Submission, history, result viewer**
  - [ ] Create submission review flow with progress indicators.
  - [x] Implement job history with retry/duplicate actions (mocked for now).
  - [ ] Build result viewer supporting playback, metadata, and sharing.
- [ ] **Notifications, logging, settings**
  - [x] Add notification list UI and state wiring.
  - [ ] Centralize logging/error handling with adjustable verbosity.
  - [x] Implement settings UI for theme toggle.
  - [ ] Add localization and analytics preferences.
- [ ] **Testing, QA, deployment docs**
  - [x] Configure automated tests (Node test runner) for domain/state layers.
  - [x] Draft manual QA checklist and local testing instructions.
  - [ ] Prepare deployment documentation, screenshots, release notes.

**Live Update Protocol:**

1. When work starts on a feature stream, flip the table row status to `🟡 In-Progress`, check the corresponding parent checkbox, and add a timestamp.
2. As subtasks complete, tick the relevant sub-checkbox and append the accomplishment to `Latest Notes`; add blocker notes inline for unchecked items if progress stalls.
3. If ownership changes, update both the table and checklist owner annotations (if listed) along with the timestamp.
4. On completion, set the status to `✅ Done`, check all subtasks, add the finish timestamp, and move any follow-ups to `Outcomes & Retrospective`.
5. Review the table and checklist during standups; if no update occurs within 48 hours for an active stream, mark it as `🚫 Blocked` or note the reason beneath the unchecked subtasks.

## Surprises & Discoveries

- Observation: _To be updated once implementation uncovers unexpected behavior._
  Evidence: _Pending._

## Decision Log

- Decision: _Initial ExecPlan will track the full feature set before any code exists, to align stakeholders before implementation._
  Rationale: Ensures future contributors have a single source of truth for scope, sequencing, and testing expectations.
  Date/Author: 2025-11-09 / gpt-5-codex.

## Outcomes & Retrospective

_Summarize lessons learned, shipped features, and outstanding work when major milestones or the entire plan complete._

## Context and Orientation

The repository currently contains only planning materials. Implementation will create an Expo-managed React Native project under `app/` or `src/` folders as described below. Contributors must avoid reading or modifying `Kiral_OpenAI_Event_Memo.md` because `Agents.md` marks it as an out-of-scope personal memo. All execution plan guidance lives in `.agent/PLANS.md` and this file.

Sora2 is a video generation API described at `https://platform.openai.com/docs/guides/video-generation`. The app must surface Sora2 models, accept prompts, send generation requests, poll for completion, and present downloadable results without watermarks. Expo provides tooling for local development via simulators (`npx expo start` with iOS Simulator, Android Emulator, or web) and for deployment through Expo Application Services (EAS).

## Plan of Work

Begin by bootstrapping the Expo project with TypeScript support, React Navigation, a chosen state management library (Zustand or Redux Toolkit), and a UI component system compatible with Expo (Tamagui, NativeBase, or similar). Configure linting (ESLint, Prettier) and commit hooks to preserve consistency. Establish directory structure under `src/` for `api`, `components`, `screens`, `hooks`, `store`, `utils`, and `theme` to organize features.

Implement a secure API integration layer that wraps Sora2 HTTP endpoints. Use `expo-secure-store` to persist API keys and inject them into requests. Provide hooks such as `useModels`, `useSubmitJob`, `useJobStatus`, and `useJobHistory` that expose typed data, support polling, and handle cancellation. Normalize errors into user-readable messages.

Design screens for onboarding and settings where users enter their API key. Block access to primary navigation until a valid key is stored. Introduce a model exploration screen with search, filters, favorite toggles, and model detail modals. Build a prompt builder with sections for main prompt, optional negative prompt, storyboard steps, and template management stored in AsyncStorage.

Create parameter controls tailored to each model (duration, resolution, aspect ratio, motion). Before submission, present a review screen summarizing the request. On submission, start the generation job via the API and transition to a status screen that polls until completion or failure. Maintain a history list with retry and duplicate actions. When jobs complete, present a result viewer that streams video via `expo-av`, shows metadata, and enables sharing or local downloads using `expo-file-system` and `expo-sharing`.

Implement in-app notifications via toast/snackbar components and optional push notifications using Expo Notifications. Centralize logging with adjustable verbosity and integrate error boundaries for unhandled exceptions. Provide a settings screen for theme toggles, localization scaffolding, and analytics opt-in.

Throughout development, keep this ExecPlan updated after every significant change: mark progress with timestamps, record surprises, and capture design decisions. Document local testing workflows in `README.md`, including steps to run `npx expo start`, use iOS/Android simulators, run web preview, and execute `npx expo run:[ios|android]` after `expo prebuild`. Provide scripts for `expo-doctor` and `expo start --clear` to diagnose cache issues before EAS builds. When deployment preparation begins, configure `app.config.js` with environment variables, icons, and build profiles, and script EAS build/test commands.

## Concrete Steps

1. From the repository root, run `npx create-expo-app@latest sora2-app --template expo-template-blank-typescript` to scaffold the project inside a new `sora2-app/` folder, or adapt the output into the current repository structure (e.g., moving generated files under `.` if preferred). After scaffolding, install dependencies for navigation (`@react-navigation/native`, `@react-navigation/native-stack`, required Expo packages), state management, and UI components.
2. Configure TypeScript path aliases and environment variable support via `babel.config.js` and `tsconfig.json`. Add ESLint, Prettier, and Husky with an npm `prepare` script so linting runs on commits.
3. Introduce `.env` handling using `expo-constants` or `react-native-dotenv`, ensuring API keys are never committed. Document usage in `README.md`.
4. Implement API client modules under `src/api/sora2Client.ts` using `fetch` or `axios` with interceptors for authentication and error handling. Create hooks in `src/hooks/` that consume these clients.
5. Build UI screens in `src/screens/` with supporting components. Ensure forms use controlled inputs and validations. Persist templates and favorites via AsyncStorage.
6. Add navigation stack combining onboarding, model exploration, prompt builder, submission review, job history, result viewer, and settings. Guard routes based on API key presence.
7. Integrate notifications and logging utilities. Configure push notification registration and permissions with Expo services.
8. Write Jest tests for hooks and reducers. Add React Native Testing Library tests for primary screens. Maintain manual QA checklist covering local simulator runs and API happy-path verification.
9. Update `README.md` with local testing instructions: `npx expo start`, running platform-specific simulators, using mock responses when offline, and verifying functionality before deployment. Describe EAS build commands (`eas build --profile preview --platform ios|android`) and prerequisites.
10. Prepare release assets and privacy documentation. Verify Expo configuration with `expo-doctor` and `expo prebuild` before final builds.

## Validation and Acceptance

Successful implementation lets a tester run `npx expo start` from the repository root, launch the app in an iOS Simulator or Android Emulator, enter a valid Sora2 API key, select a model, craft a prompt, adjust parameters, submit a job, observe status updates, and play back the resulting video without a watermark. Automated validation includes running `npm test` (Jest suite) and any `npm run lint` command. Manual validation includes confirming that history entries persist across app restarts, notifications fire on completion, and sharing saves the video locally.

## Idempotence and Recovery

Expo commands (`npx expo start`, `expo prebuild`) are safe to rerun. If dependencies become inconsistent, delete `node_modules` and `package-lock.json` (or `yarn.lock`) and reinstall. For API errors, provide retry buttons and clear messages. Document fallback steps in `README.md`, such as using mock data when the Sora2 service is unavailable. Ensure SecureStore-stored keys can be reset from settings in case of corruption.

## Artifacts and Notes

Capture key screenshots of the model selection, prompt builder, submission review, and result viewer screens once implemented. Store reference transcripts of successful job submissions and API responses in this section or linked files so future maintainers understand expected payloads and flows.

## Interfaces and Dependencies

Use Expo SDK-compatible libraries only. Core dependencies include `expo`, `react`, `react-native`, `@react-navigation/native`, `@react-navigation/native-stack`, `expo-secure-store`, `expo-av`, `expo-file-system`, `expo-sharing`, `expo-notifications`, `@react-native-async-storage/async-storage`, and a chosen UI toolkit. Define TypeScript types for key interfaces such as:

- `ModelSummary` in `src/api/types.ts` with fields `id`, `displayName`, `capabilities`, `maxDurationSeconds`, `aspectRatios`, and `tags`.
- `GenerationRequest` with `modelId`, `prompt`, `negativePrompt?`, `storyboard?`, `parameters` (duration, resolution, aspect ratio, seed, guidance, cameraMotion), and `metadata` (title, description).
- `GenerationJob` with `id`, `status`, `createdAt`, `updatedAt`, `progress`, and `resultAssetUrl`.

Ensure each hook documents the expected contract; for example, `useSubmitJob` returns `{ submit: (payload: GenerationRequest) => Promise<GenerationJob>; isSubmitting: boolean; error?: string; }` and emits status updates through polling utilities.

Note: This ExecPlan must be updated after every substantial change with new progress timestamps, discoveries, decisions, and retrospective entries to preserve a live view of the project.
