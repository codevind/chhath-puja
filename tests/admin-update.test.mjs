import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { test } from 'node:test';

function backend() {
  // Deliberately reordered headers verify writes use column names.
  const rows = [
    ['Status', 'Amount', 'Name', 'Receipt ID', 'Time', 'Date', 'Other'],
    ['pending', 250, 'Original', 'CPS-existing', '09:15:00', '13/11/2026', 'preserve me'],
  ];
  const properties = new Map([['ADMIN_USER_ID', 'admin'], ['ADMIN_PASSWORD', 'secret'], ['session:valid', 'admin']]);
  const cache = new Map();
  const range = (row, column, height = 1, width = 1) => ({
    getDisplayValues: () => rows.slice(row - 1, row - 1 + height).map((values) => values.slice(column - 1, column - 1 + width).map((value) => String(value).replace(/^'/, ''))),
    setValue: (value) => { rows[row - 1][column - 1] = value; },
    createTextFinder: (text) => ({ matchEntireCell: () => {
      const findAll = () => rows.slice(row - 1, row - 1 + height).flatMap((values, index) => values[column - 1] === text ? [{ getRow: () => row + index }] : []);
      return { findAll, findNext: () => findAll()[0] ?? null };
    } }),
  });
  const sheet = { getLastRow: () => rows.length, getLastColumn: () => rows[0].length, getRange: range, appendRow: (values) => rows.push(Array.from(values)) };
  const context = vm.createContext({
    PropertiesService: { getScriptProperties: () => ({ getProperty: (key) => properties.get(key), setProperty: (key, value) => properties.set(key, value) }) },
    CacheService: { getScriptCache: () => ({ get: (key) => cache.get(key), put: (key, value) => cache.set(key, value) }) },
    Utilities: { formatDate: (_date, timezone, format) => { assert.equal(timezone, 'Asia/Kolkata'); return format === 'dd/MM/yyyy' ? '13/11/2026' : '12:34:56'; } },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    SpreadsheetApp: { openById: () => ({ getSheetById: () => sheet }), flush() {} },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (text) => ({ setMimeType: () => JSON.parse(text) }) },
  });
  vm.runInContext(readFileSync(new URL('../google-apps-script/Admin.gs', import.meta.url), 'utf8'), context);
  return { rows, call: (body) => context.doPost({ postData: { contents: JSON.stringify(body) } }) };
}

const update = { action: 'update', token: 'valid', receiptId: 'CPS-existing', requestId: '12345678-1234-1234-1234-123456789abc', name: 'Updated', amount: 500, status: 'done' };

test('updates the existing row and preserves identity, timestamp and unrelated cells', () => {
  const api = backend();
  const result = api.call(update);
  assert.equal(result.ok, true);
  assert.equal(result.receiptId, 'CPS-existing');
  assert.equal(result.date, '13/11/2026');
  assert.equal(result.time, '09:15:00');
  assert.deepEqual(api.rows[1], ['done', 500, 'Updated', 'CPS-existing', '09:15:00', '13/11/2026', 'preserve me']);
  assert.equal(api.call(update).ok, true); // Retrying cannot append another row.
  assert.equal(api.rows.length, 2);
});

test('rejects missing auth, invalid fields and unknown receipt IDs without changing data', () => {
  for (const changes of [{ token: '' }, { amount: -1 }, { status: 'invalid' }, { receiptId: 'missing' }, { name: ' ' }]) {
    const api = backend();
    const original = JSON.stringify(api.rows);
    assert.equal(api.call({ ...update, ...changes }).ok, false);
    assert.equal(JSON.stringify(api.rows), original);
  }
});

test('escapes spreadsheet formulas in names', () => {
  const api = backend();
  assert.equal(api.call({ ...update, name: '=1+1' }).ok, true);
  assert.equal(api.rows[1][2], "'=1+1");
});

test('public donation requires no login and always saves Verify even with forged done status', () => {
  const api = backend();
  const result = api.call({ ...update, action: 'donate', token: undefined, status: 'done' });
  assert.equal(result.ok, true);
  assert.equal(result.receiptId, 'CPS-' + update.requestId);
  assert.deepEqual(api.rows[2], ['Verify', 500, 'Updated', result.receiptId, '12:34:56', '13/11/2026', '', 'Online']);
  assert.equal(api.call({ ...update, action: 'donate', token: undefined }).ok, true);
  assert.equal(api.rows.length, 3);
  assert.equal(api.call({ ...update, action: 'donate', token: undefined, amount: 100 }).ok, false);
  assert.equal(api.rows.length, 3);
});

test('public visitors cannot use admin actions or submit invalid donation fields', () => {
  for (const changes of [{ action: 'create' }, { action: 'update' }, { amount: 0 }, { amount: 1.001 }, { name: '' }, { requestId: 'invalid' }]) {
    const api = backend();
    const before = JSON.stringify(api.rows);
    assert.equal(api.call({ ...update, action: 'donate', token: undefined, ...changes }).ok, false);
    assert.equal(JSON.stringify(api.rows), before);
  }
});

test('admins can change a Verify entry to done', () => {
  const api = backend();
  const created = api.call({ ...update, action: 'donate', token: undefined });
  assert.equal(api.call({ ...update, receiptId: created.receiptId }).ok, true);
  assert.equal(api.rows[2][0], 'done');
  assert.equal(api.rows.length, 3);
});

test('optional mobile is stored as text, reused on retry and editable or clearable', () => {
  const api = backend();
  const body = { ...update, action: 'donate', token: undefined, mobileNumber: '+91 98765 43210' };
  const result = api.call(body);
  assert.equal(result.ok, true);
  assert.equal(api.rows[0][7], 'Mobile Number');
  assert.equal(api.rows[2][7], "'+919876543210");
  assert.equal(api.call(body).ok, true);
  assert.equal(api.rows.length, 3);
  assert.equal(api.call({ ...update, receiptId: result.receiptId, mobileNumber: '0123456789' }).ok, true);
  assert.equal(api.rows[2][7], "'0123456789");
  assert.equal(api.call({ ...update, receiptId: result.receiptId, mobileNumber: '' }).ok, true);
  assert.equal(api.rows[2][7], '');
});

test('blank mobile is accepted; malformed numbers are rejected without writing', () => {
  const api = backend();
  assert.equal(api.call({ ...update, action: 'donate', token: undefined, mobileNumber: '' }).ok, true);
  assert.equal(api.rows[2][7], '');
  for (const mobileNumber of ['123', '=1+1', 'abcdefghij', 9876543210]) {
    const before = JSON.stringify(api.rows);
    assert.equal(api.call({ ...update, action: 'donate', token: undefined, mobileNumber }).ok, false);
    assert.equal(JSON.stringify(api.rows), before);
  }
});

test('admin creates Cash entries and can update the mode to Online', () => {
  const api = backend();
  const result = api.call({ ...update, action: 'create', mode: 'Cash' });
  assert.equal(result.ok, true);
  assert.equal(api.rows[0][7], 'Mode');
  assert.equal(api.rows[2][7], 'Cash');
  assert.equal(api.call({ ...update, receiptId: result.receiptId, mode: 'Online' }).ok, true);
  assert.equal(api.rows[2][7], 'Online');
  assert.equal(api.rows.length, 3);
});

test('invalid admin modes are rejected and public donations are always Online', () => {
  const api = backend();
  const before = JSON.stringify(api.rows);
  assert.equal(api.call({ ...update, mode: 'invalid' }).ok, false);
  assert.equal(JSON.stringify(api.rows), before);
  assert.equal(api.call({ ...update, action: 'donate', token: undefined, mode: 'Cash' }).ok, true);
  assert.equal(api.rows[2][7], 'Online');
});

test('admin create and update cannot explicitly assign Verify status', () => {
  for (const action of ['create', 'update']) {
    for (const status of ['Verify', 'verify']) {
      const api = backend();
      const before = JSON.stringify(api.rows);
      assert.equal(api.call({ ...update, action, status }).ok, false);
      assert.equal(JSON.stringify(api.rows), before);
    }
  }
});

test('visit counter returns actual visits, deduplicates retries and leaves the sheet unchanged', () => {
  const api = backend();
  const before = JSON.stringify(api.rows);
  const request = { action: 'visit', requestId: update.requestId };
  assert.equal(api.call(request).visits, 1);
  assert.equal(api.call(request).visits, 1);
  assert.equal(api.call({ ...request, requestId: '22345678-1234-1234-1234-123456789abc' }).visits, 2);
  assert.equal(api.call({ action: 'visit', requestId: 'invalid' }).ok, false);
  assert.equal(JSON.stringify(api.rows), before);
});
