// Explicit Google receiver test driver. Synthetic events remain source: demo.
// Set OAAP_DEMO_STATE to the SAME private file to resume after interruption.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {runDemo} from './demo-client.mjs';
const out = fileURLToPath(new URL('../outputs/receiver-demo/', import.meta.url));
const stateFile = process.env.OAAP_DEMO_STATE || path.join(out, 'retry-state.local.json');
try {
  const evidence = await runDemo({endpoint:process.env.OAAP_RECEIVER_URL, stateFile, repository:process.env.OAAP_REPOSITORY || 'https://github.com/example/demo'});
  await fs.mkdir(out, {recursive:true,mode:0o700});
  await fs.writeFile(path.join(out,'live-demo-evidence.json'),JSON.stringify(evidence,null,2),{mode:0o600});
  console.log(JSON.stringify(evidence,null,2));
  console.log('Synthetic after-use relay: ' + evidence.feedback_demo.message);
} catch (error) {
  // Do not print raw server responses, Git stderr, endpoints, prompts or keys.
  console.error('Demo incomplete: ' + (error.code && /^[a-z_]+$/.test(error.code) ? error.code : 'local_operation_failed') + '. Preserve the private retry state; resume with the same OAAP_DEMO_STATE, repository and endpoint.');
  process.exitCode = 1;
}
