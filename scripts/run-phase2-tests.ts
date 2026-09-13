import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function main() {
  const { runPhase2Tests } = await import('../src/lib/__tests__/phase2-authorization.test');
  console.log('--- Starting SaveByte Phase 2 Authorization & Access Control Tests ---');
  const results = await runPhase2Tests();

  let passed = 0;
  let failed = 0;

  for (const r of results) {
    if (r.status === 'PASS') {
      console.log(`[PASS] ${r.name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${r.name} -> Error: ${r.error}`);
      failed++;
    }
  }

  console.log('---------------------------------------------------------------------');
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('✓ All Phase 2 Authorization & Security Tests PASSED cleanly!');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Test Runner Exception:', err);
  process.exit(1);
});
