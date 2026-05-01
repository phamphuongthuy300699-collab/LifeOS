#!/usr/bin/env node
const fs = require('node:fs/promises');
const path = require('node:path');
const { build } = require('esbuild');

function shouldRun() {
  return process.env.VERCEL === '1';
}

function skipPath(src) {
  const normalized = src.replace(/\\/g, '/');
  return (
    normalized.includes('/node_modules/') ||
    normalized.includes('/.turbo/') ||
    normalized.endsWith('.tsbuildinfo')
  );
}

async function materializeScope(scopeDir) {
  let entries;
  try {
    entries = await fs.readdir(scopeDir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const dst = path.join(scopeDir, entry.name);
    let lst;
    try {
      lst = await fs.lstat(dst);
    } catch {
      continue;
    }

    if (!lst.isSymbolicLink()) continue;

    const src = await fs.realpath(dst);
    await fs.rm(dst, { recursive: true, force: true });
    await fs.cp(src, dst, {
      recursive: true,
      dereference: true,
      filter: (item) => !skipPath(item),
    });
    await buildRuntimeBundle(dst, src);
    // eslint-disable-next-line no-console
    console.log(`[materialize] ${dst} <= ${src}`);
  }
}

async function buildRuntimeBundle(pkgDir, sourceDir) {
  const entry = path.join(pkgDir, 'src', 'index.ts');
  try {
    await fs.access(entry);
  } catch {
    return;
  }

  const pkgJsonPath = path.join(pkgDir, 'package.json');
  let pkgJson;
  try {
    const raw = await fs.readFile(pkgJsonPath, 'utf8');
    pkgJson = JSON.parse(raw);
  } catch {
    pkgJson = {};
  }

  const workspaceExternals = [
    ...Object.keys(pkgJson.dependencies ?? {}),
    ...Object.keys(pkgJson.peerDependencies ?? {}),
    ...Object.keys(pkgJson.optionalDependencies ?? {}),
  ].filter((dep) => dep.startsWith('@lifeos/'));

  const outDir = path.join(pkgDir, 'dist');
  await fs.mkdir(outDir, { recursive: true });
  await build({
    entryPoints: [entry],
    outfile: path.join(outDir, 'index.js'),
    bundle: true,
    external: workspaceExternals,
    platform: 'node',
    format: 'cjs',
    target: 'node20',
    sourcemap: false,
    logLevel: 'silent',
    nodePaths: [
      path.join(sourceDir, 'node_modules'),
      path.join(process.cwd(), 'node_modules'),
      path.join(process.cwd(), 'apps', 'api', 'node_modules'),
      path.join(process.cwd(), 'apps', 'worker', 'node_modules'),
    ],
  });
  pkgJson.main = './dist/index.js';
  await fs.writeFile(pkgJsonPath, `${JSON.stringify(pkgJson, null, 2)}\n`, 'utf8');
}

async function main() {
  if (!shouldRun()) {
    return;
  }

  const roots = [
    path.join(process.cwd(), 'apps', 'api', 'node_modules', '@lifeos'),
    path.join(process.cwd(), 'apps', 'worker', 'node_modules', '@lifeos'),
  ];

  for (const root of roots) {
    await materializeScope(root);
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[materialize] failed', err);
  process.exitCode = 1;
});
