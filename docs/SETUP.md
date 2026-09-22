# Maintainer setup

Start with the [local onboarding tool](ONBOARDING.md) to choose your project
and feedback settings, optionally with help from your existing AI. You can
prepare those choices before a receiver exists. The steps below provision
the maintainer-owned Google receiver; cloning OAAP alone does not deploy it.

1. Download [OAAP-maintainer-template.xlsx](../templates/sheets/OAAP-maintainer-template.xlsx),
   upload it to your own Google Drive, open it in Google Sheets, and choose
   File → Save as Google Sheets. Keep the resulting native sheet private.
   The three tabs are `Summary`, `Records`, and `Settings`. Start with an empty
   Records tab and zero Summary counts. Update `Settings!B5` to the reporting
   date, or enter `=TODAY()` for a rolling report.
2. Open Extensions → Apps Script in your copied sheet, or create a separate Apps
   Script project in your own account. Paste `receiver/Code.gs` into `Code.gs`.
3. In Project Settings → Script Properties, add `SPREADSHEET_ID` (the copied sheet
   ID) and `REPOSITORY` (the exact canonical `https://github.com/OWNER/REPO` URL).
4. Set the sheet timezone and script timezone to UTC. Ensure `Records` has 2,001
   rows, including the header, and Summary formulas end at row 2,001. Importing
   or inserting rows can expand formula references: inspect and restore the
   report ranges before reception. Preserve the 11 Records headers exactly.
5. Deploy → New deployment → Web app. Execute as yourself; allow Anyone for
   unauthenticated agent POSTs. Review Google's requested Sheets permission.
   The reference receiver only opens the configured sheet, but Google may display
   account-wide Sheets access because web apps use `openById`.
6. Put the `/exec` deployment URL in `Settings!B8` and `oaap.json`, replacing
   repository placeholders with your canonical repository URL. Append or merge
   the OAAP notice into existing README.md, AGENTS.md, and CLAUDE.md files;
   preserve the project's existing instructions. Create a template file only
   when that file does not already exist. Review the diff before publishing.
7. Send synthetic `demo` events and verify Records and Summary before changing
   the Summary reporting source to `live`. The live-demo driver defaults to
   `https://github.com/example/demo`; set `OAAP_REPOSITORY` to the exact repository
   configured on the receiver being tested. It still clones a synthetic local
   fixture and sends `demo` events, even when this setting names your project.
   Never relabel an existing receiver serving another repository to run a test.
   Follow [the verification guide](../receiver/VERIFY.md) and independently
   reconcile test rows before claiming that reception works.

Copying a bound script does not copy its published deployment. Each maintainer
must authorize and deploy their own copy. A standalone script must be copied
separately. No credentials should be committed to a public repository.

The PoC intentionally caps intake at 2,000 records. Changing a Settings label alone
does not raise this limit. Before scaling, extend both the receiver capacity and
the report/validation ranges together, and test Apps Script quotas and spam controls.

Official implementation references:
- [Apps Script web apps and deployment](https://developers.google.com/apps-script/guides/web)
- [Bound script capabilities and limitations](https://developers.google.com/apps-script/guides/bound)
- [Google service authorization](https://developers.google.com/apps-script/guides/services/authorization)
