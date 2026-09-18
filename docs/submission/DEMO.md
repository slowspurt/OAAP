# Two-minute demonstration outline

This is a suggested sequence, not a record that a demonstration has run.
Use the current evidence map to choose live material or state the gap. Do not
perform a scripted result as if it were spontaneous customer behavior.

| Time | Show | Suggested narration | Evidence gate |
| --- | --- | --- | --- |
| 0:00–0:15 | Concept diagram, explicitly labeled | “OAAP—pronounced oh-app—helps maintainers understand why participating AI agents access their work. Each maintainer owns the receiver and records.” | Concept SVG; design claim only. |
| 0:15–0:30 | Repository guidance and public placeholder manifest | “People continue without an AI prompt. Participating AI provides the final access prompt: ordinary wording is preserved; proprietary ideas are anonymized before sending. Category is extra metadata.” | Real template files, with no private endpoint. |
| 0:30–0:55 | Genuine demo access acknowledgements and matching Records | “These are synthetic test prompts. An accepted prompt creates a pending receipt; it is not a completed download.” | Operator-supplied real Google evidence, or explicitly label local-only evidence. |
| 0:55–1:20 | Observed clone result and updated rows | “A separate update reports the observed outcome. This run checks both success and deliberate failure; identical retries should not add records.” | Clone observation, validated acknowledgements, row readback. If unavailable, show code/tests and say live verification is pending. |
| 1:20–1:35 | Actual Summary with demo source filter | “These counts describe reported demo events. We reconcile them with the rows; they are not customer adoption or all GitHub downloads.” | Verified before/after counts, smoke receipts accounted for. Skip this screen if not verified. |
| 1:35–1:50 | Actual feedback-request output | “After observed use, the agent relays the maintainer's feedback request. Delivery, a user response, and receipt by the maintainer are different facts.” | Authentic delivered/output request; identify demo-output-only scope if applicable. No invented response. |
| 1:50–2:00 | Evidence package status | “Local tests cover the implemented flow. Here is exactly what was verified live and what remains open.” | Current claims map; preserve unresolved items. |

## Observed native issue

The operator reports that the first native Google text check failed after two
synthetic pending receipts: a leading apostrophe was not preserved, and the
exact retry failed. Show this as a limitation found by live testing, not as a
passed check. Follow the [finding and retest status](NATIVE_FINDING.md); include
those pending receipts in the next Summary baseline. No download occurred in
that native text check.

## If live evidence is not available

Present the concept, actual templates, and local verification scope. Say plainly:
“Local tests use real local Git and HTTP with mocked Google services. Live Google
receiver and sheet verification have not been established in this package.”
Do not fill the gap with an edited UI, an old template render, or a fabricated
successful status. The two-minute timing can be shortened accordingly.

## Presenter preparation

Use the receiver owner's authorized test workflow in
[receiver/VERIFY.md](../../receiver/VERIFY.md). The receiver operator alone owns
the current Google tabs. Use synthetic examples and reviewed public captures;
keep deployment URLs and retry credentials off screen. Review the script again
when submission rules are known. This outline authorizes no actual submission,
new feedback API, unsolicited social action, or fabricated feedback response.
