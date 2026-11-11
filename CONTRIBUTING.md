# Contributing

Thanks for helping. Small, focused pull requests are easiest to review.

## Setup

```bash
npm ci
npm run verify
```

`npm run verify` runs the typecheck and the production build.

## Tests

The engine/renderer suite (`tests/run.ts`) is maintained locally and is not
shipped in this repository. If you have a local checkout that includes it:

```bash
npm run verify:local   # typecheck + build + tests
```

Otherwise CI covers typecheck, build, and a stale-`dist` check.

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
Toei Animation, Shueisha, or Bird Studio. Original character skins are the
preferred direction for anything that needs to be distributable or monetized.

## Pull request checklist

- [ ] `npm run verify` passes
- [ ] README claims match the implementation
- [ ] No new native dependencies
