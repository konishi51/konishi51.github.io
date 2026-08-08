# Lack Thereof project status

Last updated: 2026-08-08

## Current state

- Production repository: `konishi51/konishi51.github.io`
- Default branch: `main`
- Published site: <https://blog.lackthereof.info/>
- Stack: Jekyll, Minima, GitHub Pages
- Articles in `_posts/`: 315 (313 legacy articles and 2 new articles)
- Legacy images have been migrated to Cloudinary. A small set of repository-local images remains intentionally.

The latest article on the current `main` snapshot is `2026-08-03-human-github-actions.md`.

The restartable environment has been verified locally with Ruby 3.3.11, Bundler 2.6.9, and Psych/libyaml. The production Jekyll build generated 318 HTML files from 315 posts.

## Working boundaries

Read `AGENTS.md` before making changes. In particular:

- Preserve existing article text unless an edit is explicitly requested.
- Keep original articles separate from generated metadata and summaries.
- Do not commit, push, publish, open a pull request, merge, or change GitHub settings without explicit approval.
- GitHub access is restricted to `konishi51/konishi51.github.io`.
- Do not use GitHub CLI authentication while its Organization permission issue remains unresolved.

## Resume here

1. Read this file, `AGENTS.md`, and `docs/ENVIRONMENT.md`.
2. Run `script/doctor` to inspect the current machine without changing it.
3. Run `script/bootstrap` to install the locked gems after Ruby 3.3.11 is available.
4. Run `script/test` before handing off changes.
5. Report changed files, checks run, and anything not verified.

## Next content task

Restore intentional line breaks lost during migration. The inherited investigation identified 86 articles and 146 paragraphs for direct comparison with the original Asablo pages. Preserve the original prose while restoring lists, schedules, dialogue, tables, and standalone links according to their original structure.

External services used by the project are GitHub Pages, Cloudinary, Supabase (migration records), and the legacy Asablo pages. Connectivity checks must be read-only. Cloudinary credentials are not required for the next task.
