#!/usr/bin/env node
/**
 * Runs an expo command with the shipped ("lite") build variant.
 *
 * Exists because `EXPO_PUBLIC_APP_VARIANT=lite expo start` isn't valid syntax
 * in an npm script on Windows, and cross-env would be another dependency for
 * something this small.
 *
 *   npm run start:lite      -> expo start  --clear, as the published app
 *   npm run export:lite     -> expo export --platform android
 *
 * Any extra args are forwarded:  npm run start:lite -- --tunnel
 */
const { spawn } = require('child_process');

const args = process.argv.slice(2);
if (args.length === 0) args.push('start', '--clear');

const child = spawn('npx', ['expo', ...args], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, EXPO_PUBLIC_APP_VARIANT: 'lite' },
});

child.on('exit', (code) => process.exit(code ?? 0));
