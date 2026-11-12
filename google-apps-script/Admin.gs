// Install in the SAME spreadsheet used by the contributors CSV.
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const props = PropertiesService.getScriptProperties();
    const cache = CacheService.getScriptCache();
    if (body.action === 'visit') {
      if (!/^[a-f0-9-]{36}$/i.test(body.requestId || '')) throw new Error('Invalid visit ID.');
      const visitLock = LockService.getScriptLock();
      visitLock.waitLock(10000);
      try {
        let actualVisits = Number(props.getProperty('SITE_VISITS') || '0');
        if (!Number.isSafeInteger(actualVisits) || actualVisits < 0) throw new Error('Visit counter is not configured correctly.');
        const key = 'visit:' + body.requestId;
        if (!cache.get(key)) {
          actualVisits += 1;
          props.setProperty('SITE_VISITS', String(actualVisits));
          cache.put(key, 'counted', 21600);
        }
        return json_({ ok: true, visits: actualVisits });
      } finally { visitLock.releaseLock(); }
    }
    const publicDonation = body.action === 'donate';
    if (!publicDonation && (!props.getProperty('ADMIN_USER_ID') || !props.getProperty('ADMIN_PASSWORD'))) {
      throw new Error('Admin credentials have not been configured.');
    }
    if (body.action === 'login') {
      // Global limit also bounds attempts using invented user IDs.
      const loginLock = LockService.getScriptLock();
      loginLock.waitLock(10000);
      try {
        const attempts = Number(cache.get('login-attempts') || 0);
        if (attempts >= 30) throw new Error('Too many login attempts. Try again in 15 minutes.');
        cache.put('login-attempts', String(attempts + 1), 900);
      } finally { loginLock.releaseLock(); }
      if (body.userId !== props.getProperty('ADMIN_USER_ID') || body.password !== props.getProperty('ADMIN_PASSWORD')) {
        throw new Error('Invalid user ID or password.');
      }
      const token = Utilities.getUuid() + Utilities.getUuid();
      props.setProperty('session:' + token, 'admin');
      return json_({ ok: true, token: token });
    }
    if (body.action === 'logout') {
      if (typeof body.token === 'string' && body.token) {
        props.deleteProperty('session:' + body.token);
        cache.remove('session:' + body.token);
      }
      return json_({ ok: true });
    }
    if (!publicDonation && (!body.token || !props.getProperty('session:' + body.token))) throw new Error('Session is no longer valid. Log out and sign in again.');
    if (!['create', 'update', 'donate'].includes(body.action)) throw new Error('Unknown action.');
    // Visitors may create an unverified entry only; never trust their status.
    const status = publicDonation ? 'Verify' : body.status;
    const hasMode = publicDonation || Object.prototype.hasOwnProperty.call(body, 'mode');
    const mode = publicDonation ? 'Online' : body.mode;
    if (hasMode && !['Cash', 'Online'].includes(mode)) throw new Error('Select Cash or Online as the payment mode.');
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const hasMobile = Object.prototype.hasOwnProperty.call(body, 'mobileNumber');
    if (hasMobile && typeof body.mobileNumber !== 'string') throw new Error('Invalid mobile number.');
    const mobileNumber = (body.mobileNumber || '').trim().replace(/[\s()-]/g, '');
    if (mobileNumber && !/^(?:\+91)?[0-9]{10}$/.test(mobileNumber)) throw new Error('Enter a 10-digit mobile number, optionally prefixed with +91, or leave it blank.');
    const amount = body.amount;
    if (!name || name.length > 100 || typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0 || Math.abs(amount * 100 - Math.round(amount * 100)) > 0.00001) {
      throw new Error('Enter a valid name and positive amount with up to two decimal places.');
    }
    if (!publicDonation && !['done', 'pending'].includes(status)) throw new Error('Select Done or Pending. Verify is reserved for public payment submissions.');
    if (!/^[a-f0-9-]{36}$/i.test(body.requestId || '')) throw new Error('Invalid submission ID.');
    const lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      const spreadsheet = SpreadsheetApp.openById(props.getProperty('SPREADSHEET_ID'));
      const sheet = spreadsheet.getSheetById(Number(props.getProperty('SHEET_GID') || '0'));
      if (!sheet) throw new Error('Configured sheet tab was not found.');
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0].map(function (h) { return h.trim().toLowerCase(); });
      ['receipt id', 'name', 'date', 'time', 'amount', 'status'].forEach(function (h) {
        if (headers.indexOf(h) < 0) throw new Error('Missing sheet column: ' + h);
      });
      if (hasMobile && headers.indexOf('mobile number') < 0) {
        sheet.getRange(1, headers.length + 1).setValue('Mobile Number');
        headers.push('mobile number');
      }
      if (hasMode && headers.indexOf('mode') < 0) {
        sheet.getRange(1, headers.length + 1).setValue('Mode');
        headers.push('mode');
      }
      if (body.action === 'update') {
        if (typeof body.receiptId !== 'string' || !body.receiptId.trim()) throw new Error('Missing receipt ID.');
        if (sheet.getLastRow() < 2) throw new Error('Contribution not found.');
        const matches = sheet.getRange(2, headers.indexOf('receipt id') + 1, sheet.getLastRow() - 1, 1).createTextFinder(body.receiptId).matchEntireCell(true).findAll();
        if (matches.length !== 1) throw new Error('Contribution ID is missing or duplicated. Check the sheet.');
        const rowIndex = matches[0].getRow();
        const original = sheet.getRange(rowIndex, 1, 1, headers.length).getDisplayValues()[0];
        // Preserve the original receipt ID and creation timestamp.
        const updates = { name: /^[=+\-@]/.test(name) ? "'" + name : name, amount: amount, status: status };
        // Leading apostrophe keeps phone numbers as text (including +91 and zeros).
        if (hasMobile) updates['mobile number'] = mobileNumber ? "'" + mobileNumber : '';
        if (hasMode) updates.mode = mode;
        Object.keys(updates).forEach(function (header) {
          sheet.getRange(rowIndex, headers.indexOf(header) + 1).setValue(updates[header]);
        });
        SpreadsheetApp.flush();
        return json_({ ok: true, receiptId: body.receiptId, date: original[headers.indexOf('date')], time: original[headers.indexOf('time')] });
      }
      // Request UUID doubles as a unique receipt ID, making retries idempotent.
      const receiptId = 'CPS-' + body.requestId;
      const idColumn = headers.indexOf('receipt id') + 1;
      if (sheet.getLastRow() > 1) {
        const existing = sheet.getRange(2, idColumn, sheet.getLastRow() - 1, 1).createTextFinder(receiptId).matchEntireCell(true).findNext();
        if (existing) {
          const row = sheet.getRange(existing.getRow(), 1, 1, headers.length).getDisplayValues()[0];
          if (publicDonation && (row[headers.indexOf('name')] !== name || Number(row[headers.indexOf('amount')]) !== amount || (hasMobile && (row[headers.indexOf('mobile number')] || '') !== mobileNumber))) throw new Error('Submission details do not match the existing entry.');
          return json_({ ok: true, receiptId: receiptId, date: row[headers.indexOf('date')], time: row[headers.indexOf('time')] });
        }
      }
      if (publicDonation) {
        const attempts = Number(cache.get('donation-attempts') || 0);
        if (attempts >= 100) throw new Error('Too many contributions at once. Please try again in a few minutes.');
        cache.put('donation-attempts', String(attempts + 1), 300);
      }
      const now = new Date();
      const date = Utilities.formatDate(now, 'Asia/Kolkata', 'dd/MM/yyyy');
      const time = Utilities.formatDate(now, 'Asia/Kolkata', 'HH:mm:ss');
      const values = { 'receipt id': receiptId, name: /^[=+\-@]/.test(name) ? "'" + name : name, 'mobile number': mobileNumber ? "'" + mobileNumber : '', mode: hasMode ? mode : '', amount: amount, status: status, date: date, time: time };
      sheet.appendRow(headers.map(function (h) { return Object.prototype.hasOwnProperty.call(values, h) ? values[h] : ''; }));
      SpreadsheetApp.flush();
      return json_({ ok: true, receiptId: receiptId, date: date, time: time });
    } finally { lock.releaseLock(); }
  } catch (error) {
    return json_({ ok: false, error: error.message || 'Unable to process request.' });
  }
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
