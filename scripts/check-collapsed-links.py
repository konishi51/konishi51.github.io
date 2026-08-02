#!/usr/bin/env python3
"""Detect migration artifacts that collapse standalone Markdown links."""

from pathlib import Path
import re
import sys


POSTS_DIR = Path(__file__).resolve().parents[1] / "_posts"
STANDALONE_LINK = re.compile(r"^\s*\[[^]]+\]\([^)]+\)\s*$")
MALFORMED_HTTP = re.compile(r"\]\(hhttp(?:s)?://")
COLLAPSED_LINK_THRESHOLD = 5


def inspect_post(text: str) -> list[str]:
    failures: list[str] = []
    paragraph: list[tuple[int, str]] = []

    def inspect_paragraph() -> None:
        link_lines = [number for number, line in paragraph if STANDALONE_LINK.match(line)]
        if len(link_lines) >= COLLAPSED_LINK_THRESHOLD:
            failures.append(
                f"standalone links collapse into one paragraph at lines "
                f"{link_lines[0]}-{link_lines[-1]} ({len(link_lines)} links)"
            )

    for number, line in enumerate(text.splitlines(), start=1):
        if line.strip():
            paragraph.append((number, line))
        else:
            inspect_paragraph()
            paragraph = []

        if MALFORMED_HTTP.search(line):
            failures.append(f"malformed hhttp URL at line {number}")
    inspect_paragraph()
    return failures


def main() -> int:
    failures: list[str] = []
    for post in sorted(POSTS_DIR.glob("*.md")):
        for failure in inspect_post(post.read_text(encoding="utf-8")):
            failures.append(f"{post.relative_to(POSTS_DIR.parent)}: {failure}")

    if failures:
        print("Possible collapsed or malformed Markdown links:")
        print("\n".join(failures))
        return 1

    print("No collapsed or malformed Markdown links found.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
