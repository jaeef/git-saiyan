# Changelog

All notable changes to this project are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versioning follows [SemVer](https://semver.org/).

## [Unreleased]

### Added

- `docs/forms.svg`: all 10 forms with their contribution ranges, shown in the
  README (`npm run forms-sheet` regenerates it).
- `docs/setup.md`: step-by-step browser-only setup, private contributions,
  options, how updates work, and troubleshooting.

### Changed

- README setup is now a short browser-only quick start that links the guide.
- Workflows use `actions/checkout@v7` and `actions/setup-node@v7` (Node 24),
  which removes the Node.js 20 deprecation warning.

## [1.3.0] - 2026-11-12

### Added

- **New Goku art.** All 10 forms redrawn as shaded pixel art (128×120 canvas
  shown at 2×): hand-picked 4-tone ramps, 1px outlines, a distinct hair
  sculpt, palette and eyes per form (SSJ3 mane, SSJ4 red fur and tail, slimmer
  God build, Kid Goku on the cloud with tail and power pole), angled brows,
  two-tone eyes and clenched fists.
- **Ki-charge animation.** 8 frames of hair flutter, sash sway and breathing
  inside a pixel flame aura that grows with the streak, with rising ki
  particles and lightning on spark forms.
- **Tournament card layout.** Fighting-game HUD: form name plate with the
  next-form progress as a health bar, the streak as the round timer, power
  level as the score, an arena floor, 14-day ki bars and stage pips. The
  Dragon Balls orbit Goku in 3D. SVG and GIF share the same layout.
- **Power-up stages:** 3 stages inside each form (at one-third and two-thirds
  of the way to the next). Each stage grows the aura and adds hair and body
  glow.
- **Next-form countdown** ("super saiyan 3 in ~5 months") from the
  trailing-year pace.
- **Weekly streak mode:** `streak_mode` Action input / `--streak-mode` CLI
  flag. Counts Monday-Sunday weeks with at least one contribution; the best
  weekly streak is kept in the state file.
- Test suite (`tests/run.ts`, 38 tests) is part of the repository and runs in
  CI and `npm run verify`.
- Dev previews: `npm run gallery`, `npm run scenarios`, `npm run designs`,
  `npm run preview:art`.

### Changed

- **Dragon Balls are a yearly hunt** over the trailing 365 days (10 / 25 /
  50 / 100 / 200 / 350 / 500) instead of lifetime milestones; all 7 summon
  Shenron. Balls can be lost after a quiet year; forms never go down. Chosen
  after a study of 243 real widget users: the median user holds 5 balls and
  about a third summon Shenron each year.
- Card is 500×300 (was 500×280).
- The SVG embeds the character frames as small PNGs (crisp
  `image-rendering:pixelated`) and shows a still frame under
  `prefers-reduced-motion`.
- Base and Kid Goku auras are white with a blue edge.

### Fixed

- Lifetime totals no longer count private contributions twice (GitHub's
  calendar total already includes `restrictedContributionsCount`).
- `--form` with an unknown id fails with the list of valid forms instead of
  rendering a default card.
- Organization or unknown logins get the "set `github_user_name`" hint
  (GitHub reports them as a GraphQL error, so the hint was unreachable).
- The profile workflow compares the new card with the `output` branch, so it
  really skips the push on unchanged days.
- An empty state file (first workflow run) no longer logs a parse warning.
- GIF bitmap font: `N` and `W` no longer look like `M`; added `~`.

### Removed

- The `nova` skin, the skin registry, and the `skin` input / `--skin` flag.
  The project is Goku-only.
- The old hand-typed Goku sprites and the vector particle/aura code.

## [1.2.0] - 2026-11-11

### Added

- Skin system: `goku` (fan skin, default) and `nova` (original character).
- NOVA original character: hooded courier with visor/core glow, 10 original
  tiers (Ember → Zenith) sharing the Goku ladder thresholds exactly, so
  switching skins never changes progression.
- Nova relic set: 7 Nova Shards on the same milestone track, with skin-specific
  HUD naming (BALLS vs SHARDS) in SVG, GIF, logs and accessibility text.
- `skin` Action input and `--skin` CLI flag.

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
