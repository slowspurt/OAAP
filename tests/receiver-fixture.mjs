// Local-only Apps Script adapter. This is not a Google runtime emulator/certification.
import vm from 'node:vm';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const source = fs.readFileSync(new URL('../receiver/Code.gs', import.meta.url), 'utf8');
export const headers = ['Received at (UTC)', 'Event ID', 'Repository', 'Agent (self-reported)', 'Final access prompt', 'Prompt treatment', 'Category', 'Download status', 'Completed at (UTC)', 'Source', 'Update key hash'];
export function fixture(options = {}) {
  const data = [headers.slice()], operations = [];
  let locked = false, blocked = false, maxRows = options.maxRows ?? 2001;
  const before = (kind, details = {}) => {
    operations.push({kind, ...details});
    options.before?.({kind, ...details}, data);
  };
  const sheet = {
    getLastRow: () => data.length,
    getMaxRows: () => maxRows,
    insertRowsAfter(row, count) { before('insertRowsAfter', {row, count}); maxRows += count; },
    getRange(row, col, h = 1, w = 1) {
      const write = (values, rich = false) => {
        before(rich ? 'setRichTextValues' : 'setValues', {row, col, h, w});
        for (let i = 0; i < h; i++) {
          data[row + i - 1] ??= Array(11).fill('');
          for (let j = 0; j < w; j++) {
            const value = values[i][j];
            // Deliberately reject raw formula-like setValues writes. Number format
            // alone is not evidence of safety. RichText preserves exact strings.
            if (!rich && typeof value === 'string' && value.startsWith('=')) throw new Error('unsafe_formula_write');
            data[row + i - 1][col + j - 1] = rich ? value.text : value;
          }
        }
      };
      return {
        getValues() { before('getValues', {row, col, h, w}); return Array.from({length:h}, (_,i) => Array.from({length:w}, (_,j) => data[row+i-1]?.[col+j-1] ?? '')); },
        setNumberFormat() { before('setNumberFormat', {row, col, h, w}); return this; },
        setValues(values) { write(values); return this; },
        setRichTextValues(values) { write(values, true); return this; }
      };
    }
  };
  const context = vm.createContext({Date, JSON,
    SpreadsheetApp: {
      openById() { before('openById'); return {getSheetByName: () => options.missingSheet ? null : sheet}; },
      flush() { before('flush'); },
      newRichTextValue() { return {setText(text) { this.text = text; return this; }, build() { return {text:this.text}; }}; }
    },
    PropertiesService: {getScriptProperties: () => ({getProperty: k => (options.properties ?? {SPREADSHEET_ID:'local-fixture', REPOSITORY:'https://github.com/example/demo'})[k]})},
    LockService: {getScriptLock: () => {
      let owns = false;
      return {tryLock() { if (locked || blocked) return false; owns = locked = true; return true; }, hasLock: () => owns, releaseLock() { owns = locked = false; }};
    }},
    Utilities: {DigestAlgorithm:{SHA_256:'sha256'}, Charset:{UTF_8:'utf8'}, computeDigest: (_,s) => Array.from(createHash('sha256').update(s).digest())},
    ContentService: {MimeType:{JSON:'application/json'}, createTextOutput:text => ({setMimeType:() => JSON.parse(text)})}
  });
  vm.runInContext(source, context);
  return {data, operations, post:r => context.doPost({postData:{contents:typeof r === 'string' ? r : JSON.stringify(r)}}), get:() => context.doGet(), locked:() => locked, blockLock(value) { blocked = value; }};
}
export const access = {version:'0.1', operation:'access', event_id:'fixture_access_001', update_key:'a'.repeat(64), repository:'https://github.com/example/demo', agent:'Test AI', final_prompt:'Convert a CSV file to JSON.', prompt_treatment:'original', category:'automation', source:'demo'};
export const result = {version:'0.1', operation:'result', event_id:access.event_id, update_key:access.update_key, repository:access.repository, status:'succeeded'};
