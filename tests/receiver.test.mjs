import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fixture, access, result} from './receiver-fixture.mjs';
test('access is pending, successful download updates same row, retries do not inflate counts',()=>{
 const f=fixture();assert.equal(f.post(access).ok,true);assert.equal(f.data[1][7],'pending');
 assert.equal(f.post(access).duplicate,true);assert.equal(f.data.length,2);
 assert.equal(f.post(result).download_status,'succeeded');assert.ok(f.data[1][8] instanceof Date);
 assert.equal(f.post(result).duplicate,true);assert.equal(f.post(access).duplicate,true);assert.equal(f.data.length,2);assert.equal(f.locked(),false);
});
test('failed download remains failed and cannot later be silently relabeled',()=>{
 const f=fixture();f.post(access);assert.equal(f.post({...result,status:'failed'}).ok,true);assert.equal(f.post(result).error,'result_conflict');assert.equal(f.data[1][7],'failed');
});
test('unknown event, wrong update secret, wrong repository, changed retry are rejected',()=>{
 const f=fixture();assert.equal(f.post(result).ok,false);f.post(access);
 assert.equal(f.post({...result,update_key:'b'.repeat(64)}).ok,false);
 assert.equal(f.post({...access,repository:'https://github.com/elsewhere/repo'}).error,'repository_mismatch');
 assert.equal(f.post({...access,final_prompt:'Another task'}).error,'event_conflict');assert.equal(f.data[1][7],'pending');
});
test('original and AI-anonymized prompt text are preserved, not replaced by category',()=>{
 const f=fixture();f.post(access);assert.equal(f.data[1][4],access.final_prompt);
 const privateIdea={...access,event_id:'fixture_access_002',final_prompt:'Build an event-planning workflow without disclosing the original business idea.',prompt_treatment:'anonymized'};
 f.post(privateIdea);assert.equal(f.data[2][4],privateIdea.final_prompt);assert.equal(f.data[2][5],'anonymized');
});
test('formula-like prompt and agent use exact literal text; identical retries remain valid',()=>{
 const f=fixture();const r={...access,final_prompt:'=IMPORTXML("https://example.invalid","//x")',agent:'=1+1'};
 f.post(r);assert.equal(f.data[1][4],r.final_prompt);assert.equal(f.data[1][3],r.agent);assert.equal(f.post(r).duplicate,true);
});
test('empty prompts, excessive payloads, unknown fields and malformed requests leave no rows',()=>{
 const f=fixture();for(const r of [{...access,final_prompt:''},{...access,final_prompt:'x'.repeat(8001)},{...access,transcript:'extra'},{...access,category:'invented'},'not json'])assert.equal(f.post(r).ok,false);
 assert.equal(f.data.length,1);assert.equal(f.get().exposes_records,false);
});
test('capacity stops safely after 2000 requests; existing-event retries still work',()=>{
 const f=fixture();f.post(access);while(f.data.length<2001) f.data.push(f.data[1].map((x,i)=>i===1?`filler_${f.data.length}`:x));
 assert.equal(f.post({...access,event_id:'fixture_access_999'}).error,'capacity_reached');assert.equal(f.post(access).duplicate,true);
});
test('apostrophe changes are conflicts in both directions for prompt and agent', () => {
 for (const field of ['final_prompt', 'agent']) for (const text of ['=1+1', "'=1+1", "''=1+1", '\t=1+1', '+1', '-1', '@x', "'ordinary"]) {
  const f = fixture(), request = {...access, [field]:text};
  assert.equal(f.post(request).ok, true); assert.equal(f.post(request).duplicate, true);
  assert.equal(f.data[1][field === 'agent' ? 3 : 4], text);
  assert.equal(f.post({...request,[field]:"'"+text}).error,'event_conflict');
  assert.equal(f.post({...request,[field]:text.slice(1) || 'other'}).error,'event_conflict');
 }
});
test('every changed access field is rejected without exposing stored data or keys', () => {
 const f = fixture(); f.post(access);
 for (const change of [{agent:'Different'}, {prompt_treatment:'anonymized'}, {category:'research'}, {source:'live'}, {update_key:'b'.repeat(64)}]) {
  assert.deepEqual(f.post({...access,...change}), {ok:false,error:'event_conflict'});
 }
 assert.notEqual(f.data[1][10],access.update_key); assert.equal(f.data[1][10].length,64);
});
test('lock contention refuses writes, nested request cannot append, lock releases on errors', () => {
 let nested; let f;
 f=fixture({before(op) { if (op.kind==='openById' && !nested) nested=f.post(access); }});
 assert.equal(f.post(access).ok,true); assert.equal(nested.error,'busy_retry'); assert.equal(f.data.length,2);
 f.blockLock(true); assert.equal(f.post(result).error,'busy_retry'); assert.equal(f.data[1][7],'pending');
 f.blockLock(false); assert.equal(f.post(result).ok,true); assert.equal(f.locked(),false);
});
test('partial access writes reuse one staging row without counting it or touching committed rows', () => {
 for (const failure of ['setRichTextValues','flush','commit']) {
  let fail=false;
  const f=fixture({before(op) { if (fail && (op.kind===failure || (failure==='commit' && op.kind==='setValues' && op.col===6))) { fail=false; throw new Error('simulated outage'); } }});
  f.post(access); const saved=f.data[1].slice(); fail=true;
  const second={...access,event_id:'fixture_access_002',final_prompt:"'=new"};
  assert.equal(f.post(second).error,'receiver_error'); assert.equal(f.locked(),false);
  assert.deepEqual(f.data[1],saved); assert.equal(f.data[2][9],'');
  assert.equal(f.data.filter(r=>r[9]==='demo').length,1);
  assert.equal(f.post({...result,event_id:second.event_id}).error,'unknown_event_or_key');
  assert.equal(f.post(second).ok,true); assert.equal(f.data.length,3); assert.equal(f.data[2][4],second.final_prompt);
  assert.equal(f.post(second).duplicate,true); assert.deepEqual(f.data[1],saved);
 }
});
test('lost acknowledgement after commit is resolved by exact retry without another row', () => {
 let fail=true; const f=fixture({before(op,data) { if(op.kind==='flush' && fail && data[1]?.[9]==='demo') { fail=false; throw new Error('outage'); } }});
 assert.equal(f.post(access).error,'receiver_error'); assert.equal(f.post(access).duplicate,true); assert.equal(f.data.length,2);
 fail=true; assert.equal(f.post(result).error,'receiver_error'); assert.equal(f.post(result).duplicate,true); assert.equal(f.data.length,2);
});
test('capacity permits result updates and last-row recovery, rejects oversized sheets before scanning', () => {
 const f=fixture(); f.post(access); while(f.data.length<2001) f.data.push(f.data[1].map((x,i)=>i===1?`filler_${f.data.length}`:x));
 assert.equal(f.post(result).ok,true); assert.equal(f.data.length,2001);
 f.data[2000][9]=''; assert.equal(f.post({...access,event_id:'fixture_access_last'}).ok,true); assert.equal(f.data.length,2001);
 f.data.push(Array(11).fill('manual overflow')); const before=f.operations.length;
 assert.equal(f.post(result).error,'template_mismatch');
 assert.equal(f.operations.slice(before).some(x=>x.kind==='getValues' && x.row===2),false);
});
test('configuration, template and validation failures are bounded and sanitized', () => {
 assert.equal(fixture({properties:{}}).post(access).error,'not_configured');
 assert.equal(fixture({missingSheet:true}).post(access).error,'template_mismatch');
 const f=fixture(); f.data[0][0]='bad'; assert.equal(f.post(access).error,'template_mismatch'); assert.equal(f.locked(),false);
 const broken=fixture({before() { throw new Error('invalid_private_secret'); }});
 assert.deepEqual(broken.post(access),{ok:false,error:'receiver_error'});
 for (const repository of ['http://github.com/a/b','https://github.com/a/b/','https://github.com/a/b?x=y','https://github.com/a/b#x','https://github.com/a/b/c']) assert.equal(fixture().post({...access,repository}).error,'invalid_repository');
 assert.equal(fixture().post('not json').error,'invalid_body'); assert.equal(fixture().post('x'.repeat(16001)).error,'invalid_body');
});
test('configured repository change cannot update an old repository record', () => {
 const properties={SPREADSHEET_ID:'local-fixture',REPOSITORY:access.repository}; const f=fixture({properties}); f.post(access);
 properties.REPOSITORY='https://github.com/new/repo';
 assert.equal(f.post({...result,repository:properties.REPOSITORY}).error,'unknown_event_or_key'); assert.equal(f.data[1][7],'pending');
});
test('manifest wire fields match accepted synthetic events and native helper parses', async () => {
 const fs=await import('node:fs/promises'); const vm=await import('node:vm');
 const manifest=JSON.parse(await fs.readFile(new URL('../templates/repository/oaap.json',import.meta.url),'utf8'));
 assert.deepEqual(manifest.required_access_fields.slice().sort(),Object.keys(access).sort());
 assert.deepEqual(manifest.required_result_fields.slice().sort(),Object.keys(result).sort());
 const f=fixture(); assert.equal(f.post(access).ok,true); assert.equal(f.post(result).ok,true);
 new vm.Script(await fs.readFile(new URL('../receiver/GoogleSmokeTest.gs',import.meta.url),'utf8'));
 f.data[1][7]='invented'; assert.equal(f.post(access).error,'template_mismatch');
});
