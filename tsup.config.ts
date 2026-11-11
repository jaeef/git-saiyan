import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    action: 'src/action.ts',
    cli: 'src/cli.ts',
  },
  format: ['cjs'],
  outDir: 'dist',
  target: 'node22',
  clean: true,
  noExternal: [/@actions\/.*/, /@octokit\/.*/, 'gifenc', 'commander', 'dotenv'],
  minify: false,
  sourcemap: false,
});
