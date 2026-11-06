#!/usr/bin/env node

// Turns Jest's coverage summary into a shields.io endpoint file, for the
// README's coverage badge: https://shields.io/badges/endpoint-badge
//
// Usage: node scripts/coverage-badge.js <coverage-summary.json> <output.json>
//
// The badge shows the lowest of the four totals (statements, branches,
// functions, lines), the same figures CI's 100% threshold checks.

const fs = require('fs');

const [input, output] = process.argv.slice(2);

if (!input || !output) {
  console.error('Usage: node scripts/coverage-badge.js <coverage-summary.json> <output.json>');
  process.exit(1);
}

const { total } = JSON.parse(fs.readFileSync(input, 'utf8'));
const pct = Math.min(...['statements', 'branches', 'functions', 'lines'].map(key => total[key].pct));

let color = 'red';
if (pct >= 100) color = 'brightgreen';
else if (pct >= 90) color = 'green';
else if (pct >= 80) color = 'yellow';
else if (pct >= 70) color = 'orange';

fs.writeFileSync(output, JSON.stringify({
  schemaVersion: 1,
  label: 'coverage',
  message: `${Math.floor(pct * 100) / 100}%`,
  color,
}) + '\n');

console.log(`Coverage badge: ${pct}% → ${output}`);
