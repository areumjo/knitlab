# How to publish a design to Explore

Knitlab's **Explore** is a public gallery of community-shared knitting charts. You can browse what others have made, fork their designs to start your own variations, and share your work back. This guide walks you through publishing.

> **Heads up:** publishing a design makes it permanently public on GitHub and visible to anyone visiting the gallery. Don't publish anything you wouldn't want others to download, modify, or share.

## What you need before you start

- A finished chart you want to share (it's fine if you keep iterating later — submissions are immutable, but you can publish updates as new entries).
- A **GitHub account**. Submissions go through GitHub Issues, so you'll need to be signed in. If you don't have an account, [create one for free](https://github.com/signup) — takes about a minute.

## Step 1 — Open the Publish dialog

In the editor, click the **share icon** in the top toolbar.

> ![screenshot: editor header with the share icon highlighted](./images/publish-01-share-button.png)

A dialog will open titled **"Publish to Explore"**.

## Step 2 — Fill in the form

You'll see the following fields:

- **Title** *(required, max 80 characters)* — What people will see in the gallery. Be specific: "Cabled beanie front panel" beats "My chart."
- **Display name** — Optional. Leave blank to credit your GitHub username automatically.
- **Description** — Optional, up to 500 characters. Note constraints (gauge assumption, needle size if relevant), special techniques used, or what inspired it.
- **Tags** — Comma-separated, lowercase. Helps people find your work. Examples: `lace, hat, beginner` or `cable, sweater, advanced`.

A small preview of your chart appears next to the form. That preview becomes the thumbnail in the gallery.

> ![screenshot: publish modal form view filled in](./images/publish-02-form.png)

If you opened your chart by forking another design from Explore, you'll see a small "Remix of …" badge at the top of the form. Credit will carry through to the gallery automatically — no extra steps needed.

When you're happy, click **Continue to Submit**.

## Step 3 — Copy & open GitHub

You'll see a confirmation screen with a single primary button: **"Copy submission & open GitHub."** Click it. Two things happen at once:

1. Your full submission (chart payload + thumbnail + metadata) is copied to your clipboard.
2. A new tab opens to GitHub's "New issue" page with the title pre-filled.

> ![screenshot: confirmation view with the copy & open button](./images/publish-03-confirm.png)

## Step 4 — Paste into the GitHub issue body

On the GitHub page, you'll see a mostly empty issue form with the title set. **Click into the description / body field** (the large empty text area below the title) and paste with **Cmd+V** (Mac) or **Ctrl+V** (Windows/Linux).

> ![screenshot: github issue page with body field highlighted, before pasting](./images/publish-04-github-empty.png)

After pasting, you'll see a structured body with sections like `### Title`, `### Description`, `### Thumbnail`, etc. Don't edit any of this — it's already in the format the Action expects.

> ![screenshot: github issue page after pasting, showing structured body](./images/publish-05-github-pasted.png)

## Step 5 — Submit

Click **"Submit new issue"** at the bottom of the GitHub page. That's it from your side.

> ![screenshot: submit button at bottom of github form](./images/publish-06-submit.png)

## What happens next

1. Your issue lands in the knitlab repo with the `design-submission` label automatically applied.
2. A maintainer reviews the submission (this is human; usually within a few days).
3. If everything looks good, the maintainer approves it. A bot then commits your design files and updates the gallery.
4. **Within ~2 minutes of approval**, your design appears in the Explore gallery. The bot leaves a "Design published!" comment on your issue and closes it.
5. If something needs fixing, the bot or maintainer will comment on your issue with details. You can edit your issue body and re-request approval.

## How to remix someone else's design

1. Open Explore (the **grid icon** in the editor toolbar).
2. Click any design that interests you.
3. In the detail view, click **"Open in Editor"**. If you have unsaved work in your current chart, you'll be asked to confirm before replacing it.
4. The design loads into your editor. Edit freely.
5. When you publish your remix, the original creator is credited automatically — you'll see a "Remix of …" badge in the Publish form, and the gallery will show "Remix of …" on your published version.

Knitting is a community tradition of building on each other's patterns; this is the modern version of "I started from your design, with thanks."

## Troubleshooting

**"My submission was rejected for being a duplicate."**
The publish flow shows an amber warning if your chart is identical to the design you opened it from. Edit the chart at least a little before publishing, or it'll be rejected as a duplicate.

**"GitHub opened but the body is empty / doesn't look structured."**
You probably opened GitHub before pasting. Go back to knitlab, click "Copy submission & open GitHub" again — paste right after the GitHub tab loads.

**"My chart's thumbnail looks wrong in the preview."**
The thumbnail is generated from your active sheet only. If the chart you want shown isn't your active sheet, switch to it in the editor and reopen the Publish dialog.

**"I want to take down a published design."**
Comment on your original GitHub issue requesting removal, or open a new issue describing what you'd like removed. The maintainer will handle it.

**"Can I edit a published design?"**
Designs are immutable once published, but you can publish a corrected version as a new entry. The old one can stay or be removed at the maintainer's discretion. For tiny fixes (typo in description, wrong tag), comment on the issue and the maintainer can edit the manifest directly.

---

If you run into something this guide doesn't cover, [open a question issue](https://github.com/areumjo/knitlab/issues/new) on the repo.
