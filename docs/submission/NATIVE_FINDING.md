# Native Google test finding

Status: **native fix and one deployed HTTP run verified; broader HTTP/demo evidence remains scoped**. Recorded
2026-09-18. This report distinguishes source inspection, local test results,
operator observations, and independently accepted public captures.

## Before: what the live test exposed

The receiver operator reported a native Apps Script text-storage check against
Google Sheets after uploading the current receiver and optional smoke helper.
The failed run started at 11:55:18 UTC and ended at 11:55:23 UTC on 2026-09-18.
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
for public use. Two later, directly clipped app-region captures of Summary
and Records were inspected and accepted without pixel editing; see the
[evidence package](README.md#authentic-native-run-captures).

## Fix: implemented and checked

The receiver owner updated the local adapter to model the observed removal of
one leading apostrophe. The owner reports that this exposed two failures in
the previous tests. The candidate writer now adds one extra leading apostrophe
only when the original input starts with an apostrophe; exact retry comparison
is unchanged. The submission editor inspected this change in `richText_` and
the corresponding adapter behavior.

The receiver owner reports all 23 local tests passing after the fix and an
exact-match upload of the corrected code. The native rerun completed from
11:57:38 to 11:57:55 UTC on 2026-09-18. The editor inspected its completion
capture and independently checked the retained API readback. No wire fields
or feedback contract were changed.

## Verification: observed result and remaining scope

The corrected native helper completed its six synthetic cases: `=1+1`, one and
two leading apostrophes, a leading tab, a quoted ordinary string, and Korean
text with a newline. Its assertions cover exact agent/prompt readback, no
formulas, identical retries, and changed-apostrophe conflicts in both fields.
The editor independently checked the API's `userEnteredValue` and
`effectiveValue` strings for Records rows 4–9 and the absence of formula values.

[Machine-readable verification summary](native-text-verification.json) contains
only the checked synthetic samples, public test times, and aggregate results.
It is a derived evidence summary, not a screenshot or a raw API response.

| Stage | New receipts | Cumulative pending | Download results |
| --- | --- | --- | --- |
| First native run, stopped on failure | 2 | 2 | None |
| Corrected native run | 6 | 8 | None |

The retained Summary readback is **8 access requests, 0 succeeded, 0 failed,
8 awaiting result, 0 anonymized prompts**. The first two rows remain intact;
the problematic old row was not silently repaired. This demonstrates the fix
for new tested writes, not migration of old records.

The corrected deployment's public HTTP run is now separately verified in
[http-demo-verification.json](http-demo-verification.json): three synthetic
access/result pairs, two successful local-fixture clones, one deliberate failed
clone, duplicate acknowledgements, and independent Summary/Records readback.
The native Summary/Records captures remain a pre-HTTP view with eight pending
receipts; they are not the post-run screen. The later HTTP run independently
read back **11 access requests, 2 succeeded, 1 failed, 8 pending, and 1
anonymized** after adding two successful and one failed local-fixture outcome.
These are synthetic demo totals, not customer or GitHub-wide results.

## What the local tests mean

The previous 23 local tests passed with Google service adapters. They demonstrated
local behavior and did not model this Google-specific string transformation.
The live finding limits that earlier evidence; it does not justify rewriting it
as a failed local run or claiming native correctness. Preserve both results and
their scopes when presenting a before/fix/verification account.
