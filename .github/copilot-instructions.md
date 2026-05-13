# Copilot Instructions — @openings-link/react

## Overview

Open-source React booking library for the [Openings](https://openings.link)
platform. Two packages:

- `@openings-link/react` — headless hooks, state machine, types (zero deps, React
  18+ peer)
- `@openings-link/react-ui` — themed, composable booking components built on the
  headless core

## Key Rules

- **Zero external dependencies** in `@openings-link/react`. Only React 18+ as a peer
  dep.
- **All API calls** go through `packages/react/src/api.ts` — plain `fetch`, no
  SDK.
- **Types are self-contained** — never import from external Openings packages.
  Define minimal types that mirror the Openings public API responses.
- The library talks to the Openings public API at `https://api.openings.link`.
- **No API keys** — the public API is open by business handle. Rate limiting is
  server-side.
- **CSS variables** for theming in `@openings-link/react-ui` (no Tailwind, no CSS
  modules).
- All CSS custom properties are prefixed `--openings-*`.
- **MIT licensed** — all code must be original.

## Package Structure

```
packages/
  react/           # @openings-link/react (headless core)
    src/
      api.ts       # fetch wrapper + API client interface
      context.tsx  # OpeningsProvider + BookingContext
      reducer.ts   # state + actions
      format.ts    # display formatting utilities
      types.ts     # public types
      hooks/       # individual hooks
      index.ts     # barrel export
  react-ui/        # @openings-link/react-ui (styled layer)
    src/
      BookingWidget.tsx   # drop-in widget
      theme.ts            # CSS variable system
      labels.ts           # i18n-ready label defaults
      components/         # step components
      index.ts
```

## Conventions

- Prefer `pnpm` for all commands.
- camelCase `.ts`/`.tsx` files, PascalCase for React component files.
- No dots in filenames except the final extension.
- Hooks follow React naming convention: `useXxx`.
- All hooks must be used within `<OpeningsProvider>`.

## Dev Commands

```bash
pnpm build        # build all packages
pnpm typecheck    # type check all packages
pnpm dev          # watch mode
```

## Branch, PR, and Release Flow

- Use PRs into `main` for code changes, including release version bumps.
- Repository merge mode is squash-only. After a squash merge, original branch
  commits will not be ancestors of `main`; this is expected.
- Treat local `main` as a clean mirror of `origin/main`. After merging a PR,
  preserve any local-only work on a branch before syncing local `main` to
  `origin/main`.
- It is normal to use `git branch -D <branch>` when deleting local branches whose
  changes were squash-merged; `git branch -d` may reject them because ancestry is
  not preserved.
- Merging and publishing are separate. Merging to `main` must not publish npm
  packages by itself.
- Publish only by pushing package tags after the matching version bump is already
  merged to `main` and checks are green:
  - `@openings-link/react@x.y.z`
  - `@openings-link/react-ui@x.y.z`
- Tags must point at the release commit on `main`; pushing those tags triggers
  the GitHub Actions `Release` workflow, which publishes to npm.

## Booking Flow Steps

`schedule → openings → review → verify → confirm`

The step machine enforces valid transitions. Back navigation is allowed.
Direct jumps are prevented.

## API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `GET /v1/salons/by-slug` | Resolve business by handle |
| `GET /v1/locations` | List bookable schedules |
| `GET /v1/locations/:id/detail` | Schedule details (members, services) |
| `GET /v1/openings/members` | Available time slots |
| `GET /v1/appointments/history/:phone` | Check returning customer |
| `POST /v1/verifications/send` | Send verification code |
| `POST /v1/verifications/verify` | Verify code |
| `POST /v1/customers/booking` | Create customer for booking |
| `POST /v1/appointments/create` | Create appointment |
