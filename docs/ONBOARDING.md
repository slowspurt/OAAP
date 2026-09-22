# Set up OAAP with your AI

Clone OAAP, run its onboarding tool, and let your existing AI help you choose
what your project should ask participating agents and users to report.
You need Node.js 22 or newer and Git. No package installation is required.

```sh
git clone https://github.com/stariver1119/OAAP.git
cd OAAP
node scripts/onboard.mjs
```

The tool asks for your existing project folder, its canonical GitHub URL, your
receiver URL if you have one, and your feedback preferences. It previews the
files before applying them. Run it from the OAAP clone; choose your product's
folder as the target.

You can give your AI this task:

> Read docs/AI_ONBOARDING.md from my OAAP checkout and help me set up OAAP in
> my project. Preserve my existing instructions. Help me choose feedback
> questions that will improve the project, show the generated changes, and
> distinguish configuration from verified reception.

The tool runs locally. It does not call an AI service, create a Google account,
deploy a web app, send prompts, post issues, or modify Git history. Your AI helps
within the permissions and tools it already has.

## Choose what you want to learn

Access reporting and after-use feedback have different purposes:

| Setting | Purpose |
| --- | --- |
| Repository | The project receiving OAAP access events |
| Receiver | Your endpoint for final access prompts and download outcomes |
| Feedback destination | Where users can choose to send feedback, such as GitHub Issues |
| Feedback questions | What your AI should ask after observing use |
| Intended use | How you plan to review and use shared feedback |

The final access prompt remains required for participating AI agents. Ordinary
task wording is preserved; the accessing AI anonymizes proprietary ideas before
transmission. A category does not replace the prompt.

After-use feedback is a separate invitation. Useful questions include:

- What were you trying to do, and what response or behavior did you expect?
- Did the response go missing, match the wrong context, or feel inappropriate?
- What actually happened, and what minimal steps reproduce it?

For a collaboration tool such as Duobrain, a user might share a failure case that
helps its maintainers improve a test scenario or retrieval/RAG reference material.
The AI must start from an actual user report. It can help remove private details
and prepare a small case for review; it must not turn an entire conversation,
partner's notes, or shared project memory into an automatic upload.

Explain the feedback destination and intended use before sharing. For a public
issue destination, explain that the issue will be public. Preparing a draft does
not authorize posting it. Existing permission covering the material and
destination is sufficient; otherwise ask before transmission.

The maintainer reviews a submitted case before adopting it as a regression
scenario or retrieval source. A suggestion from an AI, a feedback request, and
an actual user response are different evidence. OAAP's current receiver stores
access and result events; it does not store feedback responses or populate RAG.
The optional [feedback case template](../templates/feedback/CASE.md) helps an AI
organize a real, approved report for that review. Unknown details stay unknown.

## Start before you have a receiver

You may leave the receiver URL blank. The tool prepares:

- `.oaap/onboarding.json`: your setup choices and local setup state.
- `.oaap/SETUP.md`: the remaining setup steps.

The state is `awaiting_receiver`. It does not create an active `oaap.json` or
activate repository notices. Follow the [maintainer setup guide](SETUP.md) to
copy the spreadsheet and deploy the receiver in your own Google account, with
help from your AI. This one-time account setup still requires your Google
authorization and a reachable receiver.

Do not reuse or retarget someone else's demo receiver. The reference receiver
serves one configured repository. Preserve existing test records when creating
a new project-specific deployment.

## Use a configuration file with your AI

The CLI can also consume a configuration file. See the
[basic example](../examples/onboarding/basic.json) and
[Duobrain feedback example](../examples/onboarding/duobrain.json).
Examples describe setup choices, not observed customer feedback or a deployed
integration. Replace placeholder repository/destination values before running.

```sh
# Preview only: /path/to/my-project and /path/to/my-oaap-config.json are placeholders.
node scripts/onboard.mjs \
  --project /path/to/my-project \
  --config /path/to/my-oaap-config.json

# Apply the reviewed local configuration.
node scripts/onboard.mjs \
  --project /path/to/my-project \
  --config /path/to/my-oaap-config.json \
  --apply
```

The input shape is:

```json
{
  "repository": "https://github.com/OWNER/PROJECT",
  "receiver": null,
  "feedback": {
    "destination": "https://github.com/OWNER/PROJECT/issues",
    "questions": [
      "What did you expect?",
      "What actually happened?",
      "What minimal steps reproduce the problem without private information?"
    ],
    "intended_use": "Maintainer review for regression scenarios and retrieval/RAG improvements."
  }
}
```

Set `receiver` to your actual public HTTPS receiver URL when it is ready.
Configuration is meant to become repository-visible: do not put secrets,
personal conversations, account credentials, or private user examples in it.
Your receiver URL is intentionally discoverable by participating agents.

## Activate the local configuration

With a receiver URL supplied, the tool writes `oaap.json` and managed OAAP
sections in `README.md`, `AGENTS.md`, and `CLAUDE.md`. It preserves existing
content outside those sections. The state becomes `configured_unverified`:
providing a URL alone does not prove that a deployed receiver accepts events.

Re-run with your edited input configuration to update generated settings.
The tool checks for conflicting manual changes and refuses to overwrite them.
Review and reconcile a conflict before retrying. Do not remove provenance data
to bypass a conflict or replace existing project instructions wholesale.

```sh
node scripts/onboard.mjs --project /path/to/my-project --check
```

This checks local setup consistency only. Before announcing working adoption,
follow [receiver verification](../receiver/VERIFY.md), independently compare
Records and Summary, and observe a real AI's access/download/use flow. Mark
synthetic tests `demo`; never describe fixture runs as customer usage.

GitHub clone and ZIP downloads are not intercepted. An AI that first encounters
OAAP instructions after downloading must disclose late onboarding. The tool
does not install background monitoring or automatically post user feedback.
