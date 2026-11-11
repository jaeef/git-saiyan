import fs from 'node:fs';
import path from 'node:path';
import * as core from '@actions/core';
import { fetchUserContributions } from './api/github.js';
import type { SaiyanConfig, ContributionStats } from './api/types.js';
import { renderSvg } from './renderer/svg.js';
import { renderGif } from './renderer/gif.js';
import { calculateFormProgression } from './engine/forms.js';
import { applyProgression, loadState, saveState } from './state.js';

const DEFAULT_OUTPUTS = ['dist/saiyan.svg', 'dist/saiyan.gif'];

export async function runSaiyan(config: SaiyanConfig): Promise<ContributionStats> {
  const { username, token, outputs = DEFAULT_OUTPUTS, mock = false } = config;

  if (!username) {
    throw new Error('A GitHub username is required.');
  }

  console.log(`[git-saiyan] Summoning Goku for @${username}...`);
  const stats = await fetchUserContributions(username, token, mock, {
    commits: config.commits,
    streak: config.streak,
    form: config.form,
  });

  const previous = config.statePath ? loadState(config.statePath) : null;
  const { stats: progressed, state } = applyProgression(stats, previous);
  const { currentForm, nextForm, progressPercent } = calculateFormProgression(
    progressed.peakContributions
  );

  console.log(`[git-saiyan] Current Form: ${currentForm.name} (${currentForm.title})`);
  console.log(
    `[git-saiyan] Lifetime contributions: ${progressed.totalContributions.toLocaleString('en-US')} (peak ${progressed.peakContributions.toLocaleString('en-US')})`
  );
  console.log(`[git-saiyan] Power Level: ${progressed.powerLevel.toLocaleString('en-US')}`);
  console.log(
    `[git-saiyan] Streak: ${progressed.currentStreak} days (best ${progressed.bestStreak}) · Dragon Balls ${progressed.unlockedBalls}/7`
  );
  if (nextForm) {
    console.log(`[git-saiyan] Next Form: ${nextForm.name} (${progressPercent}%)`);
  }
  if (progressed.isMock) {
    console.log('[git-saiyan] Demo data in use. Pass a token (or unset --mock/--form) for live stats.');
  }
  if (progressed.lifetimeEstimated) {
    console.warn('[git-saiyan] Lifetime totals unavailable; form is based on the trailing year.');
  }

  for (const outPath of outputs) {
    const trimmedPath = outPath.trim();
    if (!trimmedPath) continue;

    const fullPath = path.resolve(process.cwd(), trimmedPath);
    const directory = path.dirname(fullPath);
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    if (trimmedPath.endsWith('.svg')) {
      const svg = renderSvg(progressed);
      fs.writeFileSync(fullPath, svg, 'utf-8');
      console.log(
        `[git-saiyan] Generated SVG: ${trimmedPath} (${(Buffer.byteLength(svg) / 1024).toFixed(1)} KB)`
      );
    } else if (trimmedPath.endsWith('.gif')) {
      const gifBytes = renderGif(progressed);
      fs.writeFileSync(fullPath, Buffer.from(gifBytes));
      console.log(
        `[git-saiyan] Generated GIF: ${trimmedPath} (${(gifBytes.byteLength / 1024).toFixed(1)} KB)`
      );
    } else {
      console.warn(`[git-saiyan] Unsupported format for output: ${trimmedPath}. Must be .svg or .gif`);
    }
  }

  if (config.statePath) {
    saveState(config.statePath, state);
    console.log(`[git-saiyan] Saved progression state: ${config.statePath}`);
  }

  return progressed;
}

// GitHub Actions entry point
export async function runAction(): Promise<void> {
  try {
    const token = core.getInput('github_token') || process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error('github_token is required. Pass secrets.GITHUB_TOKEN or a PAT.');
    }

    const username =
      core.getInput('github_user_name') ||
      process.env.GITHUB_REPOSITORY_OWNER ||
      process.env.GITHUB_ACTOR;
    if (!username) {
      throw new Error('Could not determine a GitHub username. Set github_user_name.');
    }

    const outputsInput = core.getInput('outputs') || DEFAULT_OUTPUTS.join('\n');
    const outputs = outputsInput
      .split(/[\n,]/)
      .map((value) => value.trim())
      .filter(Boolean);

    const statePath = core.getInput('state_file') || '.saiyan-state.json';

    await runSaiyan({ username, token, outputs, statePath });
  } catch (error) {
    core.setFailed(`[git-saiyan] Action failed: ${(error as Error).message}`);
  }
}
