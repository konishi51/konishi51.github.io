# Development environment

## Required tools

- Git
- Python 3 (for migration checks)
- Node.js (for client-side search checks)
- Ruby 3.3.11 (from `.ruby-version`)
- Bundler 2.6.9 (from `Gemfile.lock`)

No GitHub CLI authentication is required for local development. The repository may be fetched anonymously from the single permitted repository, `konishi51/konishi51.github.io`.

## First setup

Install Ruby 3.3.11 with the Ruby version manager available on the machine, then run:

```sh
script/bootstrap
script/doctor
script/test
```

`script/bootstrap` installs gems into `vendor/bundle`. It is safe to run again.

## Ruby and libyaml

Ruby must include Psych, its YAML extension. Psych requires libyaml when Ruby is built. Install the libyaml development package before installing Ruby:

- Ubuntu/Debian: `sudo apt-get install libyaml-dev`
- macOS with Homebrew: `brew install libyaml`

Then install Ruby 3.3.11 with the machine's Ruby version manager. The manager normally detects libyaml automatically. Confirm the result with:

```sh
ruby -rpsych -e 'puts Psych.libyaml_version.join(".")'
```

If OS packages cannot be installed, build libyaml into a writable local prefix, then point the Ruby build at that prefix. With a version manager, use its supported configure-options mechanism. When building Ruby directly, the relevant option is:

```sh
./configure --prefix=/path/to/ruby --with-libyaml-dir=/path/to/libyaml
make
make install
```

The libyaml prefix must contain `include/yaml.h` and `lib/libyaml`. `script/bootstrap` and `script/doctor` deliberately stop if Psych cannot load, so an incomplete Ruby installation is not mistaken for a working environment.

## Daily workflow

```sh
script/doctor
bundle exec jekyll serve
```

Before handing off a change:

```sh
script/test
git status --short
```

The build and gem directories are ignored. Tests should not alter tracked files.

## What the checks mean

- `script/doctor` reports local tool availability and versions. It identifies a GitHub CLI binary separately from whether it is on `PATH`; it deliberately does not use CLI authentication.
- `script/test` runs the two migration checks, builds Jekyll in production mode, checks search and tag filtering, and checks post and generated HTML counts.
- The GitHub connector available to ChatGPT is separate from GitHub CLI and cannot be diagnosed reliably by a repository script.

## External services

Use only read-only checks unless a separate write step has been explicitly approved.

- GitHub: only `konishi51/konishi51.github.io` may be accessed.
- Cloudinary: hosts migrated article images. Credentials are unnecessary for ordinary builds.
- Supabase: retained migration records; it is not required for a normal site build.
- Asablo: source for comparison when restoring legacy formatting.

If Ruby is missing or lacks Psych/libyaml, `script/doctor` reports the exact blocker. Install a complete build of the version in `.ruby-version`, then rerun bootstrap; do not silently substitute another Ruby version.
