import fs from 'node:fs';
import path from 'node:path';

export interface InitOptions {
  force?: boolean;
  actionRef?: string;
  cwd?: string;
}

export interface InitResult {
  workflowPath: string;
  readmeSnippet: string;
}

export const DEFAULT_ACTION_REF = 'jaeef/git-saiyan@v1';

export function buildWorkflow(actionRef: string = DEFAULT_ACTION_REF): string {
  return `name: Update Git Saiyan

on:
  schedule:
    # Nightly at 00:00 UTC. GitHub may delay scheduled runs by a few minutes.
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
        uses: actions/checkout@v4

      - name: Restore progression state
        run: |
          git fetch origin output --depth=1 || true
          git show origin/output:.saiyan-state.json > .saiyan-state.json 2>/dev/null || true

      - name: Run git-saiyan
        uses: ${actionRef}
        with:
          github_token: \${{ secrets.GITHUB_TOKEN }}
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
          # Compare with the published branch, not with main: the card files never
          # exist on main, so a plain staged diff would report a change every day.
          if git rev-parse --verify --quiet origin/output >/dev/null && git diff --staged --quiet origin/output -- dist/saiyan.svg dist/saiyan.gif .saiyan-state.json; then
            echo "No card changes today."
          else
            git commit -m "chore: power up Goku [skip ci]"
            git push origin HEAD:output --force
          fi
`;
}

export function buildReadmeSnippet(username = 'USERNAME'): string {
  return `<div align="center">
  <img src="https://raw.githubusercontent.com/${username}/${username}/output/dist/saiyan.svg" width="500" alt="My git-saiyan card" />
</div>`;
}

export function initProfileRepo(options: InitOptions = {}): InitResult {
  const cwd = options.cwd ?? process.cwd();
  const workflowPath = path.join(cwd, '.github', 'workflows', 'saiyan.yml');

  if (fs.existsSync(workflowPath) && !options.force) {
    throw new Error(`${workflowPath} already exists. Re-run with --force to overwrite it.`);
  }

  fs.mkdirSync(path.dirname(workflowPath), { recursive: true });
  fs.writeFileSync(workflowPath, buildWorkflow(options.actionRef ?? DEFAULT_ACTION_REF), 'utf-8');

  return {
    workflowPath,
    readmeSnippet: buildReadmeSnippet(),
  };
}
