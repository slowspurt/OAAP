// OPTIONAL manual Google-runtime test. Copy into the same Apps Script project
// only when ready to run tests. This creates six source:demo access receipts in
// the configured Records sheet. It performs no download and leaves them pending.
// It does NOT verify the deployed /exec HTTP route. No prompts/keys are logged.
function runOaapLiteralSmokeTest() {
  const props = PropertiesService.getScriptProperties();
  const repository = props.getProperty('REPOSITORY');
  const sheet = SpreadsheetApp.openById(props.getProperty('SPREADSHEET_ID')).getSheetByName('Records');
  const samples = ['=1+1', "'=1+1", "''=1+1", '\t=1+1', "'ordinary text", 'Ordinary 한글 prompt\nwith newline'];
  const ids = [];
  function check(value) { if (!value) throw new Error('literal_smoke_failed'); }
  function send(event) { return JSON.parse(doPost({postData:{contents:JSON.stringify(event)}}).getContent()); }
  for (const sample of samples) {
    const event = {version:'0.1', operation:'access', event_id:'literal_'+Utilities.getUuid(),
      update_key:(Utilities.getUuid()+Utilities.getUuid()).replace(/-/g,''), repository:repository,
      agent:sample, final_prompt:sample, prompt_treatment:'original', category:'education', source:'demo'};
    const first = send(event); check(first.ok && first.event_id === event.event_id && first.download_status === 'pending');
    check(send(event).duplicate === true);
    check(send(Object.assign({}, event, {final_prompt:"'"+sample})).error === 'event_conflict');
    check(send(Object.assign({}, event, {agent:"'"+sample})).error === 'event_conflict');
    const rows = sheet.getRange(2,1,sheet.getLastRow()-1,11).getValues();
    const index = rows.findIndex(row => row[1] === event.event_id); check(index >= 0);
    check(rows[index][3] === sample && rows[index][4] === sample);
    check(sheet.getRange(index+2,4,1,2).getFormulas()[0].every(formula => formula === ''));
    ids.push(event.event_id);
  }
  return {ok:true, scope:'actual Apps Script text storage; no HTTP or clone verification',
    demo_receipts_created:ids.length, event_ids:ids, download_status:'pending'};
}
