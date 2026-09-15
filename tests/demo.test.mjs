import {test} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fixture,access,result} from './receiver-fixture.mjs';
import {runDemo,postEvent,validateEndpoint} from '../scripts/demo-client.mjs';

async function localServer(t) {
 const f=fixture(); const requests=[]; let drop=null;
 const server=http.createServer(async (req,res)=>{
  let raw='';for await (const chunk of req) raw+=chunk;
  const event=JSON.parse(raw); requests.push(event);
  const response=f.post(event);
  if(drop===event.operation){drop=null;req.socket.destroy();return;}
  res.setHeader('Content-Type','application/json');res.end(JSON.stringify(response));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>new Promise(resolve=>{server.close(resolve);server.closeAllConnections();}));
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'oaap-e2e-'));
 const stateFile=path.join(directory,'retry.local.json');
 t.after(async()=>{try{const state=JSON.parse(await fs.readFile(stateFile,'utf8'));await fs.rm(state.root,{recursive:true,force:true});}catch{} await fs.rm(directory,{recursive:true,force:true});});
 return {f,requests,dropNext(operation){drop=operation;},options:{endpoint:`http://127.0.0.1:${server.address().port}/exec`,stateFile,localOnly:true,postOptions:{attempts:1,timeoutMs:2000,delayMs:0}}};
}

test('LOCAL ONLY E2E: HTTP receipt, real Git clones, failed clone and duplicate outcomes',async t=>{
 const local=await localServer(t);const evidence=await runDemo(local.options);
 assert.match(evidence.verification_scope,/LOCAL ONLY/);assert.equal(evidence.google_sheet_independently_verified,false);
 assert.equal(local.f.data.length,4);assert.deepEqual(local.f.data.slice(1).map(r=>r[7]),['succeeded','succeeded','failed']);
 assert.ok(evidence.events.every(e=>e.clone_attempts===1&&e.access_duplicate_confirmed&&e.result_duplicate_confirmed));
 assert.equal(evidence.feedback_demo.after_observed_use,true);assert.equal(evidence.feedback_demo.social_action_performed,false);
 const saved=JSON.parse(await fs.readFile(local.options.stateFile,'utf8'));
 assert.equal((await fs.stat(local.options.stateFile)).mode&0o777,0o600);
 assert.equal(JSON.stringify(evidence).includes(saved.events[0].event.update_key),false);
 const requests=local.requests.length;await runDemo(local.options);assert.equal(local.requests.length,requests);assert.equal(local.f.data.length,4);
});
for(const operation of ['access','result']) test(`LOCAL ONLY E2E: dropped ${operation} response preserves credentials and resumes same event`,async t=>{
 const local=await localServer(t);local.dropNext(operation);
 await assert.rejects(runDemo(local.options),/network_unconfirmed/);
 const before=JSON.parse(await fs.readFile(local.options.stateFile,'utf8'));
 assert.equal(before.events[0].phase,operation==='access'?'prepared':'result_pending');
 assert.equal(local.f.data.length,2);assert.equal(local.f.data[1][7],operation==='access'?'pending':'succeeded');
 const evidence=await runDemo(local.options);const after=JSON.parse(await fs.readFile(local.options.stateFile,'utf8'));
 assert.deepEqual(before.events[0].event,after.events[0].event);assert.equal(after.events[0].clone_attempts,1);assert.equal(local.f.data.length,4);
 assert.ok(evidence.events.every(e=>e.result_confirmed));
});
test('LOCAL ONLY E2E: concurrent HTTP retries create one receipt and one terminal outcome',async t=>{
 const local=await localServer(t);const post=r=>postEvent(local.options.endpoint,r,{attempts:1,timeoutMs:2000});
 const responses=await Promise.all(Array.from({length:20},()=>post(access)));
 assert.equal(responses.filter(r=>!r.duplicate).length,1);assert.equal(local.f.data.length,2);
 const results=await Promise.all(Array.from({length:20},()=>post(result)));
 assert.equal(results.filter(r=>!r.duplicate).length,1);assert.equal(local.f.data[1][7],'succeeded');
});
test('unknown clone outcome is preserved on resume without redownloading or fabricating failed',async t=>{
 const local=await localServer(t);local.dropNext('access');await assert.rejects(runDemo(local.options));
 const saved=JSON.parse(await fs.readFile(local.options.stateFile,'utf8'));saved.events[0].phase='clone_started';saved.events[0].clone_attempts=1;
 await fs.writeFile(local.options.stateFile,JSON.stringify(saved));
 await assert.rejects(runDemo(local.options),/clone_outcome_unknown/);
 assert.equal(local.f.data[1][7],'pending');assert.equal(local.requests.some(r=>r.operation==='result'),false);
});
test('HTTP success is insufficient: acknowledgement ID, state, duplicate and status are checked',async()=>{
 const valid={ok:true,event_id:result.event_id,duplicate:false,download_status:'succeeded'};
 for(const body of [{...valid,event_id:'another'}, {...valid,download_status:'failed'}, {...valid,duplicate:undefined}, {...valid,ok:false}, {ok:true},'<html>login</html>']) {
  await assert.rejects(postEvent('unused',result,{attempts:1,fetchImpl:async()=>({ok:true,json:async()=>body})}));
 }
 await assert.rejects(postEvent('unused',result,{attempts:1,fetchImpl:async()=>({ok:false,json:async()=>valid})}),/http_failure/);
 await assert.rejects(postEvent('unused',result,{attempts:1,fetchImpl:async()=>({ok:true,json:async()=>{throw Error('private server HTML');}})}),/non_json_response/);
});
test('busy retries are bounded and reuse exact payload; endpoint modes cannot be mixed',async()=>{
 const seen=[];
 await assert.rejects(postEvent('unused',access,{attempts:3,delayMs:0,fetchImpl:async(_,options)=>{seen.push(options.body);return{ok:true,json:async()=>({ok:false,error:'busy_retry'})};}}),/busy_retry/);
 assert.equal(seen.length,3);assert.equal(new Set(seen).size,1);
 assert.throws(()=>validateEndpoint('http://127.0.0.1:1234/exec'));
 assert.throws(()=>validateEndpoint('https://script.google.com/macros/s/demo/exec',true));
 validateEndpoint('https://script.google.com/macros/s/demo/exec');validateEndpoint('http://127.0.0.1:1234/exec',true);
});
