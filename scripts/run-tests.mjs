import { spawnSync } from 'node:child_process';
import { globSync } from 'node:fs';

const files = globSync('tests/**/*.test.js');

if (files.length === 0) {
  console.error('No test files found');
  process.exit(1);
}

const result = spawnSync(process.execPath, ['--test', ...files], {
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
