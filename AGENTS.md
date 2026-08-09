# Lack Thereof project guidance

For the current project state and environment setup, read `PROJECT_STATUS.md` and `docs/ENVIRONMENT.md` before starting work.

## Project purpose

This repository contains the Lack Thereof blog. It may later include a Wiki, structured article metadata, and materials describing the author's writing style and perspective.

## Working rules

- Preserve existing article text unless explicitly asked to edit it.
- Do not publish, merge, push, or modify GitHub settings without explicit approval.
- Keep each task within the files and scope explicitly requested.
- Do not add dependencies, plugins, workflows, generated files, or site-wide features unless explicitly requested.
- Before changing an existing file, inspect its current structure and conventions.
- After making changes, perform applicable checks and report anything that could not be verified.
- Clearly distinguish facts confirmed from repository files from assumptions or proposals.
- Keep reports concise unless a detailed explanation is requested.

## Repository and GitHub access

- The only repository that may be viewed or operated on for this project is `konishi51/konishi51.github.io`.
- Do not view or operate on any other repository, including `konishi51/lack-thereof-rag`, even if a connected GitHub App can access it.
- Do not use GitHub CLI (`gh`) for any task in this project.
- Do not run `gh auth login` or otherwise authenticate GitHub CLI.
- Do not adopt a workflow that requires GitHub CLI. Use the ChatGPT GitHub App for approved GitHub operations, and use ordinary `git` only where the current environment already supports the requested operation without `gh` authentication.

## Content rules

- New article prose requires review by とうち before publication.
- Preserve the distinction between original article text and later annotations or corrections.
- Keep source articles separate from AI-generated metadata, summaries, persona descriptions, and Wiki material.
- Do not rewrite prose merely for consistency, clarity, or style unless explicitly asked.
- When handling factual material, distinguish confirmed facts, memories, conjectures, and later corrections where relevant.

## Change handoff

- Summarize what changed.
- List the files changed.
- Report checks performed and their results.
- Leave the changes for review; do not commit, push, publish, or open a pull request unless explicitly requested.
