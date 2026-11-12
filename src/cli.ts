#!/usr/bin/env node
import { Command } from 'commander';
import dotenv from 'dotenv';
import { runSaiyan } from './index.js';
import { initProfileRepo } from './init.js';

dotenv.config();

/** Parse a non-negative integer CLI value; reject "12abc", "abc" and negatives. */
function parseCount(value: string): number {
  if (!/^\d+$/.test(value.trim())) {
    throw new Error(`Expected a non-negative integer, received "${value}".`);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    throw new Error(`Value "${value}" is too large.`);
  }
  return parsed;
}

const program = new Command();

program
  .name('git-saiyan')
  .description('A dynamic, contribution-driven Dragon Ball pixel-art companion for GitHub profiles')
  .version('1.3.0');

program
  .option('-u, --user <username>', 'GitHub username to query', process.env.GITHUB_ACTOR || 'octocat')
  .option(
    '-t, --token <token>',
    'GitHub Personal Access Token (defaults to GITHUB_TOKEN env var)',
    process.env.GITHUB_TOKEN
  )
  .option('-o, --output <paths...>', 'Output file paths (e.g., saiyan.svg or saiyan.gif)', [
    'dist/saiyan.svg',
    'dist/saiyan.gif',
  ])
  .option('-m, --mock', 'Use demo stats for testing without network requests', false)
  .option(
    '-f, --form <formId>',
    'Preview a specific form (kid, base, kaioken, ssj1, ssj2, ssj3, ssj4, ssjg, ssjb, mui)'
  )
  .option('-c, --commits <count>', 'Override lifetime contribution count', parseCount)
  .option('-s, --streak <days>', 'Override daily streak count', parseCount)
  .option('--state <path>', 'Persist peak XP / best streaks in this JSON file')
  .option('--streak-mode <mode>', 'Streak that drives the aura: daily or weekly', 'daily')
  .action(async (options) => {
    try {
      const preview =
        options.mock ||
        Boolean(options.form) ||
        options.commits !== undefined ||
        options.streak !== undefined;

      if (preview) {
        console.log('[git-saiyan] Preview mode: using demo data (no network request).');
      }

      await runSaiyan({
        username: options.user,
        token: options.token,
        outputs: Array.isArray(options.output) ? options.output : [options.output],
        mock: preview,
        form: options.form,
        commits: options.commits,
        streak: options.streak,
        statePath: options.state,
        streakMode: options.streakMode,
      });
      console.log('\n✨ Saiyan powered up successfully!');
    } catch (err) {
      console.error('[git-saiyan] Error:', (err as Error).message);
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Install the GitHub Action workflow into the current profile repository')
  .option('--force', 'Overwrite an existing workflow file', false)
  .option('--action-ref <ref>', 'Action reference to pin', 'jaeef/git-saiyan@v1')
  .action((options) => {
    try {
      const result = initProfileRepo({
        force: options.force,
        actionRef: options.actionRef,
      });
      console.log(`[git-saiyan] Wrote ${result.workflowPath}`);
      console.log('\nAdd this to your profile README:\n');
      console.log(result.readmeSnippet);
      console.log('\nThen run the workflow once from the Actions tab.');
    } catch (err) {
      console.error('[git-saiyan] Init failed:', (err as Error).message);
      process.exit(1);
    }
  });

program.parse(process.argv);
