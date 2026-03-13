#!/usr/bin/env node
/**
 * lint-docs.js — Token limit validation for .agents/ documentation
 * Checks that each doc file stays within its token budget.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative, basename } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const agentsDir = join(__dirname, '..');
const schemaPath = join(__dirname, 'structure-schema.json');

const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
const { tokenLimits } = schema;

// Rough token estimator: ~4 chars per token
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

function getLimit(filePath) {
  const rel = relative(agentsDir, filePath).replace(/\\/g, '/');
  const name = basename(filePath);

  if (name === 'AI-INSTRUCTIONS.md') return tokenLimits['AI-INSTRUCTIONS.md'];
  if (name === 'product-overview.md') return tokenLimits['product-overview.md'];
  if (name === 'project-overview.md') return tokenLimits['project-overview.md'];
  if (name === 'INDEX.md') return tokenLimits['**/INDEX.md'];
  if (rel.startsWith('operations/')) return tokenLimits['operations/*.md'];
  if (rel.startsWith('reference/')) return tokenLimits['reference/*.md'];
  if (rel.startsWith('architecture/')) return tokenLimits['architecture/*.md'];
  return null;
}

function walkMd(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === '.scratch' || entry === 'scripts') continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walkMd(full, files);
    } else if (entry.endsWith('.md')) {
      files.push(full);
    }
  }
  return files;
}

const mdFiles = walkMd(agentsDir);
let hasErrors = false;

console.log('Checking .agents/ token limits...\n');

for (const file of mdFiles) {
  const content = readFileSync(file, 'utf8');
  const tokens = estimateTokens(content);
  const limit = getLimit(file);
  const rel = relative(agentsDir, file).replace(/\\/g, '/');

  if (limit === null) {
    console.log(`  SKIP  ${rel} (no limit defined)`);
    continue;
  }

  const status = tokens <= limit ? 'OK  ' : 'FAIL';
  if (tokens > limit) hasErrors = true;

  console.log(`  ${status}  ${rel} — ${tokens}/${limit} tokens`);
}

console.log('');
if (hasErrors) {
  console.error('Token limit violations found. Reduce file sizes before committing.');
  process.exit(1);
} else {
  console.log('All files within token limits.');
}
