# Captions and README support

## Ready to use: concept diagram

**Asset:** [oaap-flow.svg](../../assets/submission/oaap-flow.svg)

**Caption:** Concept illustration of OAAP (pronounced “oh-app”): a participating
AI prepares the final access prompt, sends it directly to a maintainer-owned
receiver, reports the observed download outcome separately, and relays a
usage-feedback request after use. This diagram is not a screenshot or test result.

**Alt text:** An AI preserves an ordinary prompt or anonymizes proprietary ideas
before sending a required prompt to the maintainer's Apps Script and Sheets.
An access receipt starts pending; a separate result reports success or failure.
After observed use, the AI relays a feedback request to the user.

**README insertion suggestion:**

```markdown
### How OAAP works

![Concept illustration of the OAAP prompt, receipt, download-result, and feedback-request flow.](assets/submission/oaap-flow.svg)

*Concept illustration, not a live screenshot.* Participating AI agents provide
the final access prompt, report the download outcome separately, and relay a
usage-feedback request. Each maintainer owns the receiver and records.

See the [evidence package](docs/submission/README.md) for verification scope and
current live-test status.
```

## Conditional captions for authentic captures

**Do not publish these as achieved results until the matching capture and
observations are accepted in the evidence map.** These are caption drafts, not
screenshots, facts about a run, or instructions to alter a screen.

| Capture | Caption draft after verification | Must not imply |
| --- | --- | --- |
| Original and anonymized rows | Synthetic demo prompts stored in the maintainer's Google Sheet: ordinary wording is retained, while the prewritten anonymized example preserves purpose without idea-specific details. | Customer prompts or measured AI anonymization accuracy. |
| Pending then success | One synthetic event moves from an accepted prompt (`pending`) to an agent-reported successful download after a separate result update. | Receipt alone proves download, or OAAP independently authenticates the result. |
| Failure and duplicates | An observed failed clone is reported separately. Repeating the same event and result leaves one committed record per event in this verified run. | All network failures or Google concurrency behavior are covered. |
| Summary | The `demo`-filtered Summary reconciles with the inspected Records rows for this run. Native text-smoke receipts, if present, are pending and separate from download outcomes. | Expected numbers are measured totals, or demo data is customer adoption. |
| Native text check | The native Google text check confirms exact synthetic string readback, no formulas in the tested cells, and rejection of changed-apostrophe retries. | Universal input safety beyond tested cases or a public HTTP test. |
| Feedback relay | After observed demo use, the agent relays the maintainer's request for usage feedback. No user response, feedback receipt, Star, or review is demonstrated. | Request delivery means feedback was collected. |

## Current verification copy

The receiver owner reported 23 passing local tests: 16 receiver cases and
7 demo cases, including real local Git clones and loopback HTTP. Google services
were mocked. The protocol reviewer independently reran the 16 receiver cases.
The first native Google check exposed a leading-apostrophe preservation failure.
After correction, six native cases passed; the editor independently checked exact
API strings, absence of formulas, and eight pending receipts (two from the first
run plus six from the corrected run). This native check performed no downloads.
Deployed HTTP verification is now supported by a sanitized acknowledgement log,
independent sheet readback, and a deployment-state capture. Two authentic
native-run captures are available below. See
[the native finding](NATIVE_FINDING.md).

Keep usage feedback central. Star-request value is under review, not confirmed
removed. Do not add testimonials, customer counts, feedback collection metrics,
or a new mandatory feedback-response contract.

## Ready to use: actual native Google captures

### Native Summary before HTTP testing

**Asset:** [native-summary-before-http.jpg](../../assets/submission/native-summary-before-http.jpg)

**Caption:** Actual Google Summary after synthetic native text checks on
2026-09-18: eight pending receipts, comprising two from the interrupted first
run and six from the corrected rerun. No downloads occurred. The displayed
“As of 2026-09-15” is an unchanged sheet setting, not the test date. This capture
does not verify a deployed HTTP endpoint.

**Alt text:** Google Sheet Summary reports 8 access requests, 0 succeeded,
0 failed, 8 awaiting result, and 0 anonymized prompts, filtered to demo.

### Literal-text test records

**Asset:** [native-literal-records.jpg](../../assets/submission/native-literal-records.jpg)

**Caption:** Actual Google Records columns A:E show the original failed test
(rows 2–3) and corrected native test (rows 4–9), using only synthetic strings.
Exact string preservation and absence of formulas were checked separately in
API readback. Synthetic event IDs are clipped by the existing column widths;
no screen values were reconstructed or edited.

**Alt text:** Google Records with synthetic literal-text samples, including
leading apostrophes and Korean text with a newline, recorded on 2026-09-18.

Both images are direct operator-captured app regions with no account identifiers,
private Google IDs, endpoint, credentials, or pixel changes. Raw capture provenance
is retained privately. They establish native test state, not customer usage,
actual feedback responses, or the public HTTP download flow.

### Deployment state

**Asset:** [deployed-version.jpg](../../assets/submission/deployed-version.jpg)

**Caption:** Apps Script deployment version 1 was updated before the synthetic
HTTP run on 2026-09-18. The capture establishes deployment-state context; the
acknowledgements and independent sheet readback establish the run itself.

**Alt text:** Deployment panel showing version 1 updated on September 18, 2026.

The capture contains no endpoint or account identifier and is not sufficient on
its own to prove HTTP behavior.

### Post-HTTP Records

**Assets:** [records-http.png](../../assets/submission/records-http.png) and
[records-status-http.png](../../assets/submission/records-status-http.png)

**Caption:** Actual Google Records after the same synthetic HTTP run. The first
eight rows are the preserved native pending baseline; the final three rows are
the original, anonymized, and deliberate failed local-fixture scenarios. The
status view shows two successes and one failure. Event IDs are clipped by the
original column widths; no screen values were reconstructed or edited.

**Alt text:** Google Records show synthetic original and anonymized prompts,
pending native rows, and final status rows marked succeeded, succeeded, and
failed.

These captures support the independently reconciled live synthetic run. They do
not demonstrate GitHub downloads, customer adoption, user feedback responses,
or anonymization quality.
