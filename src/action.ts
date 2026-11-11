import { runAction } from './index.js';

// Dedicated Action entry point. Keeping the auto-run here (instead of in the
// library module) means the CLI bundle does not execute the Action twice when
// it runs inside GitHub Actions.
runAction();
