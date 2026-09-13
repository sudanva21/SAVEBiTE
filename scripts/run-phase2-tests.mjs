import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createJiti } from 'jiti';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcPath = path.resolve(__dirname, '../src');

const jiti = createJiti(import.meta.url, {
  alias: {
    '@': srcPath,
    'server-only': path.resolve(__dirname, '../node_modules/server-only/empty.js'),
    'zod': path.resolve(__dirname, '../node_modules/zod/index.cjs'),
  },
});

async function main() {
  console.log('--- Starting SaveByte Phase 2 Authorization & Access Control Tests ---');
  
  const phase2Module = await jiti.import('../src/lib/__tests__/phase2-authorization.test.ts');
  const runPhase2Tests = phase2Module.runPhase2Tests;
  const phase2Results = await runPhase2Tests();

  let passed = 0;
  let failed = 0;

  for (const r of phase2Results) {
    if (r.status === 'PASS') {
      console.log(`[PASS] [Phase 2] ${r.name}`);
      passed++;
    } else {
      console.error(`[FAIL] [Phase 2] ${r.name} -> Error: ${r.error}`);
      failed++;
    }
  }

  console.log('\n--- Starting SaveByte Phase 3 Food Recovery Ecosystem Tests ---');
  const phase3Module = await jiti.import('../src/lib/__tests__/phase3-recovery.test.ts');
  const runPhase3Tests = phase3Module.runPhase3Tests;
  const phase3Results = await runPhase3Tests();

  for (const r of phase3Results) {
    if (r.status === 'PASS') {
      console.log(`[PASS] [Phase 3] ${r.name}`);
      passed++;
    } else {
      console.error(`[FAIL] [Phase 3] ${r.name} -> Error: ${r.error}`);
      failed++;
    }
  }

  console.log('\n--- Starting SaveByte Phase 4 Matching & Logistics Tests ---');
  const phase4Module = await jiti.import('../src/lib/__tests__/phase4-matching-logistics.test.ts');
  const runPhase4Tests = phase4Module.runPhase4Tests;
  const phase4Results = await runPhase4Tests();

  for (const r of phase4Results) {
    if (r.status === 'PASS') {
      console.log(`[PASS] [Phase 4] ${r.name}`);
      passed++;
    } else {
      console.error(`[FAIL] [Phase 4] ${r.name} -> Error: ${r.error}`);
      failed++;
    }
  }

  console.log('\n--- Starting SaveByte Phase 5 AI Intelligence Tests ---');
  const phase5Module = await jiti.import('../src/lib/__tests__/phase5-ai-intelligence.test.ts');
  const runPhase5Tests = phase5Module.runPhase5Tests;
  const phase5Results = await runPhase5Tests();

  for (const r of phase5Results) {
    if (r.status === 'PASS') {
      console.log(`[PASS] [Phase 5] ${r.name}`);
      passed++;
    } else {
      console.error(`[FAIL] [Phase 5] ${r.name} -> Error: ${r.error}`);
      failed++;
    }
  }

  console.log('\n--- Starting SaveByte Phase 6 Final Sprint Tests ---');
  const phase6Module = await jiti.import('../src/lib/__tests__/phase6-sprint.test.ts');
  const runPhase6Tests = phase6Module.runPhase6SprintTests;
  const phase6Results = await runPhase6Tests();

  for (const r of phase6Results) {
    if (r.status === 'PASS') {
      console.log(`[PASS] [Phase 6] ${r.name}`);
      passed++;
    } else {
      console.error(`[FAIL] [Phase 6] ${r.name} -> Error: ${r.error}`);
      failed++;
    }
  }

  const total = phase2Results.length + phase3Results.length + phase4Results.length + phase5Results.length + phase6Results.length;
  console.log('---------------------------------------------------------------------');
  console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log(`✓ All ${total} Phase 2, Phase 3, Phase 4, Phase 5, and Phase 6 Automated Tests PASSED cleanly!`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Test Runner Exception:', err);
  process.exit(1);
});
