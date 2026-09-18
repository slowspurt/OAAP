# Claims and evidence

Status recorded 2026-09-18. “Available” means the cited source supports the
stated scope. It does not imply a live deployment or customer result.

| ID | Claim suitable for the submission | Evidence and current status | Limit on interpretation |
| --- | --- | --- | --- |
| C01 | A maintainer adopts OAAP and owns the receiver and records. | Available: [protocol §1](../PROTOCOL.md), [setup](../SETUP.md), [receiver source](../../receiver/Code.gs). | Architecture and install path; independent installation by another maintainer has not been demonstrated here. |
| C02 | Participating AI provides a final access prompt; ordinary wording is preserved and proprietary ideas are anonymized before sending. | Available: [protocol §2](../PROTOCOL.md), [agent template](../../templates/repository/AGENTS.md), native six-sample text verification, and live synthetic original/anonymized rows in [HTTP verification](http-demo-verification.json). | The anonymized prompt was prewritten; this does not measure anonymization-model performance or guarantee privacy. |
| C03 | An access acknowledgement creates a pending receipt; a download outcome is reported separately. | Available in one deployed version 1 synthetic run: 12 validated HTTP acknowledgements, three access/result pairs, duplicate acknowledgements, and independent sheet totals in [HTTP verification](http-demo-verification.json). | A receipt is not a successful download; the outcome is agent-reported, and the repository was a local fixture rather than GitHub. |
| C04 | Local tests cover successful and failed clones, duplicate retries, and interrupted acknowledgements. | Available: receiver owner reported 23/23 pass on 2026-09-15; protocol reviewer independently confirmed 16 receiver tests. [Reproduction instructions](../../receiver/VERIFY.md). | Real local Git/HTTP with mocked Google services. This does not prove public Apps Script operation or distributed Google concurrency. |
| C05 | The receiver compares retries exactly and preserves literal text in its intended storage path. | Available: receiver source and local apostrophe/formula regression tests; [native test procedure](../../receiver/VERIFY.md). Native failure reproduced and fixed; six-case native helper completed, with exact API string/no-formula readback independently checked. See [finding](NATIVE_FINDING.md) and [derived results](native-text-verification.json). | Native evidence covers these six samples and new writes; it is not public HTTP or old-record migration verification. |
| C06 | The actual Google deployment accepts demo events and stores the matching rows. | Verified for one deployed version 1 run: real HTTP acknowledgements plus independent Records/Summary API readback; see [HTTP verification](http-demo-verification.json). | Synthetic local fixture, not GitHub; no customer prompt, customer adoption, or universal AI discovery. |
| C07 | Summary reports the verified demo outcomes without counting identical retries twice. | Verified in the same readback: source `demo`, 11 access, 2 succeeded, 1 failed, 8 pending, 1 anonymized; one row per HTTP scenario and duplicate acknowledgements. | Eight native pending receipts remain in totals; counts describe this synthetic run, not all downloads. |
| C08 | The agent relays the maintainer's usage-feedback request after observed use. | Available in the live synthetic run: console output records the request after local README use; see [HTTP verification](http-demo-verification.json). | No user response, feedback collection, maintainer feedback receipt, Star, or review is demonstrated. |
| C09 | Usage feedback is a current product priority; Star-request value is under review. | Owner-relayed initial feedback dated 2026-09-18, reflected in the package scope. | Qualitative direction only; no respondent count, testimonial, customer adoption, or market validation claim. |
| C10 | Repository guidance asks agents to participate in OAAP. | Available: [README notice](../../templates/repository/README.snippet.md) and [agent instructions](../../templates/repository/AGENTS.md). | No interception of all GitHub clones/ZIP downloads and no universal pre-download discovery. |

## Accepted public assets

| Asset | Type | Supports | Provenance |
| --- | --- | --- | --- |
| [oaap-flow.svg](../../assets/submission/oaap-flow.svg) | Concept illustration | Explains C01–C03 and C08, without proving execution. | Authored from the protocol and product scope; no customer data or screenshot pixels. |
| [native-summary-before-http.jpg](../../assets/submission/native-summary-before-http.jpg) | Actual Google app-region capture | Native baseline for C05: eight pending receipts, no download results. | Operator capture reviewed against retained API Summary8/0/0/8/0; visible As of setting is still 2026-09-15, not the 2026-09-18 test date. No pixel edits. |
| [native-literal-records.jpg](../../assets/submission/native-literal-records.jpg) | Actual Google app-region capture | C05 tested literal examples and preserved first-failure rows. | A:E only, rows2:3 initial attempt, rows4:9 corrected run; clipped synthetic IDs reflect original column widths. API text checks supplement the screenshot. No pixel edits. |
| [deployed-version.jpg](../../assets/submission/deployed-version.jpg) | Actual deployment-state capture | Supports deployed version context for C06. | Shows version 1 updated only; does not prove HTTP or sheet readback by itself. |
| [records-http.png](../../assets/submission/records-http.png) | Actual Google app-region capture | C06 post-HTTP Records rows. | Existing column widths clip event IDs; no pixels edited. Not GitHub-wide or customer evidence. |
| [records-status-http.png](../../assets/submission/records-status-http.png) | Actual Google app-region capture | C07 status view: two succeeded, one failed; anonymized row visible. | Synthetic local-fixture outcomes; status image alone does not prove clone execution. |

Five authentic captures have been accepted: two native-run sheet captures, one
deployment-state capture, and two post-HTTP Records captures. The post-HTTP
Summary remains API-derived and its screenshot is excluded from the public
allowlist. Add another live asset only after verifying
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
