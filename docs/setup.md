# Setup guide

This guide puts a git-saiyan card on your GitHub profile. Everything happens in
the browser; you don't need to install anything. It takes about 5 minutes.

- [1. Create your profile repository](#1-create-your-profile-repository)
- [2. Add the workflow](#2-add-the-workflow)
- [3. Run it once](#3-run-it-once)
- [4. Show the card on your profile](#4-show-the-card-on-your-profile)
- [5. Count private contributions](#5-count-private-contributions)
- [Options](#options)
- [How updates work](#how-updates-work)
- [Troubleshooting](#troubleshooting)
- [Run it locally (optional)](#run-it-locally-optional)

## 1. Create your profile repository

Your profile README lives in a public repository with **the same name as your
username**: `USERNAME/USERNAME`.

1. Go to <https://github.com/new>.
2. Set **Repository name** to your username, exactly.
3. Choose **Public** and tick **Add a README file**.
4. Click **Create repository**.

If you already see your README on your profile page, the repository exists;
skip to step 2.

## 2. Add the workflow

1. Open `https://github.com/USERNAME/USERNAME/new/main`. Or open the repository,
   click **Add file** (next to the green **Code** button), then **Create new file**.
2. In the name box (between `USERNAME /` and `in main`), type:

   ```
   .github/workflows/saiyan.yml
   ```

   Each `/` turns the part before it into a folder. That's expected.

3. Paste this into the editor. Use the copy button so the indentation stays
   exact:

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
         - name: Checkout profile repository
           uses: actions/checkout@v7

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
             # streak_mode: weekly   # optional: count weeks instead of days

         - name: Publish generated card to the output branch
           run: |
             git config user.name "github-actions[bot]"
             git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
             git add -f dist/saiyan.svg dist/saiyan.gif .saiyan-state.json
             if git rev-parse --verify --quiet origin/output >/dev/null && git diff --staged --quiet origin/output -- dist/saiyan.svg dist/saiyan.gif .saiyan-state.json; then
               echo "No card changes today."
             else
               git commit -m "chore: power up Goku [skip ci]"
               git push origin HEAD:output --force
             fi
   ```

4. Click **Commit changes…**, keep **Commit directly to the `main` branch**,
   and click **Commit changes**.

## 3. Run it once

The workflow runs every night by itself. Run it once now to create the first
card:

1. Open `https://github.com/USERNAME/USERNAME/actions/workflows/saiyan.yml`.
   Or click **Actions**, then **Update Git Saiyan** in the left sidebar.
2. In the blue bar, click **Run workflow ▾**, then the green **Run workflow**.
3. Refresh after a few seconds. The run shows a yellow dot, then a green ✅
   after about 15 seconds.

The run creates a branch called `output` that holds your card. Your `main`
branch history stays clean.

## 4. Show the card on your profile

1. Open `https://github.com/USERNAME/USERNAME/blob/main/README.md` and click
   the ✏️ pencil.
2. Paste this where you want the card, with your username in both places:

   ```markdown
   <p align="center">
     <img src="https://raw.githubusercontent.com/USERNAME/USERNAME/output/dist/saiyan.svg" width="500" alt="My git-saiyan card" />
   </p>
   ```

3. Commit directly to `main`, then open `https://github.com/USERNAME`.

## 5. Count private contributions

The Action's built-in token only sees what the public sees. If most of your
work is in private repositories, your card shows a lower form than you expect.

**Option A (recommended, no token):** turn on the profile setting.

1. Go to <https://github.com/settings/profile>.
2. Under **Contributions & activity**, tick **Include private contributions on
   my profile**, then click **Update preferences**.
3. Run the workflow again (step 3).

Visitors then see how many private contributions you made, as anonymous
squares. They don't see repository names or code.

**Option B: use a personal access token** (if Option A isn't enough).

1. Go to <https://github.com/settings/tokens> → **Generate new token
   (classic)**. Tick `repo` and `read:user`, then copy the token.
2. In your profile repository, go to **Settings → Secrets and variables →
   Actions → New repository secret**. Name it `SAIYAN_PAT` and paste the token.
3. In `saiyan.yml`, change `github_token: ${{ secrets.GITHUB_TOKEN }}` to
   `github_token: ${{ secrets.SAIYAN_PAT }}`.

Never put the token itself in a file, README, or issue; only in the secret.

## Options

Set these under `with:` in `saiyan.yml`:

| Input | Default | What it does |
| :-- | :-- | :-- |
| `github_token` | `${{ github.token }}` | Token used to read your contributions. |
| `github_user_name` | Repository owner | The user to draw. Must be a person, not an organization. |
| `outputs` | `dist/saiyan.svg` and `dist/saiyan.gif` | Files to write, one per line. `.svg` and `.gif` are supported. |
| `state_file` | `.saiyan-state.json` | Saved progress, so your form never goes down. |
| `streak_mode` | `daily` | `daily`: days in a row. `weekly`: weeks with at least one contribution. Good if you don't code every day. |

To show the GIF instead of the SVG (for places that don't play SVG
animations), use `output/dist/saiyan.gif` in the image link.

## How updates work

- The workflow runs every night at 00:00 UTC. GitHub can delay scheduled runs
  by a few minutes.
- Your **form** comes from lifetime contributions and never goes down.
- Your **aura** follows your current streak.
- Your **Dragon Balls** come from the last 365 days, so they can be lost after
  a quiet year.
- On a day when nothing changed, the workflow skips the push, so the `output`
  branch doesn't fill up with empty commits.

GitHub scheduled workflows pause after 60 days without activity in the
repository. If your card stops updating, run the workflow once by hand or
make any commit to the profile repository.

## Troubleshooting

| What you see | Why | Fix |
| :-- | :-- | :-- |
| No **Run workflow** button | You're on **All workflows** | Click **Update Git Saiyan** in the left sidebar. |
| 404 when opening a run right after starting it | GitHub is still preparing the page | Wait a few seconds and refresh. |
| `fatal: couldn't find remote ref output` in the log | First run: there's no saved card yet | Nothing. The run still succeeds and creates `output`. |
| Card shows a lower form than expected | Private contributions aren't counted | See [step 5](#5-count-private-contributions). |
| Profile still shows the old card | GitHub caches images for a few minutes | Wait, then refresh. |
| Broken image on your profile | No successful run yet, or a typo in the link | Run the workflow; check both usernames in the link. |
| `GitHub user @… was not found` | The repository belongs to an organization | Set `github_user_name: your-username` under `with:`. |
| Run fails at the publish step with a permission error | The workflow can't write to the repository | Keep `permissions: contents: write` in the file, and under **Settings → Actions → General → Workflow permissions** choose **Read and write**. |
| Warning: "Node.js 20 is deprecated" | An old `actions/checkout` version | Use `actions/checkout@v7` as shown above. |

## Run it locally (optional)

For trying forms or developing git-saiyan itself:

```bash
git clone https://github.com/jaeef/git-saiyan.git
cd git-saiyan
npm ci
npm run build
node dist/cli.js --mock              # demo card into dist/
node dist/cli.js --form ssj3         # preview one form
GITHUB_TOKEN=... node dist/cli.js --user your-name   # your real card
```

See the [CLI flags](../README.md#cli) in the README.
