# Capture and verification checklist

The receiver operator performs live Google actions and captures authentic
screenshots. Other contributors assemble the package without operating those
tabs. This list is a capture request, not a statement that the checks passed.

## Evidence to collect

| Capture | Required visible evidence | Companion observation |
| --- | --- | --- |
| Ordinary prompt | Synthetic final prompt and `original` treatment in a real Records row. | Exact sent/returned text comparison and event match. |
| Anonymized example | Meaningful prepared synthetic prompt and `anonymized` treatment. | State that the example is prewritten; do not expose a real private original or claim measured anonymization quality. |
| Receipt vs outcome | Same event before result (`pending`) and after observed download (`succeeded`), or real acknowledgements with independent row confirmation. | Record actual clone observation separately. Do not recreate a “before” screen after the fact. |
| Failure and retry | A distinct failed attempt, and one committed row for each repeated event. | Actual failure observation plus duplicate acknowledgements and row-count check. |
| Summary | Visible `demo` source selection and verified counts for the observed run. | Before/after counts; include partial native runs (two pending receipts reported from the first failure) and subsequent retests. Never replace observed values with expected ones. |
| Literal-text safety | Native smoke output or equivalent real `getValues`/`getFormulas` inspection. | Exact string preservation, no formulas, changed-apostrophe conflicts. HTTP success alone is insufficient. |
| Feedback request | Authentic output or user-visible communication relaying the request after observed use. | Say whether it is demo output only or actually delivered in a conversation. Do not manufacture a response or imply collection. |

## Capture privacy

- Keep raw captures in private `outputs/` storage. They are never public assets.
- Prefer an authentic app-region capture with browser chrome, account avatar,
  account name/email, address bar, private sheet title/ID, endpoint, and credential
  fields outside the frame at capture time.
- Exclude Settings connection values and the update-key/hash column. Do not
  reveal retry-state files, environment values, local user paths, or OAuth screens.
- Use only synthetic `source: demo` data for public test images. A real Google
  deployment can receive synthetic demo data: “real deployment” does not mean
  “real customer usage” or `source: live`.
- Supply original file provenance, UTC time, test step, and scope to the package
  editor privately. Add only approved, inspected candidates to public assets.
- If cropping or redaction is needed, preserve the original privately, disclose
  the transformation, and keep observed values untouched. Prefer a clean new
  capture over a heavily obscured image. Never reconstruct UI or test values.

## Acceptance gates

- [ ] Capture is from the actual described run, not a template render.
- [ ] Deployed revision and test scope are identified in the operator's evidence.
- [ ] Visible state matches corresponding acknowledgements and row observations.
- [ ] Counts account for pre-existing rows, interrupted native runs, and subsequent smoke receipts.
- [ ] No account identifiers, private URLs, endpoints, credentials, or local paths remain.
- [ ] Text is readable at normal display size; the caption adds no unsupported claim.
- [ ] Source is labeled synthetic demo, and local vs Google verification is explicit.
- [ ] Relay, response, and feedback receipt remain distinct.

Unchecked items are pending checks, not failures or implied passes. Submission
format and destination remain unspecified; adapt dimensions and ordering when
those requirements are provided. Do not submit from this preparation workflow.
