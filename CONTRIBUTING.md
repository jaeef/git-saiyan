# Contributing

Thanks for helping. Small, focused pull requests are easiest to review.

## Setup

```bash
npm ci
npm run verify
```

`npm run verify` runs the typecheck, the test suite, and the production build.

## Tests

The engine/renderer suite lives in `tests/run.ts` and runs with `npm test`.
CI runs it on every push and pull request, together with a stale-`dist` check.
Add a test for every behavior change.

## Ground rules

- **No committed secrets or generated state.** `.saiyan-state.json` is local.
- **Keep progression monotonic.** A user must never lose a form or a Dragon Ball
  because old commits aged out of the GitHub window.
- **Never commit mock data on an API failure.** Fail the run instead.
- **SVG is the primary output.** The GIF must stay a visual peer, not a
  degraded copy.
- **Pixel art stays on integer scales.** Fractional scales blur the sprites.

## IP

This is an unofficial fan project. Do not add assets that imply endorsement by
Toei Animation, Shueisha, or Bird Studio. Keep the project non-commercial.

## Pull request checklist

- [ ] `npm run verify` passes
- [ ] README claims match the implementation
- [ ] No new native dependencies
