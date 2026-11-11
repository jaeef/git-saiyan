# Changelog

All notable changes to this project are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versioning follows [SemVer](https://semver.org/).

## [1.1.0] - 2026-11-10

### Changed

- Forms now use **lifetime** contribution totals instead of a rolling 12-month
  window; progression is persisted in `.saiyan-state.json` and can never regress.
- Dragon Balls are decoupled from forms and unlock on their own lifetime track:
  1 / 100 / 500 / 1,500 / 3,000 / 5,000 / 7,000.
- The SVG card animates with SMIL (`animateTransform` + `animate`), including
  depth-scaled Dragon Ball orbit and rising Ki particles.
- Dragon Ball stars render as legible vector marks; balls are depth-sorted
  behind/in front of Goku.
- The GIF now carries the same HUD (header, form name, streak, 14-day bars)
  using a 3×5 bitmap font and one shared palette.
- Action runtime upgraded to Node 24 (`engines.node >=22`).
- Power level is computed from disjoint lifetime inputs and kept monotonic.
- Workflow publishes the card to an `output` branch so profile history stays
  clean, with state restored from that branch each run.
- Demo assets moved from `dist/` to `assets/` (tsup `clean` deletes `dist`).

### Fixed

- Streak no longer breaks on future-padded calendar days; today/yesterday grace.
- API errors fail the run loudly instead of silently committing mock data.
- State file rejects corrupt/partially malformed JSON and writes atomically.
- SVG layout overflow (14-day bars) fixed; pixel art stays on integer scales.
- Power level no longer double counts PRs and reviews.

### Added

- `git-saiyan init` workflow installer and README snippet builder.
- CI (Node 22/24: typecheck, build, stale-`dist` check), Dependabot, MIT
  license, contributing guide, and this changelog.
- 20-test local suite (maintained outside the published repository) covering
  engine, renderer, state and installer logic.

## [1.0.0] - 2026-11-09

- Initial pitch implementation: contribution-driven Goku card as SVG + GIF,
  10-form ladder, Dragon Ball orbit, Kaio-ken streak aura, GitHub Action.
