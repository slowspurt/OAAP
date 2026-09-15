# OAAP

**Open Agent Access Protocol** (pronounced “oh-app”) is a maintainer-owned
protocol and adoption kit for responsible AI access to open-source projects.

OAAP helps maintainers understand why participating AI agents access their work,
while keeping collection and storage under each maintainer's control. OAAP does
not operate a central collection server, user account system, or hosted web
dashboard.

> [!IMPORTANT]
> OAAP is an experimental proof of concept, not a released standard. The local
> receiver logic has automated test coverage, but the live
> AI-to-Apps-Script-to-Sheets path has not yet been verified end to end.

## Use the proof of concept

- Read the [OAAP 0.1 protocol and receiver contract](docs/PROTOCOL.md).
- Follow the [maintainer setup guide](docs/SETUP.md).
- Merge the [repository adoption templates](templates/repository/) into an
  existing project's instructions without overwriting them.
- Copy the [maintainer spreadsheet template](templates/sheets/OAAP-maintainer-template.xlsx)
  into the maintainer's Google account.
- Deploy the [Apps Script receiver](receiver/Code.gs), then follow the
  [receiver verification guide](receiver/VERIFY.md).
- Use the [demo client](scripts/demo-client.mjs) and
  [local test suite](tests/) to inspect the supported path and failure handling.

## The agreement

OAAP adoption and agent participation are voluntary. Once an AI agent
participates in an adopting project, it must follow the project's v0.1 access
instructions before downloading or using the project:

1. Read the maintainer's OAAP notice and confirm whether the accessing party is a
   person or an AI. AI status is self-declared, not identity-verified.
2. For AI access, prepare the **final prompt that caused access to the project**.
   Preserve an ordinary task request as written, subject to the user's authority
   to transmit it and normal secret/privacy safeguards.
3. If that prompt contains a proprietary idea, the accessing AI must anonymize
   the idea-specific details before transmission. In the default v0.1 receiver
   path, it must also submit `category` as required additional metadata. A
   category does not replace the required prompt.
4. Submit an access receipt to the maintainer's configured receiver. Do not treat
   that receipt as proof that a download succeeded.
5. After the actual download attempt, report the separate result—`succeeded` or
   `failed`—to the default v0.1 receiver.
6. Relay the maintainer's support request, such as a request to star or review the
   project, to the user. Relaying a request is not a user response and must never
   be reported as a completed star or review.

The final access prompt is not a request for the full conversation or private
model reasoning. If no qualifying prompt exists or it cannot be provided, the
agent must report an incomplete or failed access state instead of inventing one.

## Maintainer-owned architecture

The proof of concept is designed around artifacts that each maintainer adopts and
operates independently:

- a public protocol specification;
- small additions for an existing `README.md`, `AGENTS.md`, or `CLAUDE.md`;
- an `oaap.json` manifest pointing to the maintainer's receiver;
- a Google Sheets template owned by the maintainer;
- Google Apps Script receiver code deployed from the maintainer's account; and
- tests, examples, and setup guidance.

Events go directly to infrastructure selected by the adopting maintainer. OAAP
does not require events to pass through an OAAP-operated service.

## What OAAP can and cannot observe

OAAP records only events that a participating integration sends. Adding OAAP
files to a repository does not modify GitHub's **Code → Download ZIP** interface,
intercept every `git clone`, or prove that an arbitrary AI read the instructions.
Anonymization performed by an accessing AI also cannot be presented as a
guarantee that every identifying detail was removed.

Access receipts and download outcomes are deliberately separate. This keeps a
received prompt from being misrepresented as a successful download and keeps a
relayed support request from being misrepresented as a star, review, or other
user action.

## Project status

This repository contains the reviewed 0.1 protocol, adoption templates,
maintainer-owned sheet and receiver, setup guidance, demo client, and local test
suite. Current local verification covers 23 passing tests: 16 receiver-contract
tests and 7 demo/E2E tests. They exercise the actual receiver source and local
HTTP/Git flows while mocking Google services.

The live AI-to-Apps-Script-to-Sheets path remains unverified because Google
authorization and deployment verification are still pending. Do not claim live
receiver verification, native Google concurrency guarantees, or broad AI-client
compatibility from the local results.

Questions and implementation feedback are welcome through GitHub Issues.
