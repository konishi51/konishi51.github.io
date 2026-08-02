#!/usr/bin/env python3
"""Fail when a Markdown paragraph contains multiple Japanese bullet lines."""

from pathlib import Path
import re
import sys


POSTS_DIR = Path(__file__).resolve().parents[1] / "_posts"
BULLET_LINE = re.compile(r"^・")


def collapsed_list_lines(text: str) -> list[int]:
    hits: list[int] = []
    paragraph: list[tuple[int, str]] = []

    def inspect() -> None:
        bullet_lines = [number for number, line in paragraph if BULLET_LINE.match(line)]
        if len(bullet_lines) > 1:
            hits.extend(bullet_lines)

    for number, line in enumerate(text.splitlines(), start=1):
        if line.strip():
            paragraph.append((number, line))
        else:
            inspect()
            paragraph = []
    inspect()
    return hits


def main() -> int:
    failures = []
    for post in sorted(POSTS_DIR.glob("*.md")):
        lines = collapsed_list_lines(post.read_text(encoding="utf-8"))
        if lines:
            failures.append(f"{post.relative_to(POSTS_DIR.parent)}: {', '.join(map(str, lines))}")

    if failures:
        print("Possible collapsed Japanese bullet lists:")
        print("\n".join(failures))
        return 1

    print("No collapsed Japanese bullet lists found.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
