# OAAP

**Open Agent Access Protocol** (pronounced “oh-app”) is a maintainer-owned
protocol and adoption kit for understanding why participating AI agents access
open-source projects, whether their downloads succeed, and how to ask users for
real usage feedback.

There is no central OAAP server, account system, database, or hosted dashboard.
Each adopting maintainer owns the receiver, records, and operating choices.

> [!IMPORTANT]
> OAAP 0.1 is an experimental proof of concept, not a released standard.
> Local tests are complete for the current implementation. Public evidence for
> the live Apps-Script-to-Sheets path is still pending.

## Why OAAP

AI-assisted use can leave maintainers without the context that normally arrives
through an issue, conversation, or user report. OAAP defines a small, explicit
exchange that a participating agent can complete with the maintainer:

| Stage | What the agent reports | What it means |
| --- | --- | --- |
| Access | The final prompt that led to the project, its treatment, and a category | The maintainer's receiver accepted a self-reported access event |
| Download | A separate `succeeded` or `failed` result | The agent reports an outcome it actually observed |
| After use | The maintainer's request for usage feedback is relayed to the user | A request was delivered; it is not proof of a response or social action |

The current receiver stores access and download events. OAAP 0.1 does **not**
define a feedback-response storage API, and it does not claim that a relayed
request produced feedback. The bundled manifest currently includes a request
for a star or feedback; usage feedback remains important, while the value and
priority of the Star request are under review.

## The 0.1 flow

![Concept illustration of the OAAP prompt, receipt, download-result, and feedback-request flow.](assets/submission/oaap-flow.svg)

*Concept illustration, not a live screenshot or test result.* Participating AI
agents provide the final access prompt, report the download outcome separately,
and relay a usage-feedback request. Each maintainer owns the receiver and records.
See the [evidence package](docs/submission/README.md) for claim boundaries,
verification scope, and the current live-test status.

OAAP adoption and agent participation are voluntary. Once an AI agent
participates in an adopting project, the v0.1 contract requires it to:

1. Identify whether the accessing party is a person or an AI. An AI may declare
   itself directly; this is self-declared identity, not verified identity. Humans
   continue without an AI prompt submission.
2. Provide the **final prompt that caused access to the project**. This is not the
   full conversation or private model reasoning.
3. Preserve ordinary task wording. If the prompt contains a proprietary idea,
   anonymize the idea-specific details before transmission while retaining the
   real purpose of the work.
4. Submit `category` as required additional metadata in the reference receiver.
   A category never replaces the required prompt.
5. Keep credentials, personal identifiers, unrelated private material, full
   transcripts, and hidden reasoning out of the event.
6. Treat the access receipt and download result as separate facts. An accepted
   access event is `pending`, not a successful download.
7. After observed use in the current task, relay the maintainer's support or
   feedback request once. Never fabricate feedback or claim a star, review, or
   response from the relay alone.

If a qualifying prompt is unavailable, cannot be sent safely, or lacks the
required transmission authority, the agent must disclose incomplete onboarding.
It must not invent a prompt, send category-only data, or misuse a failed-download
result to represent missing permission.

See the [OAAP 0.1 protocol and receiver contract](docs/PROTOCOL.md) for exact
fields, limits, acknowledgements, retry rules, and failure behavior.

## Maintainer-owned by design

| OAAP provides | The adopting maintainer controls |
| --- | --- |
| Protocol and JSON contract | Whether to adopt OAAP |
| README, `AGENTS.md`, `CLAUDE.md`, and `oaap.json` templates | The repository instructions and public receiver configuration |
| Google Sheets template and Apps Script receiver | The Google account, deployment, records, access, and retention |
| Demo client, tests, and verification guide | When and how to operate or replace the reference receiver |

Events go directly to infrastructure selected by the maintainer. OAAP does not
receive a central copy and does not require maintainers to register with an OAAP
service.

## Get started

### For maintainers

1. Read the [setup guide](docs/SETUP.md).
2. Download the [maintainer spreadsheet template](templates/sheets/OAAP-maintainer-template.xlsx)
   and convert it in your own Google account.
3. Merge the [repository adoption templates](templates/repository/) into your
   existing project instructions. Do not overwrite them.
4. Deploy the [Apps Script receiver](receiver/Code.gs) from the maintainer's
   account and replace all repository and receiver placeholders.
5. Follow the [receiver verification guide](receiver/VERIFY.md) before changing
   reporting from synthetic `demo` events to `live` events.

### For implementers and reviewers

- Inspect the [demo client](scripts/demo-client.mjs) and
  [local test suite](tests/) for the supported access/result flow, retries, and
  failure cases.
- Use [receiver/GoogleSmokeTest.gs](receiver/GoogleSmokeTest.gs) only as the
  documented optional native-runtime text-storage check. Its presence does not
  prove that it ran.

## What is in this repository

| Path | Purpose |
| --- | --- |
| [`docs/PROTOCOL.md`](docs/PROTOCOL.md) | Normative 0.1 behavior and wire contract |
| [`docs/SETUP.md`](docs/SETUP.md) | Maintainer installation and deployment steps |
| [`templates/repository/`](templates/repository/) | Files to merge into an adopting repository |
| [`templates/sheets/`](templates/sheets/) | Maintainer-owned spreadsheet template |
| [`receiver/`](receiver/) | Apps Script receiver and verification guidance |
| [`scripts/`](scripts/) | Explicit demo client and live-driver entry point |
| [`tests/`](tests/) | Receiver-contract and local demo/E2E coverage |

## Verification status

| Scope | Current evidence | Status |
| --- | --- | --- |
| Receiver contract | 16 local tests against the actual `Code.gs` source through a local adapter | Passing |
| Demo and failure paths | 7 local tests using loopback HTTP and real local Git operations | Passing |
| Google authorization | Maintainer authorization completed | Complete |
| Native Google text storage | An initial leading-apostrophe failure was corrected; six synthetic samples then passed exact-value and no-formula checks | Passed for the six tested samples |
| Current Apps Script deployment → HTTP → Records/Summary | Requires deployment of the current receiver and independent sheet readback | Not yet verified in public evidence |
| Universal AI discovery | Repository guidance is not automatically read by every AI or Git client | Not claimed |

The 23 passing local tests mock Google services. Native testing separately found
the leading-apostrophe issue, and the corrected six-sample check passed with
independently reviewed API values. This does not verify the public HTTP path,
download demo, distributed Google concurrency, or broad AI-client compatibility.
See the [native Google finding](docs/submission/NATIVE_FINDING.md) and its
[derived verification summary](docs/submission/native-text-verification.json).

## Limits

- OAAP records only events sent by participating integrations. It does not measure
  every GitHub clone or ZIP download.
- Adding OAAP files does not modify GitHub's download interface or technically
  block direct access.
- AI-prepared anonymization is not a guarantee that every identifying detail was
  removed.
- Access receipts, download results, feedback-request delivery, user responses,
  and completed stars or reviews are separate facts.
- The reference receiver is a bounded proof of concept, not a finished
  abuse-resistant ingestion service.

Questions, implementation reports, and real usage feedback are welcome through
[GitHub Issues](https://github.com/stariver1119/OAAP/issues).
