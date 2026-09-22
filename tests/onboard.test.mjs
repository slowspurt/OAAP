import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFile,spawn} from 'node:child_process';
import {promisify} from 'node:util';
import {planOnboarding,applyPlan,checkOnboarding,validateConfig} from '../scripts/onboard.mjs';

const exec=promisify(execFile);
const cli=fileURLToPath(new URL('../scripts/onboard.mjs',import.meta.url));
const active={repository:'https://github.com/acme/project',receiver:'https://receiver.acme.org/oaap',feedback:{destination:'https://github.com/acme/project/issues',questions:['What did you expect?','What happened?','What minimal reproduction may be shared publicly?'],intended_use:'Review approved cases before documentation, scenarios or RAG use.'}};
const draft={...active,receiver:null};
const clone=x=>JSON.parse(JSON.stringify(x));
async function fixture(t) {
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'oaap-onboard-'));
  const project=path.join(root,'project');await fs.mkdir(project);
  t.after(()=>fs.rm(root,{recursive:true,force:true}));
  return {root,project};
}
async function tree(root) {
  const out={};
  async function walk(dir) {
    for(const e of await fs.readdir(dir,{withFileTypes:true})) {
      const file=path.join(dir,e.name),key=path.relative(root,file);
      if(e.isSymbolicLink()) out[key]={link:await fs.readlink(file)};
      else if(e.isDirectory()) {out[key]='/';await walk(file);}
      else out[key]=(await fs.readFile(file)).toString('base64');
    }
  }
  await walk(root);return out;
}
async function run(project,argv=[],options={}) {
  try {const r=await exec(process.execPath,[cli,'--project',project,...argv],{timeout:15000,...options});return {...r,code:0};}
  catch(e){return {stdout:e.stdout||'',stderr:e.stderr||'',code:e.code};}
}
async function input(root,config) {const f=path.join(root,'input.json');await fs.writeFile(f,JSON.stringify(config));return f;}
async function apply(project,config) {const p=await planOnboarding(project,config);await applyPlan(p);return p;}

test('config preview makes no project writes and reports unverified planned files',async t=>{
  const {root,project}=await fixture(t);
  await fs.writeFile(path.join(project,'README.md'),'# Keep me\r\n');
  const before=await tree(project), f=await input(root,active);
  const r=await run(project,['--config',f]);
  assert.equal(r.code,0,r.stderr);assert.match(r.stdout,/configured_unverified/);
  assert.match(r.stdout,/"runtime_verified": false/);assert.deepEqual(await tree(project),before);
  assert.equal((await planOnboarding(project,active)).changes.length,6);
});

test('deferred setup only writes two draft files; later activation preserves existing instructions',async t=>{
  const {project}=await fixture(t);
  const originals={'README.md':'# Product\r\nExisting docs.\r\n','AGENTS.md':'Follow project tests.\n','CLAUDE.md':'Custom policy without a final newline'};
  for(const [f,s]of Object.entries(originals))await fs.writeFile(path.join(project,f),s);
  await apply(project,draft);
  const entries=await tree(project);
  assert.deepEqual(Object.keys(entries).sort(),['.oaap','.oaap/SETUP.md','.oaap/onboarding.json',...Object.keys(originals)].sort());
  for(const [f,s]of Object.entries(originals))assert.equal(await fs.readFile(path.join(project,f),'utf8'),s);
  assert.equal((await checkOnboarding(project)).state,'awaiting_receiver');
  const state=JSON.parse(await fs.readFile(path.join(project,'.oaap/onboarding.json'),'utf8'));
  assert.equal(state.schema_version,1);assert.equal(state.receiver,null);
  await apply(project,active);
  assert.deepEqual(await checkOnboarding(project),{state:'configured_unverified',local_consistency:true,runtime_verified:false,message:'Locally configured; receiver and real access/download flow remain unverified.'});
  for(const [f,s]of Object.entries(originals)){
    const got=await fs.readFile(path.join(project,f),'utf8');assert.ok(got.startsWith(s));
    assert.equal((got.match(/<!-- OAAP:START -->/g)||[]).length,1);
    assert.equal((got.match(/<!-- OAAP:END -->/g)||[]).length,1);
  }
  const setup=await fs.readFile(path.join(project,'.oaap/SETUP.md'),'utf8');
  assert.match(setup,/templates\/sheets\/OAAP-maintainer-template.xlsx/);
  assert.match(setup,/receiver\/Code.gs/);assert.equal(setup.includes(project),false);
  assert.equal(setup.includes(path.dirname(cli)),false);
});

test('repeat is byte-idempotent; feedback reconfigure preserves independently edited outside text',async t=>{
  const {project}=await fixture(t);await apply(project,active);
  const initial=await tree(project);const repeat=await apply(project,active);
  assert.deepEqual(repeat.changes,[]);assert.deepEqual(await tree(project),initial);
  const f=path.join(project,'AGENTS.md');const original=await fs.readFile(f,'utf8');
  await fs.writeFile(f,'# New unrelated instructions\r\n'+original+'\nTail stays byte-for-byte.\r\n');
  const changed=clone(active);changed.feedback.questions=['Where did the handoff fail?'];changed.feedback.intended_use='Maintainer review before scenario selection.';
  await apply(project,changed);
  const after=await fs.readFile(f,'utf8');assert.ok(after.startsWith('# New unrelated instructions\r\n'));
  assert.ok(after.endsWith('\nTail stays byte-for-byte.\r\n'));
  assert.equal((after.match(/<!-- OAAP:START -->/g)||[]).length,1);
  const m=JSON.parse(await fs.readFile(path.join(project,'oaap.json'),'utf8'));
  assert.deepEqual(m.feedback.questions,changed.feedback.questions);assert.equal(m.feedback.automatic_star,false);
  assert.equal(m.feedback.intended_use,changed.feedback.intended_use);
  assert.equal((await checkOnboarding(project)).local_consistency,true);
  const before=await tree(project);assert.deepEqual((await apply(project,changed)).changes,[]);assert.deepEqual(await tree(project),before);
});

test('ordinary OAAP: prose is preserved through draft, activation, outside edits and reconfigure',async t=>{
  const {project}=await fixture(t);
  const f=path.join(project,'README.md');const prefix='# Project\nOAAP: planned adoption.\n';
  await fs.writeFile(f,prefix);await apply(project,draft);
  assert.equal(await fs.readFile(f,'utf8'),prefix);assert.equal((await checkOnboarding(project)).state,'awaiting_receiver');
  await apply(project,active);
  await fs.appendFile(f,'\nOAAP: follow the maintainer contract.\n');
  assert.equal((await checkOnboarding(project)).local_consistency,true);
  const config=clone(active);config.feedback.questions=['OAAP: what would make setup easier?'];
  await apply(project,config);
  const s=await fs.readFile(f,'utf8');assert.ok(s.startsWith(prefix));assert.ok(s.endsWith('\nOAAP: follow the maintainer contract.\n'));
  assert.equal((await checkOnboarding(project)).local_consistency,true);
});

test('manifest keeps wire contract and configurable feedback with explicit sharing boundaries',async t=>{
  const {project}=await fixture(t);await apply(project,active);
  const template=JSON.parse(await fs.readFile(new URL('../templates/repository/oaap.json',import.meta.url),'utf8'));
  const m=JSON.parse(await fs.readFile(path.join(project,'oaap.json'),'utf8'));
  assert.equal(m.protocol,'OAAP');assert.equal(m.version,'0.1');
  for(const field of ['required_access_fields','required_result_fields','prompt_policy'])assert.deepEqual(m[field],template[field]);
  for(const field of ['destination','questions','intended_use'])assert.equal(m.required_access_fields.includes(field),false);
  assert.equal(m.feedback.destination,active.feedback.destination);assert.match(m.feedback.relay_after_use,/feedback/);
  for(const f of ['README.md','AGENTS.md','CLAUDE.md']) {
    const s=await fs.readFile(path.join(project,f),'utf8');
    assert.equal(s.includes('### Feedback after observed use'),false,'Do not duplicate the setup policy in notices.');
    assert.match(s,/feedback/);assert.match(s,/actual, approved/);assert.match(s,/permission/);assert.match(s,/RAG/);
  }
  const agent=await fs.readFile(path.join(project,'AGENTS.md'),'utf8');
  assert.match(agent,/existing applicable permission/);assert.match(agent,/if missing/);
  const setup=await fs.readFile(path.join(project,'.oaap/SETUP.md'),'utf8');
  assert.match(setup,/Use existing applicable permission/);assert.match(setup,/ask explicitly only if it is absent/);
});

for(const conflict of ['README.md','AGENTS.md','CLAUDE.md','oaap.json','.oaap/SETUP.md','.oaap/onboarding.json'])test(`manual change in ${conflict} rejects reconfigure/check with no planned partial writes`,async t=>{
  const {project}=await fixture(t);await apply(project,active);
  const f=path.join(project,conflict);
  if(conflict==='.oaap/onboarding.json'){
    const s=JSON.parse(await fs.readFile(f,'utf8'));s.feedback.questions=['Manually changed'];await fs.writeFile(f,JSON.stringify(s));
  }else if(conflict.endsWith('.md') && !conflict.startsWith('.oaap')){
    const s=await fs.readFile(f,'utf8');await fs.writeFile(f,s.replace('<!-- OAAP:START -->','<!-- OAAP:START -->\nManual change'));
  }else await fs.appendFile(f,'\nManual change');
  const before=await tree(project);
  await assert.rejects(planOnboarding(project,{...active,receiver:'https://new.acme.org/receive'}));
  await assert.rejects(checkOnboarding(project));assert.deepEqual(await tree(project),before);
});

for(const raw of ['<!-- OAAP:START -->\nPartial','<!-- OAAP:END -->\n<!-- OAAP:START -->','<!-- OAAP:START -->\nx\n<!-- OAAP:END -->\n<!-- OAAP:START -->\nx\n<!-- OAAP:END -->','<!--OAAP:START-->\nx\n<!--OAAP:END-->','<!-- OAAP:START -->\nx\n<!-- OAAP:END -->'])test('untracked/malformed/duplicate markers refuse adoption: '+raw.slice(0,30),async t=>{
  const {project}=await fixture(t);await fs.writeFile(path.join(project,'AGENTS.md'),raw);
  const before=await tree(project);await assert.rejects(planOnboarding(project,active));assert.deepEqual(await tree(project),before);
});

test('unmanaged configs and active-to-null reset are preserved, including custom credentials',async t=>{
  const {project}=await fixture(t);
  await fs.writeFile(path.join(project,'oaap.json'),'custom config with private key');
  const before=await tree(project);
  for(const c of [draft,active])await assert.rejects(planOnboarding(project,c),/unmanaged/);
  assert.deepEqual(await tree(project),before);
  await fs.unlink(path.join(project,'oaap.json'));await apply(project,active);
  const applied=await tree(project);await assert.rejects(planOnboarding(project,draft),/Cannot reset/);
  assert.deepEqual(await tree(project),applied);
});

for(const name of ['.oaap','README.md','AGENTS.md','CLAUDE.md','oaap.json','.oaap/SETUP.md','.oaap/onboarding.json'])test(`symlink avoidance: ${name}`,async t=>{
  const {root,project}=await fixture(t);const destination=path.join(root,'untouched');
  if(name==='.oaap')await fs.mkdir(destination);else await fs.writeFile(destination,'untouched');
  if(name.startsWith('.oaap/'))await fs.mkdir(path.join(project,'.oaap'));
  await fs.symlink(destination,path.join(project,name));
  const before=await tree(root);await assert.rejects(planOnboarding(project,active),/symlink/);
  assert.deepEqual(await tree(root),before);
});

test('symlink project root and changed project after preview are rejected',async t=>{
  const {root,project}=await fixture(t);const alias=path.join(root,'alias');await fs.symlink(project,alias);
  await assert.rejects(planOnboarding(alias,active),/symlink/);
  const p=await planOnboarding(project,active);await fs.writeFile(path.join(project,'README.md'),'New user content');
  const before=await tree(project);await assert.rejects(applyPlan(p),/changed after preview/);assert.deepEqual(await tree(project),before);
});

test('URL and data validation blocks credentials, private literals and placeholders without lookup',()=>{
  for(const url of ['http://receiver.acme.org','https://u:pass@receiver.acme.org','https://localhost/path','https://sub.localhost/path','https://127.1/path','https://2130706433/path','https://10.0.0.1','https://172.16.0.1','https://192.168.0.2','https://169.254.169.254','https://100.64.0.1','https://[::1]','https://[fc00::1]','https://[::ffff:127.0.0.1]','https://example.com/receiver','https://YOUR_DOMAIN/receive','https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec','https://r.acme.org/path#secret','https://r.acme.org/`unsafe`']){
    assert.throws(()=>validateConfig({...active,receiver:url}),undefined,url);
    assert.throws(()=>validateConfig({...active,feedback:{...active.feedback,destination:url}}),undefined,url);
  }
  for(const url of ['https://github.com/YOUR_NAME/YOUR_REPOSITORY','https://github.com/acme/project.git','https://github.com/acme/project/','https://u:p@github.com/acme/project'])assert.throws(()=>validateConfig({...active,repository:url}));
  const prefix='https://github.com/acme/';
  assert.equal(validateConfig({...active,repository:prefix+'r'.repeat(300-prefix.length)}).repository.length,300);
  assert.throws(()=>validateConfig({...active,repository:prefix+'r'.repeat(301-prefix.length)}),/at most 300/);
  for(const receiver of ['https://service.acme.org/hooks/intake?channel=oaap','https://8.8.8.8:8443/receive',null])assert.equal(validateConfig({...active,receiver}).receiver,receiver);
  for(const feedback of [{...active.feedback,questions:[]},{...active.feedback,questions:['<!-- OAAP:END -->']},{...active.feedback,intended_use:''},{...active.feedback,secret:'value'}])assert.throws(()=>validateConfig({...active,feedback}));
  assert.throws(()=>validateConfig({...active,token:'value'}));
});

test('CLI apply/check and argument handling are local and explicit',async t=>{
  const {root,project}=await fixture(t);const f=await input(root,draft);
  assert.equal((await run(project,['--check'])).code,1);
  assert.equal((await run(project,['--config',f,'--apply'])).code,0);
  let r=await run(project,['--check']);assert.equal(r.code,0,r.stderr);assert.equal(JSON.parse(r.stdout).state,'awaiting_receiver');
  await input(root,active);r=await run(project,['--config',f,'--apply']);assert.equal(r.code,0,r.stderr);
  r=await run(project,['--check']);assert.equal(JSON.parse(r.stdout).state,'configured_unverified');assert.equal(JSON.parse(r.stdout).runtime_verified,false);
  for(const argv of [['--apply','--check'],['--wat'],['--config'],['--project',project],['--check','--config',f]])assert.equal((await run(project,argv)).code,1);
  assert.match((await run(project,['--help'])).stdout,/No network, Git or AI calls/);
  await assert.rejects(exec(process.execPath,[cli,'--config',f]),e=>e.code===1&&e.stderr.includes('--project is required'));
});

test('CLI network/DNS/child-process trap: preview/apply/check never contact endpoints or invoke Git',async t=>{
  const {root,project}=await fixture(t);const f=await input(root,active);
  const guard=path.join(root,'offline-guard.cjs');
  await fs.writeFile(guard,`const fail=()=>{throw Error('Unexpected network or child process');};
globalThis.fetch=fail;
for(const name of ['http','https']){const m=require('node:'+name);m.request=fail;m.get=fail;}
const net=require('node:net');net.connect=fail;net.createConnection=fail;net.Socket.prototype.connect=fail;
const dns=require('node:dns');dns.lookup=fail;dns.resolve=fail;dns.promises.lookup=fail;dns.promises.resolve=fail;
const cp=require('node:child_process');for(const key of ['spawn','spawnSync','exec','execSync','execFile','execFileSync','fork'])cp[key]=fail;
require('node:module').syncBuiltinESMExports();`);
  for(const argv of [['--config',f],['--config',f,'--apply'],['--check']]){
    const r=await run(project,argv,{env:{...process.env,NODE_OPTIONS:`--require=${guard}`}});assert.equal(r.code,0,r.stderr);
  }
});

async function interactive(root,argv,answers) {
  const tty=path.join(root,'tty-input.cjs');
  await fs.writeFile(tty,"Object.defineProperty(process.stdin,'isTTY',{value:true});");
  return new Promise((resolve,reject)=>{
    const child=spawn(process.execPath,['--require',tty,cli,...argv],{stdio:['pipe','pipe','pipe']});
    let stdout='',stderr='',step=0,cursor=0;
    const timer=setTimeout(()=>{child.kill();reject(Error('Interactive prompt timed out: '+stdout));},7000);
    child.stdout.on('data',data=>{
      stdout+=data;
      if(step<answers.length){const [prompt,answer]=answers[step];const i=stdout.indexOf(prompt,cursor);if(i>=0){cursor=i+prompt.length;step++;child.stdin.write(answer+'\n');}}
    });
    child.stderr.on('data',data=>stderr+=data);
    child.on('error',e=>{clearTimeout(timer);reject(e);});
    child.on('close',code=>{clearTimeout(timer);resolve({code,stdout,stderr,answered:step});});
  });
}
test('interactive mode rejects an empty target instead of adopting the OAAP checkout',async t=>{
  const {root}=await fixture(t);
  const r=await interactive(root,[],[['Project path (required; no default):','']]);
  assert.equal(r.code,1);assert.match(r.stderr,/explicit project path is required/);
  assert.equal(r.stdout.includes('Canonical GitHub URL'),false);
});
test('interactive defaults preview, explicit confirmation and --apply all preserve the local-only contract',async t=>{
  const {root,project}=await fixture(t);
  const answers=[['Project path (required; no default):',project],['Canonical GitHub URL:','https://github.com/acme/project'],['Receiver HTTPS URL (Enter to skip):',''],['Feedback destination HTTPS URL',''],['Number of feedback questions',''],['Question 1',''],['Question 2',''],['Question 3',''],['Intended feedback use','']];
  let r=await interactive(root,[],[...answers,['Write these local files?','no']]);
  assert.equal(r.code,0,r.stderr);assert.match(r.stdout,/Cancelled; no files written/);assert.deepEqual(await tree(project),{});
  r=await interactive(root,[],[...answers,['Write these local files?','yes']]);
  assert.equal(r.code,0,r.stderr);assert.match(r.stdout,/Applied local configuration: awaiting_receiver/);
  const state=JSON.parse(await fs.readFile(path.join(project,'.oaap/onboarding.json'),'utf8'));
  assert.equal(state.feedback.destination,'https://github.com/acme/project/issues');
  assert.match(state.feedback.questions[2],/configured destination/);assert.equal(state.feedback.questions[2].includes('publicly'),false);
  const before=await tree(project);
  r=await interactive(root,['--apply'],answers);
  assert.equal(r.code,0,r.stderr);assert.equal(r.stdout.includes('Write these local files?'),false);assert.deepEqual(await tree(project),before);
});
