#!/usr/bin/env node
/**
 * lint-structure.js — Structure validation for .agents/ folder
 * Verifies required files, folders, and nested requirements exist.
 */

import { existsSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const agentsDir = join(__dirname, '..');
const schemaPath = join(__dirname, 'structure-schema.json');

const { requiredFiles, requiredFolders, nestedRequirements } =
  JSON.parse(readFileSync(schemaPath, 'utf8'));

let hasErrors = false;

function check(path, type = 'file') {
  const exists = existsSync(path);
  const isCorrectType = exists && (type === 'file'
    ? statSync(path).isFile()
    : statSync(path).isDirectory());
  const status = isCorrectType ? 'OK  ' : 'MISS';
  if (!isCorrectType) hasErrors = true;
  const rel = relative(agentsDir, path).replace(/\\/g, '/');
  console.log(`  ${status}  ${rel}`);
}

console.log('Checking .agents/ structure...\n');

console.log('Required files:');
for (const file of requiredFiles) {
  check(join(agentsDir, file), 'file');
}

console.log('\nRequired folders + INDEX.md:');
for (const folder of requiredFolders) {
  check(join(agentsDir, folder), 'dir');
  if (folder !== 'scripts') {
    check(join(agentsDir, folder, 'INDEX.md'), 'file');
  }
}

console.log('\nNested requirements:');
for (const [parent, children] of Object.entries(nestedRequirements)) {
  for (const child of children) {
    const childPath = join(agentsDir, parent, child);
    check(childPath, 'dir');
    check(join(childPath, 'INDEX.md'), 'file');
  }
}

console.log('');
if (hasErrors) {
  console.error('Structure violations found. Create the missing files/folders.');
  process.exit(1);
} else {
  console.log('Structure is valid.');
}
