# Claims and evidence

Status recorded 2026-09-18. “Available” means the cited source supports the
stated scope. It does not imply a live deployment or customer result.

| ID | Claim suitable for the submission | Evidence and current status | Limit on interpretation |
| --- | --- | --- | --- |
| C01 | A maintainer adopts OAAP and owns the receiver and records. | Available: [protocol §1](../PROTOCOL.md), [setup](../SETUP.md), [receiver source](../../receiver/Code.gs). | Architecture and install path; independent installation by another maintainer has not been demonstrated here. |
| C02 | Participating AI provides a final access prompt; ordinary wording is preserved and proprietary ideas are anonymized before sending. | Available: [protocol §2](../PROTOCOL.md), [agent template](../../templates/repository/AGENTS.md), local receiver tests for original/anonymized text. Live row evidence pending. | Prewritten synthetic anonymization examples test transport/storage, not anonymization-model performance or guaranteed privacy. |
| C03 | An access acknowledgement creates a pending receipt; a download outcome is reported separately. | Available: [receiver tests](../../tests/receiver.test.mjs), [demo tests](../../tests/demo.test.mjs), protocol §3–4. Live acknowledgement/row evidence pending. | A receipt is not a successful download; the outcome is agent-reported, not independently authenticated by OAAP. |
| C04 | Local tests cover successful and failed clones, duplicate retries, and interrupted acknowledgements. | Available: receiver owner reported 23/23 pass on 2026-09-15; protocol reviewer independently confirmed 16 receiver tests. [Reproduction instructions](../../receiver/VERIFY.md). | Real local Git/HTTP with mocked Google services. This does not prove public Apps Script operation or distributed Google concurrency. |
| C05 | The receiver compares retries exactly and preserves literal text in its intended storage path. | Available: receiver source and local apostrophe/formula regression tests; [native test procedure](../../receiver/VERIFY.md). Native failure reproduced and fixed; six-case native helper completed, with exact API string/no-formula readback independently checked. See [finding](NATIVE_FINDING.md) and [derived results](native-text-verification.json). | Native evidence covers these six samples and new writes; it is not public HTTP or old-record migration verification. |
| C06 | The actual Google deployment accepts demo events and stores the matching rows. | **Pending:** requires deployed-version confirmation, real HTTP acknowledgements, and independent Records readback from the operator. | OAuth approval and a successful HTTP response separately cannot prove the full claim. |
| C07 | Summary reports the verified demo outcomes without counting identical retries twice. | **Pending:** requires before/after filtered counts matched to event IDs and Records rows. | Expected counts are not observed results. Optional literal smoke receipts stay pending and must be accounted for separately. |
| C08 | The agent relays the maintainer's usage-feedback request after observed use. | Available: [demo client](../../scripts/demo-client.mjs) prints a synthetic support request after README use. Authentic run/delivery evidence pending. | Does not demonstrate actual user feedback, maintainer receipt of feedback, a Star, or a review. |
| C09 | Usage feedback is a current product priority; Star-request value is under review. | Owner-relayed initial feedback dated 2026-09-18, reflected in the package scope. | Qualitative direction only; no respondent count, testimonial, customer adoption, or market validation claim. |
| C10 | Repository guidance asks agents to participate in OAAP. | Available: [README notice](../../templates/repository/README.snippet.md) and [agent instructions](../../templates/repository/AGENTS.md). | No interception of all GitHub clones/ZIP downloads and no universal pre-download discovery. |

## Accepted public assets

| Asset | Type | Supports | Provenance |
| --- | --- | --- | --- |
| [oaap-flow.svg](../../assets/submission/oaap-flow.svg) | Concept illustration | Explains C01–C03 and C08, without proving execution. | Authored from the protocol and product scope; no customer data or screenshot pixels. |

No live screenshot has been accepted yet. Add a live asset only after verifying
its original capture, UTC capture time, test source, observed state, and removal
of private identifiers. Keep the raw source location in internal status rather
than this public document. Record any crop or redaction; never modify data cells,
status values, counts, timestamps, or test results in an evidence image.

## Reconciliation rules

- Tie each access/result pair to the same synthetic event ID. Distinguish a
  successful POST, a validated application acknowledgement, and a read-back row.
- For the three-event demo, two successes and one failure are **expected**.
  Record the actual delta from the prior sheet state before claiming those totals.
- The optional native text smoke intends to create six pending demo receipts
  in a completed run and performs no downloads. An interrupted run can leave
  fewer: the first reported Google attempt stopped after two pending receipts.
  Account for these baseline rows and each retest separately from clone outcomes.
- Retries should keep one committed row per event. Confirm this from Records,
  not from an unchanged screenshot that cannot establish which run it shows.
- If a check fails or evidence is absent, retain the pending/failed state. Do not
  use a concept diagram, old template render, or expected-output example as proof.
