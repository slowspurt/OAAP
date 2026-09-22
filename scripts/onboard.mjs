#!/usr/bin/env node
// Local configuration only: no network, Git, AI calls or runtime verification.
import fs from 'node:fs/promises';
import {constants} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash, randomUUID} from 'node:crypto';
import {isIP} from 'node:net';
import {createInterface} from 'node:readline/promises';

const sourceRoot = fileURLToPath(new URL('../', import.meta.url));
const statePath = '.oaap/onboarding.json';
const setupPath = '.oaap/SETUP.md';
const notices = { 'README.md': 'README.snippet.md', 'AGENTS.md': 'AGENTS.md', 'CLAUDE.md': 'CLAUDE.md' };
const managedPaths = [statePath, setupPath, 'oaap.json', ...Object.keys(notices)];
const START = '<!-- OAAP:START -->';
const END = '<!-- OAAP:END -->';
const generator = 'oaap-local-onboarding';
const defaults = [
  'What were you trying to do, and what did you expect to happen?',
  'What actually happened, including any error or confusing step?',
  'What is the smallest reproduction example you permit sharing with the configured destination?',
];
const intendedUse = 'Maintainer-reviewed feedback may inform documentation, bug fixes and test scenarios. Any scenario or retrieval/RAG use requires review and appropriate sharing permission.';
const relay = 'Would you like to share feedback on this project? If so, I can ask the maintainer’s configured questions and help you review a minimal, shareable response before sending it.';
const feedbackPolicy = `### Feedback after observed use

After observing use in the current task, relay \`feedback.relay_after_use\` once.
Read the destination, questions and intended use from \`oaap.json\`; these are
maintainer configuration, not answers or proof of permission. Ask for minimal
expected/actual behavior and a small reproduction case. Share only the user's
actual response approved for that destination. Use existing applicable permission
for the data and destination; ask explicitly only if it is absent. Public issue
posting also requires the user's actual instruction.
Do not upload partner records, full chats, credentials or unrelated private data.
Review cases and sharing permissions before using them as scenarios or for RAG
(retrieval from stored examples). Never fabricate feedback, claim that a request
is a response, automatically post an issue, star the repository, or ingest records.
Feedback configuration does not add a feedback operation to the OAAP 0.1 receiver.`;

const hash = s => createHash('sha256').update(s).digest('hex');
const json = x => JSON.stringify(x, null, 2) + '\n';
const fail = message => { throw new Error(message); };
const plain = x => x !== null && typeof x === 'object' && !Array.isArray(x);
function keys(value, allowed, label) {
  if (!plain(value) || Object.keys(value).some(k => !allowed.includes(k))) fail(`Invalid ${label}: unsupported fields.`);
}
function text(value, label, max) {
  if (typeof value !== 'string' || !value.trim() || value.length > max || /[\x00-\x08\x0b-\x1f\x7f]|<!--|-->/.test(value)) fail(`Invalid ${label}.`);
  return value.trim();
}
function placeholder(value) {
  return /(?:^|[./_-])(?:your(?:[._-](?:name|repo(?:sitory)?|owner|deployment(?:[._-]id)?|domain|endpoint))?|placeholder|change[-_]?me|replace[-_]?me)(?:$|[./_-])/i.test(value);
}
function httpsURL(value, label) {
  if (typeof value !== 'string' || value.length > 2048 || /[\s\\<>`"\x00-\x1f]/.test(value)) fail(`Invalid ${label}: use a public HTTPS URL without credentials or placeholders.`);
  let u;
  try { u = new URL(value); } catch { fail(`Invalid ${label}: expected HTTPS URL.`); }
  const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (u.protocol !== 'https:' || u.username || u.password || u.hash || !host || placeholder(decodeURIComponentSafe(value)) || /^(?:example\.(?:com|org|net))$|(?:^|\.)(?:localhost|local|internal|invalid|test|example)$/.test(host) || (!host.includes('.') && !isIP(host))) fail(`Invalid ${label}: use a public HTTPS URL without credentials or placeholders.`);
  if (isIP(host) === 4) {
    const [a,b] = host.split('.').map(Number);
    if (a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || (a === 198 && [18,19].includes(b))) fail(`Invalid ${label}: private or special-use IP address.`);
  }
  // Restrict IPv6 literals to global unicast; reject mapped IPv4 and local ranges.
  if (isIP(host) === 6 && (!/^[23][0-9a-f]{3}:/.test(host) || /^2001:db8:/.test(host))) fail(`Invalid ${label}: private or special-use IP address.`);
  return value;
}
function decodeURIComponentSafe(s) { try { return decodeURIComponent(s); } catch { fail('Invalid URL encoding.'); } }
export function validateConfig(input) {
  keys(input, ['repository','receiver','feedback'], 'configuration');
  const repository = httpsURL(input.repository, 'repository');
  if (repository.length > 300 || !/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository) || /\.git$/.test(repository) || repository.split('/').slice(3).some(x => x === '.' || x === '..')) fail('Repository must be the canonical https://github.com/OWNER/REPO URL, at most 300 characters (no .git or trailing slash).');
  const receiver = input.receiver === null ? null : httpsURL(input.receiver, 'receiver');
  keys(input.feedback, ['destination','questions','intended_use'], 'feedback');
  const destination = httpsURL(input.feedback.destination, 'feedback destination');
  const questions = input.feedback.questions;
  if (!Array.isArray(questions) || questions.length < 1 || questions.length > 20) fail('Feedback needs 1–20 questions.');
  return {repository, receiver, feedback:{destination, questions:questions.map(q => text(q, 'feedback question', 1000)), intended_use:text(input.feedback.intended_use, 'feedback intended_use', 4000)}};
}

async function readRegular(file, label) {
  let stat;
  try { stat = await fs.lstat(file); } catch (e) { if (e.code === 'ENOENT') return null; throw e; }
  if (stat.isSymbolicLink() || !stat.isFile() || stat.nlink !== 1) fail(`Refusing symlink, linked or non-regular file: ${label}.`);
  if (stat.size > 2 * 1024 * 1024) fail(`File too large for local onboarding: ${label}.`);
  const handle = await fs.open(file, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const bytes = await handle.readFile();
    const decoded = bytes.toString('utf8');
    if (!Buffer.from(decoded).equals(bytes)) fail(`File must be UTF-8: ${label}.`);
    return decoded;
  } finally { await handle.close(); }
}
async function inspect(project) {
  const stat = await fs.lstat(project);
  if (stat.isSymbolicLink() || !stat.isDirectory()) fail('Project must be an existing directory, not a symlink.');
  const directory = path.join(project, '.oaap');
  try {
    const s = await fs.lstat(directory);
    if (s.isSymbolicLink() || !s.isDirectory()) fail('Refusing symlink or non-directory .oaap.');
  } catch (e) { if (e.code !== 'ENOENT') throw e; }
  return Object.fromEntries(await Promise.all(managedPaths.map(async f => [f, await readRegular(path.join(project,f),f)])));
}
function parseJSON(raw, label) { try { return JSON.parse(raw); } catch { fail(`Invalid JSON: ${label}.`); } }
function block(raw, file) {
  if (raw === null) return null;
  const starts = [...raw.matchAll(/<!-- OAAP:START -->/g)], ends = [...raw.matchAll(/<!-- OAAP:END -->/g)];
  const markers = raw.match(/<!--\s*OAAP\s*:\s*(?:START|END)/gi) || [];
  if (!markers.length) return null;
  if (starts.length !== 1 || ends.length !== 1 || markers.length !== 2 || starts[0].index >= ends[0].index) fail(`Malformed or duplicate managed markers: ${file}.`);
  const start = starts[0].index, end = ends[0].index + END.length;
  if ((start && raw[start-1] !== '\n') || (end < raw.length && !/^\r?\n/.test(raw.slice(end)))) fail(`Managed markers must occupy their own lines: ${file}.`);
  return {start,end,value:raw.slice(start,end)};
}
function previous(snapshot) {
  const raw = snapshot[statePath];
  if (raw === null) {
    if (snapshot[setupPath] !== null || snapshot['oaap.json'] !== null) fail('Existing unmanaged OAAP configuration: preserve it and review manually.');
    for (const f of Object.keys(notices)) if (block(snapshot[f],f)) fail(`Untracked managed block: ${f}.`);
    return null;
  }
  const state = parseJSON(raw, statePath);
  keys(state, ['schema_version','generator','state','repository','receiver','feedback','config_hash','managed'], 'saved onboarding state');
  if (state.schema_version !== 1 || state.generator !== generator) fail('Existing onboarding state is not managed by this CLI.');
  const config = validateConfig({repository:state.repository,receiver:state.receiver,feedback:state.feedback});
  if (state.config_hash !== hash(json(config)) || state.state !== (config.receiver ? 'configured_unverified' : 'awaiting_receiver')) fail('Onboarding state was manually changed or is inconsistent.');
  const expected = [setupPath, ...(config.receiver ? ['oaap.json',...Object.keys(notices)] : [])];
  if (!plain(state.managed) || JSON.stringify(Object.keys(state.managed).sort()) !== JSON.stringify(expected.sort())) fail('Invalid managed-file provenance.');
  for (const f of expected) {
    const content = f in notices ? block(snapshot[f],f)?.value : snapshot[f];
    if (typeof content !== 'string' || state.managed[f] !== hash(content)) fail(`Managed content changed or missing: ${f}. No files written.`);
  }
  if (!config.receiver) {
    if (snapshot['oaap.json'] !== null) fail('Unmanaged active oaap.json conflicts with draft setup.');
    for (const f of Object.keys(notices)) if (block(snapshot[f],f)) fail(`Untracked managed block: ${f}.`);
  }
  return state;
}
async function manifest(config) {
  const base = parseJSON(await fs.readFile(path.join(sourceRoot,'templates/repository/oaap.json'),'utf8'), 'OAAP manifest template');
  return {...base,repository:config.repository,receiver:config.receiver,feedback:{relay_after_use:relay,automatic_star:false,...config.feedback}};
}
function setup(config) {
  const policy = config.receiver ? feedbackPolicy : 'Once a receiver is configured and actual use is observed, relay a feedback request once using these saved questions. Ask for minimal expected/actual behavior and a shareable reproduction. Share only actual human responses approved for the destination; public posting requires the user’s instruction. Never upload partner records, full chats or credentials. Review sharing permission before scenario or RAG use. Configuration does not collect feedback or add a receiver operation.';
  return `# OAAP local setup\n\nState: **${config.receiver ? 'configured_unverified' : 'awaiting_receiver'}**.\n\nThis is local configuration, not receiver deployment, verified reception or completed adoption.\n${config.receiver ? 'The manifest and agent notices are configured. Verify the receiver and actual access/download flow before claiming adoption.' : 'No active oaap.json or agent notices have been installed. Supply a receiver when ready.'}\n\n## Maintainer-owned receiver\n\nFrom your local OAAP clone (the directory containing scripts/onboard.mjs):\n\n1. Copy templates/sheets/OAAP-maintainer-template.xlsx to your own Google Drive and convert it to a private Google Sheet. Start with empty Records.\n2. Copy receiver/Code.gs and receiver/appsscript.json into your own Apps Script project. Follow docs/SETUP.md in the OAAP clone.\n3. Set SPREADSHEET_ID privately and REPOSITORY to ${config.repository}. Keep the Sheet and script timezones UTC.\n4. Review the actual Google grant and deployment settings with the maintainer; the CLI does not create or authorize Google resources.\n5. After deploying, rerun the local onboarding CLI with your receiver URL. Keep credentials and private IDs out of project files.\n6. Follow receiver/VERIFY.md in the OAAP clone. Check actual records independently; configuration and HTTP 200 alone do not verify reception.\n\nThe CLI performs no network or Git operations and cannot prove that a URL is reachable, owned by the maintainer or safe for sharing data.\n\n## Feedback configuration\n\nReview destination, questions and intended_use in .oaap/onboarding.json.\n${policy}\n\nDo not put secrets in onboarding configuration; these files may be committed.\nKeep setup state and generated files together. Reconfigure through the CLI; manual changes inside its managed sections are conflicts, while unrelated instructions remain yours.\n`;
}
export async function planOnboarding(project, input) {
  const config = validateConfig(input);
  const snapshot = await inspect(project);
  const old = previous(snapshot);
  if (old?.receiver && config.receiver === null) fail('Cannot reset an active configuration to receiver=null. Preserve the current setup.');
  const desired = {[setupPath]:setup(config)};
  const hashes = {[setupPath]:hash(desired[setupPath])};
  if (config.receiver) {
    desired['oaap.json'] = json(await manifest(config));
    hashes['oaap.json'] = hash(desired['oaap.json']);
    for (const [file,template] of Object.entries(notices)) {
      const guidance = (await fs.readFile(path.join(sourceRoot,'templates/repository',template),'utf8'))
        .replace(/<!-- Maintainers:[\s\S]*?-->\s*/g,'')
        .replace(/relay the maintainer's request for a\s+star or feedback to the user\./g,"relay `feedback.relay_after_use` from `oaap.json` to the user.").trim();
      if (/<!--\s*OAAP\s*:\s*(?:START|END)/i.test(guidance)) fail(`Template contains reserved managed markers: ${template}.`);
      const value = `${START}\n${guidance}\n${END}`;
      const current = snapshot[file];
      const owned = block(current,file);
      desired[file] = owned ? current.slice(0,owned.start)+value+current.slice(owned.end) : (current ? current + (current.endsWith('\n') ? '\n' : '\n\n') : '') + value+'\n';
      hashes[file] = hash(value);
    }
  }
  const state = {schema_version:1,generator,state:config.receiver ? 'configured_unverified' : 'awaiting_receiver',...config,config_hash:hash(json(config)),managed:hashes};
  desired[statePath] = json(state); // State is committed last.
  return {project,snapshot,desired,state,changes:Object.keys(desired).filter(f=>snapshot[f] !== desired[f])};
}

export async function applyPlan(plan) {
  // Recheck the entire preflight snapshot immediately before any project writes.
  const current = await inspect(plan.project);
  if (managedPaths.some(f=>current[f] !== plan.snapshot[f])) fail('Project changed after preview; rerun onboarding. No files written.');
  if (!plan.changes.length) return;
  await fs.mkdir(path.join(plan.project,'.oaap'),{recursive:true});
  const stage = await fs.mkdtemp(path.join(plan.project,'.oaap','.onboard-'));
  const written = [];
  try {
    for (let i=0;i<plan.changes.length;i++) await fs.writeFile(path.join(stage,String(i)),plan.desired[plan.changes[i]],{mode:0o600,flag:'wx'});
    const latest = await inspect(plan.project);
    if (managedPaths.some(f=>latest[f] !== plan.snapshot[f])) fail('Project changed while staging; no planned files written.');
    for (let i=0;i<plan.changes.length;i++) {
      const f=plan.changes[i], target=path.join(plan.project,f);
      if (plan.snapshot[f] !== null) await fs.chmod(path.join(stage,String(i)),(await fs.stat(target)).mode & 0o777);
      await fs.rename(path.join(stage,String(i)),target); written.push(f);
    }
  } catch (error) {
    // Recover our own changes after an I/O failure; never overwrite concurrent edits.
    for (const f of written.reverse()) {
      const target=path.join(plan.project,f);
      if (await readRegular(target,f) !== plan.desired[f]) continue;
      if (plan.snapshot[f] === null) await fs.unlink(target);
      else {
        const recovery=path.join(stage,randomUUID());
        await fs.writeFile(recovery,plan.snapshot[f],{mode:(await fs.stat(target)).mode & 0o777,flag:'wx'});
        await fs.rename(recovery,target);
      }
    }
    throw error;
  } finally { await fs.rm(stage,{recursive:true,force:true}); }
}
export async function checkOnboarding(project) {
  const snapshot = await inspect(project);
  const state = previous(snapshot);
  if (!state) fail('No local onboarding configuration found.');
  if (state.receiver && snapshot['oaap.json'] !== json(await manifest(state))) fail('Manifest does not match current configuration/template. Reconfigure locally.');
  return {state:state.state,local_consistency:true,runtime_verified:false,message:state.receiver ? 'Locally configured; receiver and real access/download flow remain unverified.' : 'Draft setup only; receiver is still required.'};
}

const help = `OAAP local onboarding (Node.js >=22)\n\nnode scripts/onboard.mjs [--project PATH] [--config JSON_FILE] [--apply] [--check] [--help]\n\n--config reads a JSON file: {repository,receiver:null|string,feedback:{destination,questions:string[],intended_use:string}}. --project is required with --config or --check.\nConfig mode previews by default; --apply writes the reviewed plan.\nWithout --config/--check, asks for configuration and confirms after preview (unless --apply).\n--check checks only local consistency; it never certifies a working receiver.\nNo receiver: only .oaap/onboarding.json and .oaap/SETUP.md, state awaiting_receiver.\nWith receiver: also oaap.json and managed README.md/AGENTS.md/CLAUDE.md notices, state configured_unverified.\nUse public HTTPS URLs without credentials/placeholders. No network, Git or AI calls.\nNever place secrets, partner records or full chats in this configuration.\n`;
function args(argv) {
  const options={};
  for(let i=0;i<argv.length;i++) {
    const arg=argv[i];
    if (!['--project','--config','--apply','--check','--help'].includes(arg) || arg in options) fail('Unknown or duplicate option. Use --help.');
    if (['--project','--config'].includes(arg)) {
      const value=argv[++i];if(!value || value.startsWith('--')) fail(`Missing value for ${arg}.`);options[arg]=value;
    } else options[arg]=true;
  }
  if(options['--check'] && (options['--config'] || options['--apply'])) fail('--check cannot be combined with --config or --apply.');
  if((options['--config'] || options['--check']) && !options['--project']) fail('--project is required with --config or --check.');
  return options;
}
function preview(plan) {
  console.log(json({mode:'preview',state:plan.state.state,runtime_verified:false,repository:plan.state.repository,receiver:plan.state.receiver,feedback:plan.state.feedback,files:plan.changes.map(f=>({path:f,action:plan.snapshot[f]===null?'create':'update'}))}));
  console.log('Local configuration only. No deployment, reception or adoption has been verified.');
}
export async function main(argv=process.argv.slice(2)) {
  if(Number(process.versions.node.split('.')[0]) < 22) fail('Node.js 22 or newer is required.');
  const options=args(argv);
  if(options['--help']) {console.log(help);return;}
  if(options['--check']) {console.log(json(await checkOnboarding(path.resolve(options['--project']))));return;}
  if(options['--config']) {
    const raw=await readRegular(path.resolve(options['--config']),'configuration input');
    if(raw === null) fail('Configuration input does not exist.');
    const project=path.resolve(options['--project']);
    const configFile=path.resolve(options['--config']);
    if(managedPaths.some(f=>path.join(project,f) === configFile)) fail('Keep input configuration separate from generated files.');
    const plan=await planOnboarding(project,parseJSON(raw,'configuration input'));preview(plan);
    if(options['--apply']) {await applyPlan(plan);console.log(`Applied local configuration: ${plan.state.state}. Runtime remains unverified.`);}
    return;
  }
  if(!process.stdin.isTTY) fail('Interactive mode needs a terminal; use --project and --config for automation.');
  const rl=createInterface({input:process.stdin,output:process.stdout});
  try {
    console.log('Configure OAAP locally. Do not enter secrets or private conversation records.');
    const ask=async(label,value='')=>(await rl.question(`${label}${value ? ` [${value}]` : ''}: `)).trim() || value;
    const projectInput=options['--project'] || await ask('Project path (required; no default)');
    if(!projectInput) fail('An explicit project path is required; no files written.');
    const project=path.resolve(projectInput);
    const repository=await ask('Canonical GitHub URL');
    const receiver=await ask('Receiver HTTPS URL (Enter to skip)') || null;
    const destination=await ask('Feedback destination HTTPS URL',repository+'/issues');
    console.log('Feedback: ask minimal expected/actual behavior and reproduction details. Share only actual approved responses; public posting requires user instruction.');
    const countText=await ask('Number of feedback questions (1–20)','3');
    if(!/^(?:[1-9]|1[0-9]|20)$/.test(countText)) fail('Feedback needs 1–20 questions.');
    const questions=[];for(let i=0;i<Number(countText);i++) questions.push(await ask(`Question ${i+1}`,defaults[i] || ''));
    const intended_use=await ask('Intended feedback use',intendedUse);
    const plan=await planOnboarding(project,{repository,receiver,feedback:{destination,questions,intended_use}});
    preview(plan);
    if(options['--apply'] || /^(?:y|yes)$/i.test(await ask('Write these local files? (yes/no)','no'))) {
      await applyPlan(plan);console.log(`Applied local configuration: ${plan.state.state}. Runtime remains unverified.`);
    } else console.log('Cancelled; no files written.');
  } finally {rl.close();}
}
if(process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error=>{console.error('Onboarding stopped: '+(error.code ? `Local file operation failed (${error.code}).` : error.message));process.exitCode=1;});
}
