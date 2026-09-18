// OAAP 0.1 proof of concept. Deploy one receiver per repository.
// In Apps Script > Project Settings > Script Properties, set SPREADSHEET_ID
// to your copied template's ID and REPOSITORY to your canonical repository URL.
const OAAP_CAPACITY = 2000;
const OAAP_HEADERS = ['Received at (UTC)', 'Event ID', 'Repository', 'Agent (self-reported)', 'Final access prompt', 'Prompt treatment', 'Category', 'Download status', 'Completed at (UTC)', 'Source', 'Update key hash'];

function doGet() {
  return json_({protocol: 'OAAP', version: '0.1', accepts: 'POST', exposes_records: false});
}

function doPost(e) {
  let lock;
  try {
    const raw = e && e.postData && e.postData.contents;
    if (typeof raw !== 'string' || raw.length > 16000) throw new Error('invalid_body');
    let parsed;
    try { parsed = JSON.parse(raw); } catch (_) { throw new Error('invalid_body'); }
    const request = validate_(parsed);
    const props = PropertiesService.getScriptProperties();
    const id = props.getProperty('SPREADSHEET_ID');
    const repository = props.getProperty('REPOSITORY');
    if (!id || !repository) throw new Error('not_configured');
    if (request.repository !== repository) throw new Error('repository_mismatch');
    lock = LockService.getScriptLock();
    if (!lock.tryLock(5000)) throw new Error('busy_retry');
    const book = SpreadsheetApp.openById(id);
    const sheet = book.getSheetByName('Records');
    if (!sheet || JSON.stringify(sheet.getRange(1, 1, 1, 11).getValues()[0]) !== JSON.stringify(OAAP_HEADERS)) throw new Error('template_mismatch');
    const last = sheet.getLastRow();
    if (last > OAAP_CAPACITY + 1) throw new Error('template_mismatch');
    const rows = last > 1 ? sheet.getRange(2, 1, last - 1, 11).getValues() : [];
    // Source is the commit marker, written with status/key only after exact text.
    // A failed multi-call write can leave one trailing staging row; reuse it.
    if (rows.some((row, i) => !['demo', 'live'].includes(row[9]) && (i !== rows.length - 1 || row[9] !== ''))) throw new Error('template_mismatch');
    const staging = rows.length > 0 && rows[rows.length - 1][9] === '';
    const index = rows.findIndex(row => row[9] !== '' && row[1] === request.event_id);
    const hash = hash_(request.update_key);
    if (request.operation === 'access') {
      if (index >= 0) {
        const row = rows[index];
        if (!['pending', 'succeeded', 'failed'].includes(row[7])) throw new Error('template_mismatch');
        // Retries must preserve the same payload. Never disclose the existing prompt.
        const fields = [request.repository, request.agent, request.final_prompt, request.prompt_treatment, request.category];
        if (row[10] !== hash || fields.some((value, i) => row[i + 2] !== value) || row[9] !== request.source) throw new Error('event_conflict');
        return json_({ok: true, event_id: request.event_id, duplicate: true, download_status: row[7]});
      }
      const next = staging ? last : last + 1;
      if (next > OAAP_CAPACITY + 1) throw new Error('capacity_reached');
      if (sheet.getMaxRows() < next) sheet.insertRowsAfter(sheet.getMaxRows(), next - sheet.getMaxRows());
      sheet.getRange(next, 2, 1, 7).setNumberFormat('@');
      sheet.getRange(next, 10, 1, 2).setNumberFormat('@');
      sheet.getRange(next, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');
      // RichText avoids formula parsing; escape its leading-apostrophe marker.
      // Never accept either raw OR escaped text as an identical retry.
      sheet.getRange(next, 1, 1, 3).setValues([[new Date(), request.event_id, request.repository]]);
      sheet.getRange(next, 4, 1, 2).setRichTextValues([[
        richText_(request.agent),
        richText_(request.final_prompt)
      ]]);
      SpreadsheetApp.flush();
      // Commit last. A staging row has no source and is excluded by Summary.
      sheet.getRange(next, 6, 1, 6).setValues([[request.prompt_treatment, request.category, 'pending', '', request.source, hash]]);
      SpreadsheetApp.flush();
      return json_({ok: true, event_id: request.event_id, duplicate: false, download_status: 'pending'});
    }
    if (index < 0 || rows[index][10] !== hash || rows[index][2] !== request.repository) throw new Error('unknown_event_or_key');
    const old = rows[index][7];
    if (!['pending', 'succeeded', 'failed'].includes(old)) throw new Error('template_mismatch');
    if (old !== 'pending' && old !== request.status) throw new Error('result_conflict');
    if (old === 'pending') {
      sheet.getRange(index + 2, 8, 1, 2).setValues([[request.status, new Date()]]);
      sheet.getRange(index + 2, 9).setNumberFormat('yyyy-mm-dd hh:mm:ss');
      SpreadsheetApp.flush();
    }
    return json_({ok: true, event_id: request.event_id, duplicate: old === request.status, download_status: request.status});
  } catch (error) {
    const known = ['invalid_body', 'invalid_version', 'invalid_operation', 'invalid_event_id', 'invalid_update_key', 'invalid_repository', 'invalid_agent', 'invalid_final_prompt', 'invalid_prompt_treatment', 'invalid_category', 'invalid_source', 'invalid_status', 'invalid_fields', 'not_configured', 'repository_mismatch', 'busy_retry', 'template_mismatch', 'event_conflict', 'capacity_reached', 'unknown_event_or_key', 'result_conflict'];
    return json_({ok: false, error: error && known.includes(error.message) ? error.message : 'receiver_error'});
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock();
  }
}

function validate_(r) {
  if (!r || typeof r !== 'object' || Array.isArray(r) || r.version !== '0.1') throw new Error('invalid_version');
  if (!['access', 'result'].includes(r.operation)) throw new Error('invalid_operation');
  if (typeof r.event_id !== 'string' || !/^[A-Za-z0-9_-]{16,80}$/.test(r.event_id)) throw new Error('invalid_event_id');
  if (typeof r.update_key !== 'string' || !/^[a-f0-9]{64}$/.test(r.update_key)) throw new Error('invalid_update_key');
  if (typeof r.repository !== 'string' || r.repository.length > 300 || !/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(r.repository)) throw new Error('invalid_repository');
  if (r.operation === 'access') {
    for (const [field, max] of [['agent', 100], ['final_prompt', 8000]]) {
      if (typeof r[field] !== 'string' || !r[field].trim() || r[field].length > max) throw new Error('invalid_' + field);
    }
    if (!['original', 'anonymized'].includes(r.prompt_treatment)) throw new Error('invalid_prompt_treatment');
    if (!['automation', 'development', 'research', 'education', 'other'].includes(r.category)) throw new Error('invalid_category');
    if (!['demo', 'live'].includes(r.source)) throw new Error('invalid_source');
    const allowed = ['version', 'operation', 'event_id', 'update_key', 'repository', 'agent', 'final_prompt', 'prompt_treatment', 'category', 'source'];
    if (Object.keys(r).some(k => !allowed.includes(k))) throw new Error('invalid_fields');
  } else {
    if (!['succeeded', 'failed'].includes(r.status)) throw new Error('invalid_status');
    const allowed = ['version', 'operation', 'event_id', 'update_key', 'repository', 'status'];
    if (Object.keys(r).some(k => !allowed.includes(k))) throw new Error('invalid_fields');
  }
  return r;
}

function richText_(s) {
  // Native Sheets removes one leading apostrophe, even for RichTextValue.
  // Double that marker to preserve the exact original (verified by native smoke).
  return SpreadsheetApp.newRichTextValue().setText(s.startsWith("'") ? "'" + s : s).build();
}

function hash_(s) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8)
    .map(b => ('0' + ((b + 256) % 256).toString(16)).slice(-2)).join('');
}
function json_(data) { return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON); }
