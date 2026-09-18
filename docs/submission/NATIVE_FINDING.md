# Native Google test finding

Status: **native failure confirmed in a private capture; candidate fix implemented; native retest pending**. Recorded
2026-09-18. This report distinguishes source inspection, local test results,
operator observations, and independently accepted public captures.

## Before: what the live test exposed

The receiver operator reported a native Apps Script text-storage check against
Google Sheets after uploading the current receiver and optional smoke helper.
The `=1+1` sample passed the exact-text, no-formula, and changed-retry checks.
The next sample, `'=1+1`, exposed removal of a leading apostrophe in the RichText
storage path, and its identical retry failed. The check stopped at that point.

The reported baseline was a header-only Records sheet with zero Summary counts
and reporting source `demo`. The failed native check left **two synthetic
`pending` receipts**. It performed no download; those rows are neither failed
nor successful download outcomes. No actual user prompt or customer feedback is
represented by these tests.

The submission editor inspected the private raw capture: its execution log
shows `literal_smoke_failed` at the identical-retry assertion. The exact
stored-string diagnosis and two-row count are attributed to the operator's API readback. The capture contains an account avatar and is not approved
for public use. No privacy-safe public image has been accepted yet.

## Fix: status

The receiver owner updated the local adapter to model the observed removal of
one leading apostrophe. The owner reports that this exposed two failures in
the previous tests. The candidate writer now adds one extra leading apostrophe
only when the original input starts with an apostrophe; exact retry comparison
is unchanged. The submission editor inspected this change in `richText_` and
the corresponding adapter behavior.

The receiver owner reports all 23 local tests passing after the fix and an
exact-match upload of the corrected code. Native retesting is in progress.
Passing the adjusted local tests is not sufficient to declare this native issue
resolved. No wire fields or feedback contract were changed.

## Verification: still required

1. Re-run the affected leading-apostrophe cases in native Google with exact
   `getValues()` text and empty `getFormulas()` results for tested text cells.
2. Confirm identical retries succeed without duplicate committed rows and changed
   apostrophe inputs are rejected as conflicts.
3. Reconcile the two pending receipts from the failed run, any new native-test
   receipts, and the separate HTTP demo. A complete six-case retest would
   bring pending receipts to eight; a later three-event clone demo would bring
   total receipts to eleven. These are expected reconciliation targets, not
   observed results. Do not hide the failed check by treating
   the next run as if its baseline were empty.
4. Verify the corrected deployed HTTP path separately from native execution,
   then independently read matching Records and Summary values.
5. Capture authentic, privacy-safe app regions and record their test scope.

## What the local tests mean

The previous 23 local tests passed with Google service adapters. They demonstrated
local behavior and did not model this Google-specific string transformation.
The live finding limits that earlier evidence; it does not justify rewriting it
as a failed local run or claiming native correctness. Preserve both results and
their scopes when presenting a before/fix/verification account.
