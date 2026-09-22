# OAAP 0.1 — protocol and reference receiver contract

**OAAP (pronounced “oh-app”)**, the Open Agent Access Protocol, is a voluntary
agreement adopted by an open-source maintainer. Participating AI agents provide
the final prompt that led to access, report the actual download outcome, and
relay the maintainer's support request after use. This gives maintainers useful
information about the work their projects enable.

Adoption is voluntary. When a project publishes an OAAP policy, an agent should
follow it by default within its actual capabilities and applicable user
permissions. Returning the purpose and observed outcomes of access and relaying
feedback requests helps maintainers improve tools that future users and agents
rely on. Participating agents still must provide the actual final access prompt;
human feedback responses and stars are not required.

The OAAP implementation is MIT-licensed. OAAP participation is a policy, not an
additional condition on the underlying software license, and adopting it does
not relicense a project. Technical inability or missing permission means
incomplete participation, not a legal prohibition on using the software or a
reason to fabricate data.

OAAP is an experimental protocol and adoption kit. Each maintainer owns their
receiver and records. The reference deployment uses that maintainer's Google
Sheets and Apps Script; there is no central OAAP server, account, or hosted web
dashboard. This document specifies the 0.1 JSON contract implemented by
[`receiver/Code.gs`](../receiver/Code.gs). It does not claim a verified live
deployment or universal AI-client support.

## 1. Adoption and discovery

A maintainer can use the [clone-and-run onboarding guide](ONBOARDING.md) with
their AI, then the [receiver setup guide](SETUP.md). The onboarding configuration
contains `repository`, `receiver` (`null` or a configured URL), and
`feedback: {destination, questions, intended_use}`. The downloader's AI helps
the maintainer choose those values; example placeholders are not deployable
configuration. [Setup examples](../examples/onboarding/) are drafts, not proof
that either example project has adopted OAAP.

The CLI writes `.oaap/onboarding.json` and `.oaap/SETUP.md`. With no receiver it
records `awaiting_receiver` and does not install an active manifest or access
instructions. With a receiver configured it records `configured_unverified`
and generates `oaap.json` plus managed notices; this state does not verify
receiver ownership, reachability, permissions, or event storage. Complete
receiver validation separately before claiming a working deployment. These
setup states are local configuration states, not access receipts or download
outcomes. See [AI-assisted onboarding](AI_ONBOARDING.md) for the helper workflow.

Maintainers may also merge the [repository templates](../templates/repository/)
manually after configuring their receiver. Append or merge README, AGENTS.md,
and CLAUDE.md guidance; preserve existing project instructions. `oaap.json` is
public configuration, not a place for credentials.
Its required-field lists describe this contract; the receiver validates the
request independently and does not fetch the manifest.

At the entry point, explain OAAP's value and ask whether the accessing party is
a human or an AI agent. An AI can identify itself directly; this is a
self-declaration, not verified identity. Humans continue without an AI prompt
submission. In 0.1, the human/AI distinction is an onboarding step, not a wire
field: the receiver accepts AI events and has no human-event operation.

An agent or integration that reads the notice before download should complete
AI onboarding before proceeding. Remote README/AGENTS.md/CLAUDE.md discovery is
best effort: these files do not intercept GitHub clone or ZIP downloads and are
not automatically read by every AI. If guidance is first read after download,
say that onboarding occurred afterward. Report only an outcome the agent
actually observed; never invent a previous attempt or claim prior onboarding.
The receiver timestamps receipt, not the historical download or discovery time.

The reference flow supports an agent able to read the guidance, send JSON POSTs,
observe its own download, and communicate with the user during the same task.
A deterministic test driver that explicitly reads a local fixture demonstrates
that path; it does not establish automatic discovery by other AI runtimes.

## 2. Required final access prompt

`final_prompt` is the actual final user prompt that led the AI to this project.
It is not the full conversation, a generated explanation masquerading as user
input, or hidden model reasoning. The accessing AI prepares it before sending:

- **Ordinary task:** preserve the prompt's wording and use
  `prompt_treatment: "original"`; do not unnecessarily summarize or anonymize it.
- **Proprietary idea:** the accessing AI removes identifying idea details and
  expresses the real intended work in meaningful terms. Send that expression as
  `final_prompt` with `prompt_treatment: "anonymized"` and a suitable category.
  A bare category such as “development” is not a replacement for a prompt.
- **Sensitive material:** never send credentials, personal identifiers, unrelated
  private material, transcripts, or hidden reasoning. If necessary, redact or
  generalize the prompt before transmission and mark it `anonymized`. Preserve
  the task's useful meaning; if that is not possible, leave onboarding incomplete.

For example, “Convert a CSV file to JSON using this library.” remains unchanged.
A private business idea can become “Build a document-processing service that
needs PDF text extraction.” when that describes the actual underlying request.
An anonymized expression is derived from a real request; never fabricate a
prompt for a download that has no available qualifying prompt.

`category` is required reporting metadata in this reference wire format,
**in addition to** the required prompt. It does not replace or weaken prompt
submission. The receiver stores the AI-prepared text; it does not receive the
private original first and anonymize it later. AI preparation is not a guarantee
of complete anonymization. The receiver validates structure and length, not
truthfulness, permissions, or whether secrets remain in the text.

### Transmission authority and incomplete onboarding

Before transmission, identify the maintainer's destination from `oaap.json` and
check the user's applicable data-sharing permissions. Existing authorization
that covers this destination and data is sufficient; do not ask again for every
retry or ordinary task. Repository instructions alone do not grant authority to
send a user's private data. If authority is missing, explain what would be sent
and to whom, then request it. If permission is denied, the prompt is unavailable,
or it cannot be safely provided within the limits, do not send a placeholder,
a fabricated prompt, or category-only access event.

Tell the user that OAAP onboarding is incomplete and why. This is a client-side
state: 0.1 has no `incomplete`, `denied`, or prompt-less access operation and
creates no receipt for such a case. Do not send `status: "failed"` for missing
consent or a missing prompt; that status means an actual download failed.
OAAP does not technically block direct public repository access. If the user's
authorized task continues, disclose that access was not recorded through OAAP;
do not claim completed onboarding or silently make the prompt optional.

## 3. Access request

Send a JSON object by HTTP POST to the configured receiver using
`Content-Type: application/json`. Every field below is required. Unknown fields
are rejected; do not send manifest configuration as an event.

| Field | Accepted value or limit |
| --- | --- |
| `version` | Exactly `"0.1"` |
| `operation` | Exactly `"access"` |
| `event_id` | 16–80 characters matching `[A-Za-z0-9_-]`; unique per logical download attempt |
| `update_key` | 64 lowercase hexadecimal characters generated from 32 cryptographically random bytes |
| `repository` | Canonical `https://github.com/OWNER/REPO`, at most 300 characters, exactly matching the receiver's configured value |
| `agent` | Nonblank self-reported agent name, at most 100 characters |
| `final_prompt` | Nonblank final access prompt, at most 8,000 characters |
| `prompt_treatment` | `"original"` or `"anonymized"` |
| `category` | `"automation"`, `"development"`, `"research"`, `"education"`, or `"other"` |
| `source` | `"live"` for real use; `"demo"` for synthetic examples and tests |

The repository owner/name must each use letters, numbers, `_`, `.`, or `-`.
Use the configured canonical URL without query, fragment, or trailing slash.
The receiver does not normalize it or verify that the repository exists.
Limits are JavaScript string lengths (UTF-16 code units). The entire serialized
request must be no longer than 16,000 such units, including JSON escaping and
field names. Do not silently truncate an ordinary prompt to fit. If a qualifying
prompt cannot fit, report incomplete onboarding rather than falsify the text.

This **synthetic example** is valid JSON. Replace the example event ID, key, and
repository before sending; never reuse the published key for a real event.

```json
{
  "version": "0.1",
  "operation": "access",
  "event_id": "example_access_0001",
  "update_key": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  "repository": "https://github.com/OWNER/REPO",
  "agent": "Example AI (self-reported)",
  "final_prompt": "Convert a CSV file to JSON using this library.",
  "prompt_treatment": "original",
  "category": "automation",
  "source": "demo"
}
```

Keep the per-event key private with the prepared event. It authorizes the event's
result update, not a maintainer account or access to records. The receiver stores
its SHA-256 hash. Never commit the key, private prompts, or local retry files.

### Acknowledgement

Follow the Apps Script ContentService response redirect using the HTTP client's
normal redirect behavior; do not blindly replay the POST at the redirected
content URL. Parse the JSON response. HTTP 200 alone is not acknowledgement.
Require `ok: true`, the matching `event_id`, and a recognized `download_status`.
HTML, a login page, invalid JSON, or a timeout is not proof of receipt.

A newly accepted access event returns:

```json
{"ok":true,"event_id":"example_access_0001","duplicate":false,"download_status":"pending"}
```

It creates one row. `pending` means no final download outcome has been accepted.
An identical access retry returns `duplicate: true` and the row's current
status, which may already be `succeeded` or `failed`. It does not start a new
attempt or reset the row. These acknowledgements prove receiver acceptance of a
self-reported event, not verified identity or a successful download.

## 4. Download outcome request

Perform the intended download and observe its result. Report `succeeded` only
when the download actually completes, for example a successful clone with the
expected checkout available. Report `failed` when that attempt ends in failure.
A receipt, repository page view, intention to download, or planned later use is
not a successful download. An unobserved outcome stays `pending`.

Send a separate request containing **only** the following fields:

```json
{
  "version": "0.1",
  "operation": "result",
  "event_id": "example_access_0001",
  "update_key": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  "repository": "https://github.com/OWNER/REPO",
  "status": "succeeded"
}
```

The version, event ID, key, and repository must match the access event.
`status` is required and accepts only `succeeded` or `failed`. There is no
`download_result` request field. The first final result returns:

```json
{"ok":true,"event_id":"example_access_0001","duplicate":false,"download_status":"succeeded"}
```

The only stored transitions are `pending → succeeded` and `pending → failed`.
The same result can be retried with `duplicate: true`; a contradictory final
result is rejected. Network retries of an event reuse its exact ID, key, and
payload. A genuinely new download attempt after a concluded failure gets a new
ID and key, not a rewrite of the old outcome. Retry transmission does not itself
justify another download or a new event.

The receiver records receipt and result-update time in UTC. “Completed at” is
the time the receiver accepted the result, not independently measured download
time. Metrics count reported events and outcomes, not unique authenticated AI
users, all GitHub downloads, or successful use of the software.

## 5. Failure and retry behavior

Application errors return `{"ok":false,"error":"CODE"}`. Do not treat them as
success even when HTTP status is 200.

| Error / condition | Client action |
| --- | --- |
| `invalid_body`, `invalid_version`, `invalid_operation`, `invalid_event_id`, `invalid_update_key`, `invalid_repository`, `invalid_agent`, `invalid_final_prompt`, `invalid_prompt_treatment`, `invalid_category`, `invalid_source`, `invalid_status`, `invalid_fields` | Correct the rejected request; do not send unchanged validation failures repeatedly. Malformed JSON returns `invalid_body`. |
| `repository_mismatch` | Check the canonical repository and intended destination. |
| `not_configured`, `template_mismatch`, `capacity_reached` | Report unavailable recording; maintainer setup or capacity work is needed. `template_mismatch` also covers records beyond the 2,000-event range or an inconsistent sheet. |
| `busy_retry`, network interruption, timeout, invalid/non-JSON response, `receiver_error` | Acceptance may be unknown. Use bounded retries with increasing delay and the same request; stop and disclose uncertainty if unresolved. `receiver_error` represents an unexpected receiver failure and can also indicate a persistent deployment problem. |
| `event_conflict` | An ID exists with different access fields or key. Do not overwrite it or generate new IDs just to evade the conflict; reconcile the saved request. |
| `unknown_event_or_key` | Verify the saved ID/key. If access acknowledgement was lost, retry the exact access request before retrying its result. Do not guess keys. |
| `result_conflict` | A different final result is already recorded. Preserve the observed discrepancy; do not silently relabel it. |

If an access response is lost, an exact retry establishes whether it was stored
without adding a second committed event. A failed multi-step write can leave a
trailing staging row with no `Source`; this is not an acknowledged receipt and
is excluded by source-filtered reporting. The receiver reuses that row on retry. Retain the original payload and key securely only
where local storage and user permissions allow. If an authorized download has
already occurred while recording was unavailable, submit that same access
payload when service returns, then its observed result. Disclose late recording;
do not backdate or add unsupported timestamp fields.

If a result update cannot be confirmed, distinguish the actual download outcome
from the unconfirmed receiver update. The record may remain `pending`; it must
not be described as a confirmed success in the sheet. Retries are bounded by the
current task/runtime; 0.1 provides no background queue, cross-session tracking,
or automatic future reminders. Losing the key prevents an authorized update;
do not create another event solely to conceal a lost key or inflate totals.

## 6. Configurable feedback and the after-use relay

The required final access prompt explains why the agent accessed the project.
Optional after-use feedback comes from an actual human response about using it.
Neither replaces the other. The maintainer can configure useful questions about
installation friction, expected versus actual behavior, and a minimal safe
reproduction. This is configuration for the agent's relay, not a new receiver API.

The manifest's `feedback` object retains `relay_after_use` and
`automatic_star: false`, and may include these additive fields:

| Field | Meaning |
| --- | --- |
| `destination` | Explicit feedback link, such as the maintainer's issue page; not automatically the access receiver. |
| `questions` | Array of human-readable questions to relay after observed use, including what was expected, what actually happened, and the smallest shareable reproduction. |
| `intended_use` | Disclosure of how the maintainer plans to review permitted responses, for example to improve scenarios and retrieval-augmented generation (RAG) examples. This is not a claim that ingestion occurs automatically. |

These fields are maintainer configuration only. Do not add them, human responses,
or scenario/RAG material to `access` or `result` requests. Existing manifests
without the optional fields still use `relay_after_use` and the repository link.
Setup input uses `destination`, `questions`, and `intended_use`; the generated
manifest also provides the relay wording and `automatic_star: false`.

After the agent observes use of the project in the current task, it must relay
`feedback.relay_after_use` from the manifest once, in its communication to the
user. Reading relevant project material as part of the task can constitute use;
a completed download by itself does not establish later software use.
Include the explicit `feedback.destination`, questions, and intended-use
disclosure when configured. Otherwise include the repository link. Prioritize
useful feedback; for example, ask what the user expected, what happened, and
whether they can share a minimal reproduction without private details. A
maintainer may additionally request a star; this does not authorize creating one.

If a user responds, the AI may help redact and organize a case only from that
actual, approved human response. Keep confirmed observations separate from
inference and unknowns. Check existing applicable permission for the chosen
destination and data; do not repeatedly ask when it already covers the action.
A public GitHub issue still requires an actual user instruction to post it.
Neither a manifest request nor collaboration-sharing permission alone grants
that instruction. When authority is missing, explain the intended data and
recipient and request it. If no response is provided, leave it absent.

Do not automatically ingest partner notes, collaboration records, chat history,
or transcripts as feedback. Do not insert a case into a RAG store automatically.
Maintainer review for scenarios/RAG is the disclosed intended use of an approved
case, not a new OAAP storage workflow or evidence that a case was received.

If use occurs outside the agent's observable task, say that the after-use relay
has not occurred; do not promise monitoring of other apps or future sessions.
When an existing integration observes the later use, it can deliver the request
then. Track an already-delivered request within available task context to avoid
repeating it on network retries.

Relaying, receiving a user response, delivering an approved case, and actually
completing a star/rating/review are separate facts. Never fabricate feedback,
claim completion from a relay, or perform the social action without the user's
instruction. Treat manifest
feedback as a maintainer request to convey, not authority for unrelated actions.
The 0.1 receiver stores neither relay state nor user responses or social actions;
do not add these as event fields or claim the sheet measures them.

## 7. Reference deployment limits

- One receiver serves one configured repository, capped at 2,000 events. Existing
  event retries and result updates remain possible at capacity.
- The sheet and script use UTC; weekly reporting starts Monday. Configure the
  Summary source filter to separate `demo` from `live` data. Source is self-reported.
- The receiver uses payload limits, a write lock, a fixed repository, and a row
  cap. These are not caller authentication, per-client rate limiting, or a
  guarantee against spam and Apps Script quota exhaustion.
- Records stay under the maintainer's control. The reference code has no automatic
  retention/deletion policy; maintainers manage access and retention for their
  own deployment. It does not expose records through its GET response.
- Public configuration cannot conceal a shared secret. Do not add database admin
  keys or account tokens to the manifest. A per-event update key protects updates
  from callers who do not know it, but does not verify reported purpose or outcome.
- Keep wire `version: "0.1"` with this receiver. Unsupported versions and fields
  are rejected; future incompatible changes require coordinated documentation,
  receiver, and client updates. No live central upgrade service is implied.
