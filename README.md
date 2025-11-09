# Sora2 React Native App (Expo)

This repository contains a React Native application scaffolded for Expo that guides creators through watermark-free video generation with the Sora2 API. The app currently ships with domain logic, example UI state, typed API client wrappers, and a TDD suite that verifies catalog filtering, prompt validation, job tracking, and HTTP request formation.

## Project Goals

- Explore Sora2 models, mark favorites, and filter by capabilities.
- Build prompts with validation rules, storyboard steps, and reusable templates.
- Submit generation jobs, monitor their lifecycle, and review results.
- Surface notifications and configurable settings (theme, analytics, push alerts).
- Document how to run and test the Expo app locally before deploying.

## Repository Layout

```
App.tsx                 # Sample Expo screen hierarchy consuming the domain layer
src/api/sora2/          # Typed HTTP client and request/response contracts
src/domain/             # Pure functions for catalog, prompts, jobs, notifications, settings
src/services/           # Environment-agnostic services (API key persistence, etc.)
src/state/              # Aggregated app state helpers combining domain modules
tests/                  # Node-based test suites exercising the domain + API layers
planning/execplan.md    # Live ExecPlan with feature breakdown and progress tracking
```

## Local Development

1. **Install dependencies** (requires Node 18+):
   ```bash
   npm install
   ```

2. **Run the Expo development server**:
   ```bash
   npx expo start
   ```
   - Press `i` for the iOS Simulator (macOS with Xcode), `a` for Android Emulator, or scan the QR code with Expo Go on a physical device.
   - To reset caches, append `--clear` (e.g., `npx expo start --clear`).

3. **Platform-specific testing**:
   ```bash
   npx expo run:ios    # after configuring an iOS bundle identifier
   npx expo run:android
   npx expo start --web
   ```

4. **Environment variables**: create `.env.local` with your `OPENAI_API_KEY`. Expo exposes variables via `app.config.js` or `app.json` (not yet included in this scaffold). Never commit API keys.

5. **Secure storage**: in production builds wire `expo-secure-store` inside a concrete implementation of `ApiKeyStorage` (see `src/services/apiKeyStorage.ts`).

## Testing & Quality Gates

This project favors TDD—domain rules are encoded as pure functions with deterministic tests.

```bash
npm test      # Compile TypeScript to dist/ then run Node test runner suites
npm run lint  # Type-checks the project (alias for npm run typecheck)
npm run typecheck
```

The Node-based tests verify:
- Model catalog filtering, favorites, and summary statistics.
- Prompt template CRUD + validation constraints.
- Job tracker lifecycle and timeline events.
- HTTP requests built by the Sora2 client, including error handling.

## Generating Videos with Sora2

1. Store your API key securely (during development you can inject it via `.env.local` or the Expo secrets manager).
2. Use the UI prompt builder to craft prompts and parameters; validation ensures supported guidance ranges and storyboard sizes.
3. Submit the request—the API client in `src/api/sora2/client.ts` issues authenticated POST requests to `/generations` and polls status endpoints.
4. When a job completes, the job tracker aggregates events so notifications and history screens stay in sync.

A dedicated integration screen that streams the generated asset with `expo-av` should be built once real Sora2 credentials are available.

## Mocking & Offline Workflows

- The domain layer is framework agnostic and easy to unit test without network access.
- Inject a custom `fetchImpl` into `Sora2Client` for mocking API responses during offline development or storybook scenarios.
- The ExecPlan (`planning/execplan.md`) must be updated whenever progress is made so stakeholders can follow along asynchronously.

## Deployment Notes

- Configure icons, splash screens, and bundle identifiers in `app.json` / `app.config.js` before building.
- Run `npx expo-doctor` and `npx expo prebuild` to validate native project health ahead of EAS builds.
- For store releases, prepare privacy policies that explain Sora2 usage and any analytics you enable.

## Contributing

1. Keep the ExecPlan progress table and checklists in sync with your commits.
2. Add or update tests before changing domain logic to preserve TDD guarantees.
3. Avoid committing secrets or generated assets; use `.gitignore` for protection.
4. Run `npm test` and `npm run lint` prior to opening a PR.

## License

MIT
