# Lack Thereof project status

Last updated: 2026-08-09

## Current state

- Production repository: `konishi51/konishi51.github.io`
- Default branch: `main`
- Published site: <https://blog.lackthereof.info/>
- Stack: Jekyll, Minima, GitHub Pages
- Articles in `_posts/`: 315 (313 legacy articles and 2 new articles)
- Legacy images have been migrated to Cloudinary. A small set of repository-local images remains intentionally.

The latest article on the current `main` snapshot is `2026-08-03-human-github-actions.md`.

The restartable environment has been verified locally with Ruby 3.3.11, Bundler 2.6.9, and Psych/libyaml. The production Jekyll build generates 319 HTML files from 315 posts, including the full-text search page.

Intentional line breaks lost during migration have been restored. The site now includes a client-side full-text search over article titles, tags, and bodies. Its static JSON index is loaded only on the search page; whitespace-separated terms use AND matching.

## Working boundaries

Read `AGENTS.md` before making changes. In particular:

- Preserve existing article text unless an edit is explicitly requested.
- Keep original articles separate from generated metadata and summaries.
- Do not commit, push, publish, open a pull request, merge, or change GitHub settings without explicit approval.
- GitHub access is restricted to `konishi51/konishi51.github.io`; do not view or operate on `konishi51/lack-thereof-rag` or any other repository.
- Do not use GitHub CLI (`gh`) or attempt to authenticate it. GitHub CLI must not be a prerequisite of any project workflow.
- For approved GitHub operations, use the ChatGPT GitHub App. Its access to another repository does not expand this project's permitted scope.

## Resume here

1. Read this file, `AGENTS.md`, and `docs/ENVIRONMENT.md`.
2. Run `script/doctor` to inspect the current machine without changing it.
3. Run `script/bootstrap` to install the locked gems after Ruby 3.3.11 is available.
4. Run `script/test` before handing off changes.
5. Report changed files, checks run, and anything not verified.

## Next site task

Consider tag-based browsing separately from full-text search. Keep the existing all-article title list on the home page.

External services used by the project are GitHub Pages, Cloudinary, Supabase (migration records), and the legacy Asablo pages. Connectivity checks must be read-only. Cloudinary credentials are not required for the next task.

New article images are uploaded to Cloudinary through the repository workflow
described in `docs/IMAGE_UPLOADS.md`. The `CLOUDINARY_URL` Actions secret is
used only by that workflow and must not be copied into repository files or chat.
The established handoff procedure is: place exactly one received image on a
temporary `agent/cloudinary-upload-*` branch, open an upload PR, obtain the
Cloudinary URL from the one-day workflow artifact, verify SHA-256 and byte counts
across the received file, staged file, and Cloudinary delivery, then close the
upload PR without merging. The cleanup job deletes the temporary branch. Only
the verified Cloudinary URL belongs in the article; the image must not remain on
`main`. Matching dimensions alone are not an integrity check.
