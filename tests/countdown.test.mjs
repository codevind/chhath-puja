import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('../src/utils/countdown.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
const { CHHATH_COUNTDOWN_TARGET: target, getCountdown } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

test('target is 15 November 2026 at 3:30 PM India time', () => {
  assert.equal(new Date(target).toISOString(), '2026-11-15T10:00:00.000Z');
});

test('breaks remaining time into days, hours, minutes and seconds', () => {
  assert.deepEqual(getCountdown(target - 90061000), { days: 1, hours: 1, minutes: 1, seconds: 1, complete: false });
});

test('stays at zero at and after the target', () => {
  for (const now of [target, target + 1000, target + 86400000]) {
    assert.deepEqual(getCountdown(now), { days: 0, hours: 0, minutes: 0, seconds: 0, complete: true });
  }
});
