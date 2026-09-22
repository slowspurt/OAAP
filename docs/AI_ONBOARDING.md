# AI-assisted maintainer onboarding

Use this guide when a maintainer asks you to install OAAP in a project.
Run commands from the OAAP checkout and pass the target project explicitly.
This is setup guidance; do not manufacture an access event for installing OAAP.

## 1. Understand the project and the maintainer's intent

Read the target's existing instructions and README first. Confirm the target
folder and canonical repository URL from available context. Preserve unrelated
work and existing instructions. Do not change the product's runtime to add
telemetry as part of this setup.

Explain that OAAP records participating agents' final access prompts and
separately reported download outcomes directly in maintainer-owned storage.
Ordinary wording stays intact; proprietary details are anonymized by the
accessing AI before transmission. This does not collect all GitHub downloads.

Ask only for missing choices. A maintainer who already specified a project,
receiver, or feedback goal does not need to supply it again.

## 2. Configure useful after-use feedback

Find out which problems the maintainer wants to learn about. For example:
installation friction, missing responses, wrong-context matching, unexpected
collaboration behavior, or a feature that did not help the user's task.

Prepare a short question set covering expected behavior, observed behavior,
and minimal reproduction context. These are questions, not sample user answers.
Record the intended destination and intended use, such as maintainer review
for regression scenarios and retrieval/RAG material.

OAAP installation does not authorize exporting the target project's data.
For collaboration tools, do not harvest partner notes, conversations, tickets,
wiki entries, or captured prompts. A feedback case should come from an actual
user response whose sharing is authorized. Help the user prepare and redact a
draft if requested; do not infer that drafting permits posting a public issue.

The after-use agent should relay the configured invitation once after observed
use. User feedback is optional and separate from the required access prompt.
Do not demand a response, invent one, or treat a relayed question as collected
feedback. Review precedes any use in regression tests or retrieval datasets.
Use the optional [case template](../templates/feedback/CASE.md) to organize a
permitted response; leave missing observations or reproduction steps unknown.

## 3. Prepare and preview a configuration

Use the schema and commands in [ONBOARDING.md](ONBOARDING.md). Keep temporary
input files outside the target's tracked tree unless they are intentionally
public configuration. Never include credentials or real private failure cases.

Run the preview with `--project` and `--config` first. Inspect the planned paths
and setup state. Apply with `--apply` when local installation is within the
maintainer's request. The CLI uses built-in Node.js modules and needs no package
installation. It neither fetches project code nor sends requests to a receiver.

The generated state file contains provenance for conflict detection. Do not
edit its ownership data to force an overwrite. If existing configuration or
managed sections have changed, inspect and reconcile the difference rather
than discarding the maintainer's work.

## 4. Help with the maintainer's receiver

If no receiver exists, use `receiver: null`. Applying this config generates
only setup material with `awaiting_receiver`; do not announce active adoption.
Help the maintainer follow [SETUP.md](SETUP.md) in their own Google account.

Use a separate Sheet and script for the new repository. Do not retarget a
deployment that already serves another repository or overwrite earlier test
evidence. Keep the sheet private. Review actual account permission/deployment
prompts with the maintainer when required by your tools; do not claim that
cloning OAAP automatically grants Google permissions.

After deployment, set the receiver URL in the input config and re-run the
onboarder. Repository-visible configuration may contain the public receiver
address; it must not contain account tokens or update keys. Confirm the
canonical repository matches the receiver's Script Properties exactly.

## 5. Verify and hand off honestly

Run the CLI's `--check` for local consistency. A `configured_unverified` result
means files are configured, not that a live request succeeded. Then follow
[receiver/VERIFY.md](../receiver/VERIFY.md) with a separate private test-state
path and evidence folder so earlier test records are preserved.

The demo driver clones a synthetic local Git fixture. Even when its repository
setting names the target project, it is still a synthetic test. Independently
check the sheet; receipt alone is not a successful download.

For a real adoption check, use an actual user task and its qualifying final
prompt, obtain applicable transmission authority, and observe the real download
and use. Do not invent a task or substitute a demonstration prompt. Disclose
whether guidance was read before or after the download.

Report what was configured, what was actually verified, and what remains.
Do not mark the integration live based only on a URL or static file check.
Keep raw logs, update keys, private IDs, and account screenshots out of commits.
The current receiver stores access/result events only; a chosen feedback link
does not add a feedback API or an automatic RAG ingestion pipeline.
