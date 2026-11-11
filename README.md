<div align="center">

# git-saiyan

**Turn your GitHub contributions into a Dragon Ball pixel-art card.**

Streaks drive a Ki aura. Lifetime contributions drive a 10-level
transformation ladder. Milestones unlock the 7 Dragon Balls.

![GitHub Action](https://img.shields.io/badge/GitHub_Action-node24-2088FF?logo=github-actions&logoColor=white)
![Node](https://img.shields.io/badge/node-%3E%3D22-339933?logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green.svg)

Animated **SVG** (SMIL) + **GIF** · zero Docker · zero native modules

</div>

## Features

- **Lifetime progression.** Forms are based on career contribution totals, not a rolling 12-month window. A persisted state file makes progression monotonic: old commits aging out never demote you.
- **10 transformation levels.** Kid Goku through Ultra Instinct, built on 3 base sprites (kid, adult, long-maned) with per-form hair, eye, and palette variants.
- **7 Dragon Balls.** Unlocked on an independent lifetime track (1 / 100 / 500 / 1,500 / 3,000 / 5,000 / 7,000 contributions) and rendered in a depth-scaled orbit.
- **Streak-driven aura.** Committing today or yesterday keeps the streak alive. Future days that GitHub pads into the calendar are ignored.
- **Two output formats.** An animated SVG (SMIL, with real text and vector stars) and an 8-frame GIF with the same HUD for platforms that don't render SVG.
- **Transparent scoring.** Power level is `commits × 10 + PRs × 30 + reviews × 20 + best streak × 50`, computed from disjoint lifetime inputs.

## Progression tables

Forms unlock at lifetime contribution totals:

| Level | Form | Saga | Contributions |
| :---: | :--- | :--- | ---: |
| 1 | Kid Goku | Dragon Ball (Early) | 0 – 49 |
| 2 | Base Goku | Saiyan Saga | 50 – 149 |
| 3 | Kaio-ken | Namek Saga | 150 – 299 |
| 4 | Super Saiyan | Frieza Saga | 300 – 599 |
| 5 | Super Saiyan 2 | Cell Games | 600 – 999 |
| 6 | Super Saiyan 3 | Majin Buu Saga | 1,000 – 1,749 |
| 7 | Super Saiyan 4 | Dragon Ball GT | 1,750 – 2,999 |
| 8 | Super Saiyan God | Battle of Gods | 3,000 – 4,499 |
| 9 | Super Saiyan Blue | Resurrection F / Future Trunks | 4,500 – 6,999 |
| 10 | Ultra Instinct | Tournament of Power | 7,000+ |

Dragon Balls unlock independently:

| Ball | 1★ | 2★ | 3★ | 4★ | 5★ | 6★ | 7★ |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Lifetime contributions | 1 | 100 | 500 | 1,500 | 3,000 | 5,000 | 7,000 |

Aura tiers by current streak:

| Streak | Aura |
| :--- | :--- |
| 0 – 2 days | Calm idle |
| 3 – 6 days | Flaring Ki |
| 7 – 13 days | Super flare + lightning |
| 14+ days | Hyper storm |

## Setup

> The card is generated from this repository's Action, pinned with a `v1` tag.
> Make sure the tag exists before relying on the workflow.

### 1. Install the workflow

After building this repository locally (`npm ci && npm run build`), scaffold the
workflow into the current profile repository:

```bash
node dist/cli.js init
```

Or create `.github/workflows/saiyan.yml` manually in your profile repository (`username/username`):

```yaml
name: Update Git Saiyan

on:
  schedule:
    - cron: '0 0 * * *'
  workflow_dispatch:

permissions:
  contents: write

concurrency:
  group: git-saiyan
  cancel-in-progress: true

jobs:
  power-up:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Restore progression state
        run: |
          git fetch origin output --depth=1 || true
          git show origin/output:.saiyan-state.json > .saiyan-state.json 2>/dev/null || true

      - name: Run git-saiyan
        uses: jaeef/git-saiyan@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          outputs: |
            dist/saiyan.svg
            dist/saiyan.gif
          state_file: .saiyan-state.json

      - name: Publish to output branch
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add -f dist/saiyan.svg dist/saiyan.gif .saiyan-state.json
          if git diff --staged --quiet; then
            echo "No card changes today."
          else
            git commit -m "chore: power up Goku [skip ci]"
            git push origin HEAD:output --force
          fi
```

### 2. Embed the card

The Action publishes to an `output` branch so your profile commit history stays clean. Replace `USERNAME` with your GitHub login:

```markdown
<div align="center">
  <img src="https://raw.githubusercontent.com/USERNAME/USERNAME/output/dist/saiyan.svg" width="500" alt="My git-saiyan card" />
</div>
```

Run the workflow once from the Actions tab to generate the first card.

### Private contributions

The repository `GITHUB_TOKEN` cannot see private contributions. To include them, create a personal access token, add it as a repository secret (for example `SAIYAN_PAT`), and pass it instead:

```yaml
github_token: ${{ secrets.SAIYAN_PAT }}
```

## Action inputs

| Input | Required | Default | Description |
| :-- | :---: | :-- | :-- |
| `github_token` | no | `${{ github.token }}` | Token for contribution queries. Use a PAT for private contributions. |
| `github_user_name` | no | Repository owner | GitHub user to render. Must be a user, not an organization. |
| `outputs` | no | `dist/saiyan.svg`, `dist/saiyan.gif` | Output paths, newline- or comma-separated. `.svg` and `.gif` are supported. |
| `state_file` | no | `.saiyan-state.json` | Persisted progression. Commit it with the card. |

## State file

`.saiyan-state.json` stores `peakContributions`, `unlockedBalls`, `bestStreak`, and `powerLevel`. Each run takes the maximum of live stats and the stored values, so progression can only advance. The file is written atomically and its timestamp only changes when a value changes, so unchanged days produce no commit.

Keep the state file single-writer. The generated workflow already uses a `concurrency` group.

## CLI

Run from this repository after `npm ci && npm run build` (or use `npm start --`):

```bash
# Live card (requires a token)
GITHUB_TOKEN=ghp_... node dist/cli.js --user your-name

# Offline demo
node dist/cli.js --mock

# Preview a specific form
node dist/cli.js --form mui
node dist/cli.js --form ssj3

# Simulate a career and persist progression
node dist/cli.js --commits 7200 --streak 21 --state .saiyan-state.json

# Install the profile workflow
node dist/cli.js init
```

| Flag | Description | Default |
| :-- | :-- | :-- |
| `-u, --user <username>` | GitHub username to inspect | `octocat` |
| `-t, --token <token>` | GitHub token (or `GITHUB_TOKEN` env) | `$GITHUB_TOKEN` |
| `-o, --output <paths...>` | Output destinations (`.svg` / `.gif`) | `dist/saiyan.svg dist/saiyan.gif` |
| `-m, --mock` | Generate demo stats offline | `false` |
| `-f, --form <formId>` | Preview one form (implies demo data) | — |
| `-c, --commits <count>` | Override lifetime contributions | — |
| `-s, --streak <days>` | Override current streak | — |
| `--state <path>` | Persist progression | disabled |

`--form`, `--commits`, and `--streak` always use demo data. Live rendering requires a token and fails loudly on API errors instead of falling back to mock output.

## How it works

1. **Fetch.** One GraphQL query reads the trailing-year contribution calendar; a second aliased query sums per-year totals for lifetime counts, commits, PRs, and reviews.
2. **Progress.** Live stats are merged with the state file under max operations.
3. **Render.** The SVG uses SMIL animations (orbit, depth scaling, particles) plus CSS for idle motion, and honors `prefers-reduced-motion`. The GIF uses a 3×5 bitmap font and one shared 256-color palette across 8 frames.

```
src/
├── api/         GraphQL client and shared types
├── assets/      pixel sprites and Dragon Ball geometry
├── engine/      activity, forms, dragon balls, aura rules
├── renderer/    svg, gif, bitmap font, particles
├── types/       ambient module declarations
├── action.ts    Action entry point
├── cli.ts       CLI entry point
├── index.ts     render pipeline and Action logic
├── init.ts      workflow installer
└── state.ts     progression persistence
```

## Development

```bash
npm ci
npm run verify        # typecheck + build
npm run verify:local  # typecheck + build + tests
npm start -- --mock   # demo card into dist/
```

The engine and renderer test suite is maintained locally and is not published with this repository. CI runs typecheck, build, and verifies that committed `dist/` matches `src/`. `dist/` is committed because the Action needs `dist/action.js` at the tagged ref.

## License and trademark notice

The code is licensed under the [MIT License](./LICENSE).

Dragon Ball is a trademark of Bird Studio / Shueisha / Toei Animation. This is an unofficial fan project and is not affiliated with or endorsed by the rights holders. The MIT license covers the code, not the character art. Do not list this project on a marketplace or use it commercially without permission. Rights holders may request removal of the character assets.

Inspired by [Platane/snk](https://github.com/Platane/snk) and [yalongwastaken/git-koi](https://github.com/yalongwastaken/git-koi).
