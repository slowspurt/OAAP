# Receiver verification

## Local checks

Run from the repository root with Node.js and Git installed:

```sh
node --test tests/*.test.mjs
```

The tests load the actual `Code.gs` into a local adapter. The E2E cases use a
loopback HTTP server, real local Git clones, concurrent duplicate requests,
a deliberately missing clone source, and dropped HTTP acknowledgements.
The server exists only during the tests. Google services and locking are mocked;
these results do not certify Google deployment, Sheets behavior or distributed
Google concurrency.

## Actual Google text storage

After the owner has authorized the script, copy the optional
`GoogleSmokeTest.gs` into the same Apps Script project and run
`runOaapLiteralSmokeTest`. It creates **six synthetic `demo` access receipts** in
the configured sheet. It checks exact `getValues()` text, empty `getFormulas()`,
identical retries, and changed leading-apostrophe conflicts for prompt and agent.
The receipts stay `pending`: this test performs no download. It does not call the
public HTTP deployment. Inspect the returned result and matching Records rows.
Do not treat the helper's presence as evidence that it ran.

The receiver writes free text using the documented
[RichTextValue builder](https://developers.google.com/apps-script/reference/spreadsheet/rich-text-value-builder)
and [Range.setRichTextValues](https://developers.google.com/apps-script/reference/spreadsheet/range)
APIs. `setValues` can interpret strings beginning with `=` as formulas; plain-text
number formatting alone is not the safety mechanism. Native-runtime testing is
still required to establish exact behavior in the installed deployment.

## Actual HTTP and local download flow

Set `OAAP_RECEIVER_URL` to the owner's deployed Apps Script `/exec` endpoint and
`OAAP_REPOSITORY` to exactly the receiver's configured canonical repository URL
(default: `https://github.com/example/demo`). Then run:

```sh
node scripts/live-demo.mjs
```

The driver reads the adoption guidance before cloning a synthetic local Git
fixture. It submits three `source: demo` events: an ordinary example, a
prewritten anonymized example, and an intentionally failed clone. Expected
reported outcomes are `succeeded`, `succeeded`, and `failed`. The anonymized
example does not evaluate an AI anonymization model.

The default private state is `outputs/receiver-demo/retry-state.local.json`.
Set `OAAP_DEMO_STATE` to another private path for a genuinely new test run.
Resume interruptions with the **same** state path, repository and endpoint;
completed runs reuse their stored result without new downloads or events.
State is saved with owner-only file permissions before the first POST and after
each observed outcome. It contains update credentials and synthetic prompts;
never publish it. Public evidence omits endpoint, keys, prompts and local paths.

The driver validates HTTP success, JSON, matching event IDs, recognized outcome
states, duplicate flags and matching result acknowledgements. Failed clones
report `failed`. A process terminated during a clone leaves `clone_started` with
an unknown outcome; reconcile that attempt manually from evidence instead of
rerunning it or inventing a result. Unknown receiver updates remain retryable.
The driver has bounded retries and no background queue.

After HTTP completion, independently inspect the owner's Records and Summary
with the `demo` filter. Match event IDs, verify one row each, status timestamps,
and the two-success/one-failure increase relative to the previous counts.
If you ran the optional text smoke test, its six additional pending receipts
must remain separate. A successful HTTP response alone is not this independent
sheet verification. The driver's synthetic support request is printed after
observed README use; it does not star, review, or contact anyone.

## Deployment and recovery details

Upload the current `Code.gs` and update the deployed Apps Script version after
receiver changes. The optional smoke helper is not needed for normal reception.
This revision preserves the 11-column and JSON contracts. It replaces apostrophe
escaping with exact RichText storage, so deployments containing records from an
older escaped writer need a separately reviewed migration before claiming exact
retry compatibility for those old records. Do not silently strip apostrophes
from existing prompts.

The receiver holds a script lock through reads, writes and flushes. It prepares
A:E first, flushes, then commits F:K including `Source`, status and key hash in
one range write. A trailing row with empty Source is an incomplete staging row;
it is ignored by source-filtered metrics and reused on the next access request.
A committed row is never reused. Do not hand-edit `Source` or use Records for
unrelated data. Malformed interior rows or data beyond row 2001 produce
`template_mismatch`; the receiver never scans an unbounded sheet. Existing
result updates and retries continue at the 2,000-event cap.
