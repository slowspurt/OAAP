# Onboarding configuration drafts

These examples are setup drafts. Both have `receiver: null`; running onboarding
with a valid repository and no receiver produces `awaiting_receiver`, not active
OAAP instructions or a working integration.

- `basic.json`: Replace repository and feedback-destination placeholders before
  running the CLI. Unresolved placeholders are rejected.
- `duobrain.json`: Assessment-only configuration for
  `https://github.com/slowspurt/duobrain`. No receiver is selected, and this example
  does not apply OAAP to Duobrain or provide customer evidence.

Review the repository, feedback destination, questions, and intended use for your
project. The intended-use text is shown to users, so keep it focused on how the
maintainer will use feedback they authorize for sharing.

Follow [clone-and-run onboarding](../../docs/ONBOARDING.md) or the
[AI-assisted workflow](../../docs/AI_ONBOARDING.md).
