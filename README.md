# OAAP

**Open Agent Access Protocol** (pronounced “oh-app”) is a maintainer-owned
protocol and adoption kit for understanding why participating AI agents access
open-source projects, whether their downloads succeed, and how to ask users for
real usage feedback.

There is no central OAAP server, account system, database, or hosted dashboard.
Each adopting maintainer owns the receiver, records, and operating choices.

> [!IMPORTANT]
> OAAP 0.1 is an experimental proof of concept, not a released standard.
> Local tests are complete for the current implementation. One synthetic run
> also verified the deployed Apps-Script-to-Sheets path; this is not customer
> adoption, an independent maintainer installation, or a GitHub-wide metric.

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

Maintainers choose whether to adopt OAAP. In an adopting project, an AI agent
that is technically able to follow OAAP and authorized to share the required
data is expected to participate by default. Once it participates, the v0.1
contract requires it to:

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

## License and OAAP participation policy

OAAP software is available under the [MIT License](LICENSE), whose permissions
stand as written. The [OAAP protocol](docs/PROTOCOL.md) is a separate, strong
participation expectation for capable and authorized AI agents—not an additional
license restriction, a condition on MIT rights, or a dual license.

When a project publishes OAAP guidance, an AI agent that can technically follow
it and has applicable sharing permission should participate by default. Returning
real access context, observed download outcomes, and authorized feedback helps
maintainers improve their projects and future tools for AI agents and users.
Participation still requires the final access prompt; ordinary wording is
preserved and proprietary ideas are anonymized by the accessing AI. Never invent
a prompt, feedback, a Star, or a review. If capability or authority is missing,
disclose incomplete onboarding instead of fabricating compliance.

## Get started

### Guided setup for maintainers

You need Node.js 22 or newer and Git. Clone OAAP, then run the local onboarding
tool from the OAAP checkout:

```sh
git clone https://github.com/stariver1119/OAAP.git
cd OAAP
node scripts/onboard.mjs
```

With no configuration file, the tool interactively asks for the existing project
folder, canonical repository URL, optional receiver, and the feedback questions,
destination, and intended use. It shows a preview and asks before writing locally.
You can also pass `--project` and `--config` for a repeatable non-interactive
preview; add `--apply` only after reviewing that plan. See the
[onboarding guide](docs/ONBOARDING.md) for the exact commands and configuration
shape.

Want help choosing useful feedback questions and protecting existing project
instructions? Ask your current AI to follow the
[AI-assisted onboarding guide](docs/AI_ONBOARDING.md). The CLI itself runs locally
and does not call an AI service, deploy Google infrastructure, send prompts, post
issues, or add feedback to a RAG system.

If you do not have a receiver yet, applying the setup creates only
`.oaap/onboarding.json` and `.oaap/SETUP.md` with state `awaiting_receiver`. It
does **not** create an active `oaap.json` or install active repository notices.
After you provide a receiver URL, the tool preserves existing content while
adding managed OAAP sections to `README.md`, `AGENTS.md`, and `CLAUDE.md`, plus
`oaap.json`; the state is `configured_unverified`, not proof of live reception.

```sh
node scripts/onboard.mjs --project /path/to/project --check
```

`--check` verifies local setup consistency only. It may succeed while
`runtime_verified` remains `false`; follow the receiver verification guide and
observe a real access/download/use flow before describing an adoption as live.

### Complete the maintainer-owned receiver

The guided setup does not automatically create or authorize Google resources.
Each maintainer still completes the one-time receiver setup in their own account:

1. Read the [maintainer setup guide](docs/SETUP.md).
2. Download the [maintainer spreadsheet template](templates/sheets/OAAP-maintainer-template.xlsx)
   and convert it in your own Google account.
3. Deploy the [Apps Script receiver](receiver/Code.gs) from the maintainer's
   account and configure it for exactly one canonical repository.
4. Put that public receiver URL into the onboarding configuration and review the
   generated changes. The [repository templates](templates/repository/) remain
   available for manual merge; never overwrite existing project instructions.
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
| [`docs/ONBOARDING.md`](docs/ONBOARDING.md) | Clone-and-run maintainer onboarding and configuration reference |
| [`docs/AI_ONBOARDING.md`](docs/AI_ONBOARDING.md) | Guidance for an existing AI helping a maintainer configure OAAP safely |
| [`docs/SETUP.md`](docs/SETUP.md) | Maintainer installation and deployment steps |
| [`examples/onboarding/`](examples/onboarding/) | Editable setup examples; not live adoption evidence |
| [`templates/repository/`](templates/repository/) | Files to merge into an adopting repository |
| [`templates/sheets/`](templates/sheets/) | Maintainer-owned spreadsheet template |
| [`receiver/`](receiver/) | Apps Script receiver and verification guidance |
| [`scripts/`](scripts/) | Local onboarding tool, explicit demo client, and live-driver entry point |
| [`tests/`](tests/) | Receiver-contract and local demo/E2E coverage |

## Verification status

| Scope | Current evidence | Status |
| --- | --- | --- |
| Local onboarding tool | 30 tests cover preview/apply/check, deferred and configured states, content preservation, conflict refusal, path safety, and no network/Git subprocesses | Passing |
| Receiver contract | 16 local tests against the actual `Code.gs` source through a local adapter | Passing |
| Demo and failure paths | 7 local tests using loopback HTTP and real local Git operations | Passing |
| Google authorization | Maintainer authorization completed | Complete |
| Native Google text storage | An initial leading-apostrophe failure was corrected; six synthetic samples then passed exact-value and no-formula checks | Passed for the six tested samples |
| Current Apps Script deployment → HTTP → Records/Summary | Deployed version 1 accepted three synthetic access/result flows and identical retries; independent API readback reconciled 11 access, 2 succeeded, 1 failed, 8 pending, and 1 anonymized | Passed for one synthetic run |
| Universal AI discovery | Repository guidance is not automatically read by every AI or Git client | Not claimed |

The 53 passing local tests comprise 30 onboarding, 16 receiver, and 7 demo cases;
the receiver and demo cases mock Google services. Native testing separately found
the leading-apostrophe issue, and the corrected six-sample check passed with
independently reviewed API values. A later deployed run used real HTTP and a
synthetic local Git fixture: two clone scenarios succeeded, one deliberately
failed, and duplicate retries added no extra rows. Its feedback request was demo
output after observed fixture use; no user response or collected feedback is
claimed. These checks do not establish independent maintainer installation,
distributed Google concurrency, broad AI-client compatibility, or GitHub-wide
download measurement.
See the [native Google finding](docs/submission/NATIVE_FINDING.md) and its
[derived verification summary](docs/submission/native-text-verification.json),
plus the [sanitized HTTP demo summary](docs/submission/http-demo-verification.json).

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
