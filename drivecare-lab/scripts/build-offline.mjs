import { build } from 'esbuild';
import { copyFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');

await build({
  entryPoints: [resolve(root, 'src/main.tsx')],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2018'],
  jsx: 'automatic',
  outfile: resolve(dist, 'drivecare-demo.js'),
  loader: { '.css': 'css' }
});

await copyFile(resolve(root, 'public/logo.svg'), resolve(dist, 'logo.svg'));
await writeFile(resolve(dist, 'offline-demo.html'), `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#0b1117">
    <meta name="description" content="A clear, practical starting point for describing vehicle symptoms to a technician.">
    <title>DriveCare Lab — Smart service desk</title>
    <link rel="stylesheet" href="./drivecare-demo.css">
  </head>
  <body>
    <div id="root"></div>
    <script src="./drivecare-demo.js" defer></script>
  </body>
</html>
`);
