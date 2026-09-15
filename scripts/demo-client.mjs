// Shared explicit demo driver. No automatic discovery, hosted service or background queue.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {randomBytes, randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const statuses = ['pending', 'succeeded', 'failed'];
function fail(code) { const error = new Error(code); error.code = code; return error; }
export function validateEndpoint(endpoint, localOnly = false) {
  const pattern = localOnly ? /^http:\/\/127\.0\.0\.1:\d+\/exec$/ : /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/;
  if (typeof endpoint !== 'string' || !pattern.test(endpoint)) throw fail('invalid_receiver_endpoint');
}
export async function saveState(file, state) {
  await fs.mkdir(path.dirname(file), {recursive:true, mode:0o700});
  const temporary = file + '.' + randomUUID() + '.tmp';
  const handle = await fs.open(temporary, 'wx', 0o600);
  try { await handle.writeFile(JSON.stringify(state, null, 2)); await handle.sync(); } finally { await handle.close(); }
  await fs.rename(temporary, file);
}
export function validateAck(body, event) {
  if (!body || body.ok !== true || body.event_id !== event.event_id || typeof body.duplicate !== 'boolean' || !statuses.includes(body.download_status)) throw fail('invalid_acknowledgement');
  if (event.operation === 'result' && body.download_status !== event.status) throw fail('result_acknowledgement_mismatch');
  return body;
}
export async function postEvent(endpoint, event, {attempts = 3, timeoutMs = 45000, delayMs = 500, fetchImpl = fetch} = {}) {
  let last = 'unconfirmed_receiver_update';
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const response = await fetchImpl(endpoint, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(event), redirect:'follow', signal:AbortSignal.timeout(timeoutMs)});
      if (!response.ok) throw fail('http_failure');
      let body; try { body = await response.json(); } catch { throw fail('non_json_response'); }
      if (body?.ok === false) {
        if (['busy_retry', 'receiver_error'].includes(body.error)) throw fail(body.error);
        // Do not print arbitrary server text (it could contain prompts or secrets).
        const error = fail('receiver_rejected_request'); error.permanent = true; throw error;
      }
      return validateAck(body, event);
    } catch (error) {
      if (error.permanent) throw error;
      last = ['http_failure', 'non_json_response', 'invalid_acknowledgement', 'result_acknowledgement_mismatch', 'busy_retry', 'receiver_error'].includes(error.code) ? error.code : 'network_unconfirmed';
      if (attempt + 1 < attempts) await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)));
    }
  }
  throw fail(last);
}
function git(args, cwd) {
  return execFileSync('git', args, {cwd, encoding:'utf8', stdio:['ignore','pipe','pipe'], timeout:30000});
}
async function prepare(endpoint, repository, localOnly) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'oaap-demo-'));
  const repo = path.join(root, 'repository'); await fs.mkdir(repo);
  for (const file of ['AGENTS.md','CLAUDE.md','oaap.json']) await fs.copyFile(new URL('../templates/repository/' + file, import.meta.url), path.join(repo, file));
  const manifest = JSON.parse(await fs.readFile(path.join(repo, 'oaap.json'), 'utf8'));
  manifest.repository = repository; manifest.receiver = endpoint;
  await fs.writeFile(path.join(repo, 'oaap.json'), JSON.stringify(manifest, null, 2));
  await fs.writeFile(path.join(repo, 'README.md'), '# OAAP local fixture\nSynthetic local Git repository for receiver verification.\n');
  git(['init','-q'], repo); git(['add','.'], repo);
  git(['-c','user.name=OAAP Test','-c','user.email=oaap-test@example.invalid','commit','-qm','Create synthetic fixture'], repo);
  const guidance = await fs.readFile(path.join(repo, 'AGENTS.md'), 'utf8');
  if (!guidance.includes('final user prompt')) throw fail('fixture_guidance_mismatch');
  const scenarios = [
    {name:'original', text:'Download this sample project and inspect its README.', treatment:'original', category:'education'},
    {name:'anonymized', text:'Evaluate an open-source component for a private workflow automation idea; business details have been removed.', treatment:'anonymized', category:'automation'},
    {name:'failed_clone', text:'Download this deliberately missing sample repository to test a failed download report.', treatment:'original', category:'education'}
  ];
  return {version:1, local_only:localOnly, endpoint, repository, root, repo, started_at:new Date().toISOString(), guidance_read_before_clone:true, feedback:manifest.feedback.relay_after_use,
    events:scenarios.map(s => ({name:s.name, phase:'prepared', clone_attempts:0,
      event:{version:'0.1',operation:'access',event_id:'demo_'+randomUUID(),update_key:randomBytes(32).toString('hex'),repository,agent:'OAAP test driver (synthetic example)',final_prompt:s.text,prompt_treatment:s.treatment,category:s.category,source:'demo'}}))};
}
export async function runDemo({endpoint, stateFile, repository = 'https://github.com/example/demo', localOnly = false, postOptions = {}}) {
  validateEndpoint(endpoint, localOnly);
  if (!/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) throw fail('invalid_repository');
  let state;
  try { state = JSON.parse(await fs.readFile(stateFile, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw fail('invalid_saved_state'); }
  if (!state) { state = await prepare(endpoint, repository, localOnly); await saveState(stateFile, state); }
  if (state.version !== 1 || state.endpoint !== endpoint || state.repository !== repository || state.local_only !== localOnly) throw fail('saved_state_configuration_mismatch');
  const persist = () => saveState(stateFile, state);
  const post = event => postEvent(endpoint, event, postOptions);
  for (const entry of state.events) {
    if (entry.phase === 'complete') continue;
    // Re-establish receipt with the same payload even after lost acknowledgements.
    const receipt = await post(entry.event);
    if (receipt.download_status !== (entry.result?.status ?? 'pending') && !(entry.result && receipt.download_status === 'pending')) throw fail('saved_outcome_mismatch');
    entry.access_confirmed = true; await persist();
    const repeated = await post(entry.event);
    if (!repeated.duplicate) throw fail('access_retry_not_deduplicated');
    if (repeated.download_status !== receipt.download_status) throw fail('access_retry_outcome_changed');
    entry.access_duplicate_confirmed = true; await persist();
    if (!entry.result) {
      // A terminated process during clone leaves outcome unknown. Never infer a
      // success or silently run a new download under the same event ID on resume.
      if (entry.phase === 'clone_started') throw fail('clone_outcome_unknown_manual_reconciliation_required');
      const destination = path.join(state.root, 'clone-' + entry.name);
      entry.clone_path = destination; entry.phase = 'clone_started'; entry.clone_attempts++; await persist();
      let status;
      try {
        git(['clone','--quiet','--',entry.name === 'failed_clone' ? path.join(state.root,'missing-repository') : state.repo,destination], state.root);
        status = 'succeeded';
      } catch { status = 'failed'; }
      // Persist the observed outcome before any result HTTP call or assertions.
      entry.result = {version:'0.1',operation:'result',event_id:entry.event.event_id,update_key:entry.event.update_key,repository,status};
      entry.phase = 'result_pending'; await persist();
    }
    if (entry.result.status === 'succeeded' && entry.readme_inspected === undefined) {
      try { entry.readme_inspected = (await fs.readFile(path.join(entry.clone_path,'README.md'),'utf8')).includes('OAAP local fixture'); }
      catch { entry.readme_inspected = false; }
      await persist();
    }
    await post(entry.result); entry.result_confirmed = true; await persist();
    const repeat = await post(entry.result);
    if (!repeat.duplicate) throw fail('result_retry_not_deduplicated');
    entry.result_duplicate_confirmed = true; entry.phase = 'complete'; await persist();
  }
  const expected = state.events.every(entry => entry.result.status === (entry.name === 'failed_clone' ? 'failed' : 'succeeded') && (entry.name === 'failed_clone' || entry.readme_inspected));
  if (!expected) throw fail('demo_expectation_failed_observed_results_preserved');
  state.finished_at = new Date().toISOString(); await persist();
  // No endpoint, keys, prompts or local filesystem identifiers in public output.
  return {verification_scope:localOnly ? 'LOCAL ONLY: real HTTP + Git; Google services mocked' : 'Google receiver acknowledgements + local Git fixture; independently inspect Sheets',
    google_sheet_independently_verified:false, repository_kind:'synthetic local Git fixture; not a GitHub download', started_at:state.started_at, finished_at:state.finished_at,
    guidance_read_before_clone:state.guidance_read_before_clone,
    events:state.events.map(entry => ({event_id:entry.event.event_id,scenario:entry.name,download_status:entry.result.status,access_confirmed:entry.access_confirmed,access_duplicate_confirmed:entry.access_duplicate_confirmed,result_confirmed:entry.result_confirmed,result_duplicate_confirmed:entry.result_duplicate_confirmed,clone_attempts:entry.clone_attempts,readme_inspected:entry.readme_inspected ?? false})),
    feedback_demo:{after_observed_use:state.events.some(e=>e.readme_inspected),message:state.feedback,synthetic:true,social_action_performed:false}};
}
